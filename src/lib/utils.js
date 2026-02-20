import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatMZN(amount) {
    if (amount == null) return 'MT 0,00';
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        currencyDisplay: 'symbol',
    }).format(amount).replace('MZN', 'MT');
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function calculateMonthlyPayment(principal, rate, termMonths) {
    if (!rate || rate === 0) return principal / termMonths;
    const r = rate / 100;
    return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function getLoanStatusColor(status) {
    switch (status) {
        case 'ACTIVE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
        case 'PAID': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
        case 'DEFAULTED': return 'text-red-400 bg-red-400/10 border-red-500/20';
        default: return 'text-slate-400 bg-slate-400/10 border-slate-700/50';
    }
}

export function getLoanStatusLabel(status) {
    switch (status) {
        case 'ACTIVE': return 'Activo';
        case 'PAID': return 'Pago';
        case 'DEFAULTED': return 'Incumprido';
        default: return status;
    }
}
