import { cn } from '../../lib/utils';

export function Input({ label, error, className, ...props }) {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>}
            <input
                className={cn(
                    'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-100 placeholder-slate-500 text-sm transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60',
                    error ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600',
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                {error}
            </span>}
        </div>
    );
}

export function Select({ label, error, children, className, ...props }) {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>}
            <select
                className={cn(
                    'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-100 text-sm transition-all duration-200 appearance-none cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60',
                    error ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600',
                    className
                )}
                {...props}
            >
                {children}
            </select>
            {error && <span className="text-xs font-semibold text-red-400">{error}</span>}
        </div>
    );
}

export function Textarea({ label, error, className, ...props }) {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>}
            <textarea
                className={cn(
                    'w-full px-4 py-3 rounded-xl bg-slate-800 border text-slate-100 placeholder-slate-500 text-sm transition-all duration-200 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60',
                    error ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600',
                    className
                )}
                rows={3}
                {...props}
            />
            {error && <span className="text-xs font-semibold text-red-400">{error}</span>}
        </div>
    );
}
