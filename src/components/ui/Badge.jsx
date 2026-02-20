import { cn, getLoanStatusColor, getLoanStatusLabel } from '../../lib/utils';

export function Badge({ children, variant = 'default', className }) {
    const variants = {
        default: 'bg-slate-700 text-slate-300',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    };
    return (
        <span className={cn('inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest', variants[variant], className)}>
            {children}
        </span>
    );
}

export function LoanStatusBadge({ status }) {
    return (
        <span className={cn('inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border', getLoanStatusColor(status))}>
            {getLoanStatusLabel(status)}
        </span>
    );
}
