const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // License
    checkLicense: () => ipcRenderer.invoke('check-license'),
    checkLicenseLive: () => ipcRenderer.invoke('check-license-live'),
    activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
    getMachineId: () => ipcRenderer.invoke('get-machine-id'),

    // Auth
    login: (username, password) => ipcRenderer.invoke('auth-login', { username, password }),
    changePassword: (userId, oldPassword, newPassword) => ipcRenderer.invoke('auth-change-password', { userId, oldPassword, newPassword }),

    // Clients
    getClients: () => ipcRenderer.invoke('db-get-clients'),
    createClient: (client) => ipcRenderer.invoke('db-create-client', client),
    deleteClient: (id) => ipcRenderer.invoke('db-delete-client', id),
    updateClient: (client) => ipcRenderer.invoke('db-update-client', client),

    // Loans
    getLoans: () => ipcRenderer.invoke('db-get-loans'),
    createLoan: (loan) => ipcRenderer.invoke('db-create-loan', loan),
    deleteLoan: (id) => ipcRenderer.invoke('db-delete-loan', id),
    updateLoan: (loan) => ipcRenderer.invoke('db-update-loan', loan),

    // Payments
    addPayment: (payment) => ipcRenderer.invoke('db-add-payment', payment),
    getLoanHistory: (loanId) => ipcRenderer.invoke('db-get-loan-history', loanId),

    // Dashboard
    getDashboardStats: () => ipcRenderer.invoke('db-get-dashboard-stats'),

    // Reports
    exportGeneralExcel: () => ipcRenderer.invoke('report-general-excel'),
    exportGeneralPDF: () => ipcRenderer.invoke('report-general-pdf'),
    exportClientExcel: (clientId) => ipcRenderer.invoke('report-client-excel', clientId),
    exportClientPDF: (clientId) => ipcRenderer.invoke('report-client-pdf', clientId),
});
