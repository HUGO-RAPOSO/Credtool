import { cn } from '../../lib/utils';

export function Card({ children, className, ...props }) {
    return (
        <div
            className={cn('bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }) {
    return <div className={cn('p-4 border-b border-slate-700/50', className)}>{children}</div>;
}

export function CardContent({ children, className }) {
    return <div className={cn('p-6', className)}>{children}</div>;
}

const colorMap = {
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', icon: 'text-indigo-400', accent: 'text-indigo-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', icon: 'text-emerald-400', accent: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', icon: 'text-amber-400', accent: 'text-amber-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/40', icon: 'text-red-400', accent: 'text-red-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/40', icon: 'text-blue-400', accent: 'text-blue-400' },
};

export function StatCard({ title, value, icon: Icon, trend, color = 'indigo' }) {
    const c = colorMap[color];

    return (
        <div className={cn(
            'rounded-2xl border p-6 bg-slate-900 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group min-h-[110px]',
            c.border
        )}>
            {/* Colored accent strip */}
            <div className={cn('absolute inset-0 opacity-100', c.bg)} />

            {/* Top row: title + icon */}
            <div className="relative z-10 flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 leading-tight">{title}</span>
                {Icon && (
                    <div className={cn('flex-shrink-0 p-2 rounded-xl bg-slate-800/80', c.icon)}>
                        <Icon size={18} />
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="relative z-10">
                <p className="text-2xl font-black text-slate-50 tracking-tight">{value}</p>
                {trend && <p className="text-xs font-semibold text-slate-500 mt-1">{trend}</p>}
            </div>
        </div>
    );
}
