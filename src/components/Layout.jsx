import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Users, CreditCard, LogOut, Menu, X, KeyRound, Settings
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clientes' },
    { to: '/loans', icon: CreditCard, label: 'Empréstimos' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
];

function SidebarLink({ to, icon: Icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            end={to === '/'}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
            }
        >
            <Icon size={20} />
            {label}
        </NavLink>
    );
}

export function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const Sidebar = ({ mobile = false }) => (
        <aside className={`flex flex-col h-full bg-slate-900 border-r border-slate-800/60 ${mobile ? 'w-full' : 'w-56'}`}>
            {/* Logo */}
            <div className="p-6 border-b border-slate-800/60">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                        <KeyRound size={22} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-50 text-lg tracking-tight">CredTool</p>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">SOFTWARE GESTÃO</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Menu do Sistema</p>
                {navItems.map(item => (
                    <SidebarLink key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
                ))}
            </nav>

            {/* User Info */}
            <div className="p-6 border-t border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center gap-4 mb-5 px-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-500/10">
                        <span className="text-indigo-400 text-sm font-bold">{user?.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">{user?.username}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Terminar Sessão
                </button>
            </div>
        </aside>
    );

    return (
        <div className="flex h-full overflow-hidden bg-slate-950">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <div className="relative w-72 h-full">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-900">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-400 hover:text-slate-100 p-1"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-100">CredTool</span>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto w-full min-h-full flex flex-col">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
