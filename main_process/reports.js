const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');

/**
 * Generate General Excel Report
 */
async function generateGeneralExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório Geral');

    worksheet.columns = [
        { header: 'Cliente', key: 'client_name', width: 25 },
        { header: 'Montante Emprestado', key: 'amount', width: 20 },
        { header: 'Taxa (%)', key: 'rate', width: 10 },
        { header: 'Saldo Pendente', key: 'remaining_balance', width: 20 },
        { header: 'Data Início', key: 'created_at', width: 15 },
        { header: 'Vencimento', key: 'due_date', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
    ];

    data.forEach(item => {
        worksheet.addRow({
            client_name: item.client_name,
            amount: item.amount,
            rate: item.rate,
            remaining_balance: item.remaining_balance,
            created_at: new Date(item.created_at).toLocaleDateString(),
            due_date: new Date(item.due_date).toLocaleDateString(),
            status: item.status
        });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    const { filePath } = await dialog.showSaveDialog({
        title: 'Guardar Relatório Geral (Excel)',
        defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, 'relatorio_geral.xlsx'),
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true, path: filePath };
    }
    return { success: false };
}

/**
 * Generate General PDF Report
 */
async function generateGeneralPDF(data) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório Geral de Empréstimos', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = data.map(item => [
        item.client_name,
        `${item.amount.toLocaleString()} MT`,
        `${item.rate}%`,
        `${item.remaining_balance.toLocaleString()} MT`,
        new Date(item.created_at).toLocaleDateString(),
        item.status
    ]);

    autoTable(doc, {
        startY: 35,
        head: [['Cliente', 'Emprestado', 'Taxa', 'Pendente', 'Início', 'Estado']],
        body: tableData,
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600 color
    });

    const { filePath } = await dialog.showSaveDialog({
        title: 'Guardar Relatório Geral (PDF)',
        defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, 'relatorio_geral.pdf'),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
        const buffer = Buffer.from(doc.output('arraybuffer'));
        fs.writeFileSync(filePath, buffer);
        return { success: true, path: filePath };
    }
    return { success: false };
}

/**
 * Generate Client Excel Report
 */
async function generateClientExcel(client, loans, payments) {
    const workbook = new ExcelJS.Workbook();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Resumo Cliente');
    summarySheet.columns = [
        { header: 'Cliente', key: 'name', width: 25 },
        { header: 'Telefone', key: 'phone', width: 15 },
        { header: 'B.I.', key: 'bi', width: 15 },
        { header: 'Dívida Total', key: 'total_debt', width: 20 },
    ];

    const totalDebt = loans.reduce((acc, curr) => acc + curr.remaining_balance, 0);
    summarySheet.addRow({
        name: client.name,
        phone: client.phone || 'N/A',
        bi: client.bi || 'N/A',
        total_debt: totalDebt
    });

    // Loans Sheet
    const loansSheet = workbook.addWorksheet('Empréstimos');
    loansSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Montante', key: 'amount', width: 20 },
        { header: 'Pendente', key: 'remaining_balance', width: 20 },
        { header: 'Data Início', key: 'created_at', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
    ];
    loans.forEach(loan => loansSheet.addRow({
        id: loan.id,
        amount: loan.amount,
        remaining_balance: loan.remaining_balance,
        created_at: new Date(loan.created_at).toLocaleDateString(),
        status: loan.status
    }));

    // Payments Sheet
    const paymentsSheet = workbook.addWorksheet('Histórico Pagamentos');
    paymentsSheet.columns = [
        { header: 'Loan ID', key: 'loan_id', width: 10 },
        { header: 'Valor Pago', key: 'amount', width: 20 },
        { header: 'Data', key: 'payment_date', width: 20 },
        { header: 'Notas', key: 'notes', width: 30 },
    ];
    payments.forEach(p => paymentsSheet.addRow({
        loan_id: p.loan_id,
        amount: p.amount,
        payment_date: new Date(p.payment_date).toLocaleString(),
        notes: p.notes || ''
    }));

    const { filePath } = await dialog.showSaveDialog({
        title: `Relatório Cliente - ${client.name} (Excel)`,
        defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, `relatorio_${client.name.replace(/\s+/g, '_')}.xlsx`),
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true, path: filePath };
    }
    return { success: false };
}

/**
 * Generate Client PDF Report
 */
async function generateClientPDF(client, loans, payments) {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('Relatório de Cliente', 14, 20);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Cliente: ${client.name}`, 14, 30);
    doc.setFont(undefined, 'normal');
    doc.text(`Telefone: ${client.phone || 'N/A'}`, 14, 37);
    doc.text(`B.I. / NUIT: ${client.bi || 'N/A'}`, 14, 44);

    const totalDebt = loans.reduce((acc, curr) => acc + curr.remaining_balance, 0);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`DÍVIDA TOTAL: ${totalDebt.toLocaleString()} MT`, 14, 55);
    doc.setTextColor(0);

    doc.setFontSize(14);
    doc.text('Empréstimos Activos', 14, 70);

    const loansData = loans.map(l => [
        l.id,
        `${l.amount.toLocaleString()} MT`,
        `${l.remaining_balance.toLocaleString()} MT`,
        new Date(l.created_at).toLocaleDateString(),
        l.status
    ]);

    const res = autoTable(doc, {
        startY: 75,
        head: [['ID', 'Montante', 'Pendente', 'Data', 'Estado']],
        body: loansData,
        headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = res.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Histórico de Pagamentos', 14, finalY);

    const paymentsData = payments.map(p => [
        p.loan_id,
        `${p.amount.toLocaleString()} MT`,
        new Date(p.payment_date).toLocaleString(),
        p.notes || ''
    ]);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Loan ID', 'Valor Pago', 'Data', 'Notas']],
        body: paymentsData,
        headStyles: { fillColor: [5, 150, 105] }, // Emerald-600
    });

    const { filePath } = await dialog.showSaveDialog({
        title: `Relatório Cliente - ${client.name} (PDF)`,
        defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, `relatorio_${client.name.replace(/\s+/g, '_')}.pdf`),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
        const buffer = Buffer.from(doc.output('arraybuffer'));
        fs.writeFileSync(filePath, buffer);
        return { success: true, path: filePath };
    }
    return { success: false };
}

module.exports = {
    generateGeneralExcel,
    generateGeneralPDF,
    generateClientExcel,
    generateClientPDF
};
