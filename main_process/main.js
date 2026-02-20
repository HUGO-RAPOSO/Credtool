const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getDb, initDb, hashPassword } = require('./db');
const { addMonths, isPast, addDays } = require('date-fns');
const { execSync } = require('child_process');
const reports = require('./reports');

// Only used for Windows installer shortcuts
try {
    if (require('electron-squirrel-startup')) {
        app.quit();
    }
} catch (e) {
    // Ignore if not present
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        backgroundColor: '#0f172a',
    });

    // In development, load from Vite dev server
    // In production, load from the built dist/index.html
    const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    initDb();
    const db = getDb();

    // ─── INTEREST LOGIC ──────────────────────────────────────────────────────
    function autoProcessInterest() {
        const activeLoans = db.prepare("SELECT * FROM loans WHERE status = 'ACTIVE'").all();
        const now = new Date();

        activeLoans.forEach(loan => {
            const lastCalc = new Date(loan.last_interest_calc);
            const diffDays = Math.floor((now - lastCalc) / (1000 * 60 * 60 * 24));

            if (diffDays >= 30) {
                // Calculate interest based on the CURRENT debt (remaining_balance)
                const interestAmount = loan.remaining_balance * (loan.rate / 100);
                const newBalance = loan.remaining_balance + interestAmount;

                db.prepare('UPDATE loans SET remaining_balance = ?, last_interest_calc = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(newBalance, loan.id);

                console.log(`[Interest] Added ${interestAmount} to loan #${loan.id} (Client: ${loan.client_id})`);
            }
        });
    }

    // Run on startup
    autoProcessInterest();
    // Run every 2 hours as well for long-running sessions
    setInterval(autoProcessInterest, 1000 * 60 * 60 * 2);

    // ─── LICENSE ─────────────────────────────────────────────────────────────
    ipcMain.handle('check-license', () => {
        const license = db.prepare('SELECT * FROM licenses ORDER BY activated_at DESC LIMIT 1').get();
        if (!license) return { valid: false, reason: 'Nenhuma licença encontrada' };

        const expiresAt = new Date(license.expires_at);
        if (isPast(expiresAt)) {
            return { valid: false, reason: 'Licença expirada' };
        }
        return { valid: true, type: license.type, expiresAt: license.expires_at };
    });

    ipcMain.handle('check-license-live', async () => {
        try {
            const license = db.prepare('SELECT * FROM licenses ORDER BY activated_at DESC LIMIT 1').get();
            if (!license) return { valid: false, reason: 'Nenhuma licença encontrada' };

            const machineId = getMachineId();
            const remoteResult = await validateLicenseRemote(license.key, machineId);

            if (!remoteResult.success) {
                // Se o erro for explicitamente "desativada", podemos dar um status especial
                if (remoteResult.message.includes('desativada')) {
                    return {
                        valid: false,
                        blocked: true,
                        reason: remoteResult.message,
                        contact: "+258 879877288"
                    };
                }
                // Se for outro erro (ex: sem net), confiamos na validação local do check-license normal
                return { valid: true, type: license.type, expiresAt: license.expires_at };
            }

            // Se chegou aqui, a licença está ok no servidor
            const expiresAt = new Date(license.expires_at);
            if (isPast(expiresAt)) {
                return { valid: false, reason: 'Licença expirada' };
            }

            return { valid: true, type: license.type, expiresAt: license.expires_at };
        } catch (err) {
            // Em caso de erro catastrófico (ex: API offline), mantemos as regras locais
            return { error: true };
        }
    });

    // ─── UTILS: MACHINE ID ──────────────────────────────────────────────────
    function getMachineId() {
        try {
            // Windows specific UUID retrieval
            const output = execSync('wmic csproduct get uuid').toString();
            const uuid = output.split('\n')[1].trim();
            return uuid || 'UNKNOWN-ID';
        } catch (e) {
            return 'NODE-ID-' + process.env.COMPUTERNAME || 'GENERIC-PC';
        }
    }

    const { validateLicenseRemote } = require('./firebase');

    // ─── ONLINE LICENSE VALIDATION (FIREBASE) ───────────────────────────────
    // O sistema agora comunica diretamente com o Firestore para validar chaves.

    ipcMain.handle('get-machine-id', () => {
        return getMachineId();
    });

    ipcMain.handle('activate-license', async (event, key) => {
        try {
            const machineId = getMachineId();

            // 1. Firebase Validation (Online Check)
            const remoteResult = await validateLicenseRemote(key, machineId);

            if (!remoteResult.success) {
                return { success: false, message: remoteResult.message };
            }

            // 2. Map Firebase results to activation logic
            let type = remoteResult.type || 'ANNUAL';
            let isDemo = type === 'DEMO';
            let durationMonths = type === 'ANNUAL' ? 12 : 1;

            // 3. Machine Lock for DEMO
            if (isDemo) {
                const demoUsed = db.prepare('SELECT * FROM licenses WHERE type = "DEMO"').get();
                if (demoUsed) {
                    return { success: false, message: 'Já utilizaste o período de demonstração neste computador.' };
                }
            }

            // 4. Local Activation
            const expiresAt = isDemo
                ? addDays(new Date(), 3).toISOString()
                : addMonths(new Date(), durationMonths).toISOString();

            db.prepare('INSERT OR REPLACE INTO licenses (key, type, activated_at, expires_at) VALUES (?, ?, ?, ?)')
                .run(key, type, new Date().toISOString(), expiresAt);

            return { success: true, type, expiresAt };
        } catch (err) {
            console.error('Erro na ativação:', err);
            return { success: false, message: 'Falha na conexão ou servidor de licenças offline.' };
        }
    });

    // ─── AUTH ────────────────────────────────────────────────────────────────
    ipcMain.handle('auth-login', (event, { username, password }) => {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) return { success: false, message: 'Utilizador não encontrado' };
        if (user.password_hash !== hashPassword(password)) {
            return { success: false, message: 'Palavra-passe incorrecta' };
        }
        return {
            success: true,
            user: { id: user.id, username: user.username, role: user.role }
        };
    });

    ipcMain.handle('auth-change-password', async (event, { userId, oldPassword, newPassword }) => {
        try {
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            if (!user) return { success: false, message: 'Utilizador não encontrado' };

            if (user.password_hash !== hashPassword(oldPassword)) {
                return { success: false, message: 'A palavra-passe actual está incorrecta' };
            }

            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                .run(hashPassword(newPassword), userId);

            return { success: true, message: 'Palavra-passe alterada com sucesso' };
        } catch (err) {
            console.error('Erro ao alterar password:', err);
            return { success: false, message: 'Erro interno ao alterar palavra-passe' };
        }
    });

    // ─── CLIENTS ─────────────────────────────────────────────────────────────
    ipcMain.handle('db-get-clients', () =>
        db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all()
    );

    ipcMain.handle('db-create-client', (e, client) => {
        const stmt = db.prepare(
            'INSERT INTO clients (name, phone, address, bi) VALUES (@name, @phone, @address, @bi)'
        );
        return stmt.run(client);
    });

    ipcMain.handle('db-update-client', (e, client) => {
        return db.prepare(`
            UPDATE clients 
            SET name = @name, phone = @phone, address = @address, bi = @bi 
            WHERE id = @id
        `).run(client);
    });

    ipcMain.handle('db-delete-client', (e, id) => {
        const deleteTx = db.transaction((clientId) => {
            // Delete payments for all loans of this client
            db.prepare(`
                DELETE FROM payments 
                WHERE loan_id IN (SELECT id FROM loans WHERE client_id = ?)
            `).run(clientId);
            // Delete loans
            db.prepare('DELETE FROM loans WHERE client_id = ?').run(clientId);
            // Delete client
            return db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
        });
        return deleteTx(id);
    });

    // ─── LOANS ───────────────────────────────────────────────────────────────
    ipcMain.handle('db-get-loans', () => {
        return db.prepare(`
            SELECT loans.*, clients.name as client_name
            FROM loans
            JOIN clients ON loans.client_id = clients.id
            ORDER BY loans.created_at DESC
        `).all();
    });

    ipcMain.handle('db-create-loan', (e, loan) => {
        const dueDate = addMonths(new Date(), loan.term_months).toISOString();
        const initialInterest = loan.amount * (loan.rate / 100);
        const initialBalance = loan.amount + initialInterest;

        const stmt = db.prepare(`
            INSERT INTO loans (client_id, amount, rate, term_months, remaining_balance, due_date, notes)
            VALUES (@client_id, @amount, @rate, @term_months, @initialBalance, @due_date, @notes)
        `);
        return stmt.run({ ...loan, due_date: dueDate, initialBalance });
    });

    // ─── PAYMENTS ────────────────────────────────────────────────────────────
    ipcMain.handle('db-add-payment', (e, payment) => {
        const addPaymentTx = db.transaction((p) => {
            const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(p.loan_id);
            if (!loan) return { success: false, message: 'Empréstimo não encontrado' };
            if (loan.status !== 'ACTIVE') return { success: false, message: 'Empréstimo não está activo' };

            db.prepare('INSERT INTO payments (loan_id, amount, notes) VALUES (@loan_id, @amount, @notes)').run(p);

            const newBalance = Math.max(0, loan.remaining_balance - p.amount);
            const newStatus = newBalance <= 0 ? 'PAID' : 'ACTIVE';
            db.prepare('UPDATE loans SET remaining_balance = ?, status = ? WHERE id = ?')
                .run(newBalance, newStatus, p.loan_id);

            return { success: true, newBalance, newStatus };
        });
        return addPaymentTx(payment);
    });

    ipcMain.handle('db-get-loan-history', (e, loanId) => {
        return db.prepare('SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC').all(loanId);
    });

    ipcMain.handle('db-delete-loan', (e, id) => {
        const deleteTx = db.transaction((loanId) => {
            db.prepare('DELETE FROM payments WHERE loan_id = ?').run(loanId);
            return db.prepare('DELETE FROM loans WHERE id = ?').run(loanId);
        });
        return deleteTx(id);
    });

    ipcMain.handle('db-update-loan', (e, loan) => {
        return db.prepare(`
            UPDATE loans 
            SET notes = @notes, 
                term_months = @term_months,
                status = @status
            WHERE id = @id
        `).run(loan);
    });

    // ─── DASHBOARD ───────────────────────────────────────────────────────────
    ipcMain.handle('db-get-dashboard-stats', () => {
        const totalLoans = db.prepare('SELECT COUNT(*) as count FROM loans').get().count;
        const activeLoans = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'ACTIVE'").get().count;
        const totalLent = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM loans').get().total;
        const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
        return { totalLoans, activeLoans, totalLent, totalClients };
    });

    // ─── REPORTS ─────────────────────────────────────────────────────────────
    ipcMain.handle('report-general-excel', async () => {
        const data = db.prepare(`
            SELECT loans.*, clients.name as client_name
            FROM loans
            JOIN clients ON loans.client_id = clients.id
            ORDER BY loans.created_at DESC
        `).all();
        return await reports.generateGeneralExcel(data);
    });

    ipcMain.handle('report-general-pdf', async () => {
        const data = db.prepare(`
            SELECT loans.*, clients.name as client_name
            FROM loans
            JOIN clients ON loans.client_id = clients.id
            ORDER BY loans.created_at DESC
        `).all();
        return await reports.generateGeneralPDF(data);
    });

    ipcMain.handle('report-client-excel', async (e, clientId) => {
        const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
        const loans = db.prepare('SELECT * FROM loans WHERE client_id = ?').all(clientId);
        const payments = db.prepare(`
            SELECT payments.* FROM payments 
            JOIN loans ON payments.loan_id = loans.id 
            WHERE loans.client_id = ?
        `).all(clientId);
        return await reports.generateClientExcel(client, loans, payments);
    });

    ipcMain.handle('report-client-pdf', async (e, clientId) => {
        const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
        const loans = db.prepare('SELECT * FROM loans WHERE client_id = ?').all(clientId);
        const payments = db.prepare(`
            SELECT payments.* FROM payments 
            JOIN loans ON payments.loan_id = loans.id 
            WHERE loans.client_id = ?
        `).all(clientId);
        return await reports.generateClientPDF(client, loans, payments);
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
