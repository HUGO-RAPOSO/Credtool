import { useEffect } from 'react';
import { cn } from '../../lib/utils';

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto p-4 md:p-8">
            <div
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div
                className={cn(
                    'relative m-auto w-full shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-700/50 bg-slate-900 rounded-2xl flex flex-col',
                    'animate-fade-in',
                    sizes[size]
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 bg-slate-900 rounded-t-2xl flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-100 transition-all p-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
