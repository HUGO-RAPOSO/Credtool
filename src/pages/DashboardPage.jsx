import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoanStatusBadge } from '../components/ui/Badge';
import { formatMZN, formatDate } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import {
    CreditCard, Users, TrendingUp, AlertCircle, ArrowRight, Wallet, PlusCircle, Search, DollarSign, Download, FileSpreadsheet, FileText
} from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, l] = await Promise.all([
                window.electronAPI.getDashboardStats(),
                window.electronAPI.getLoans(),
            ]);
            setStats(s);
            setLoans(l.slice(0, 6)); // Aumentado para 6 para melhor simetria visual
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const overdueLoans = loans.filter(l =>
        l.status === 'ACTIVE' && l.due_date && new Date(l.due_date) < new Date()
    );

    const handleExport = async (type) => {
        setExporting(type);
        try {
            const result = type === 'excel'
                ? await window.electronAPI.exportGeneralExcel()
                : await window.electronAPI.exportGeneralPDF();

            if (result.success) {
                addToast(`Relatório guardado: ${result.path}`, 'success');
            } else {
                addToast('Erro ao gerar relatório', 'error');
            }
        } catch (e) {
            console.error("Export error:", e);
            addToast('Erro ao gerar relatório', 'error');
        } finally {
            setExporting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-500 animate-pulse font-medium">Sincronizando dados...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col space-y-8 animate-fade-in pb-12">

            {/* Header com Ações Rápidas */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Dashboard <span className="text-indigo-500">Geral</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">Visão geral do sistema de crédito e métricas de desempenho.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-transparent hover:bg-slate-800 border-none shadow-none"
                            onClick={() => handleExport('excel')}
                            loading={exporting === 'excel'}
                        >
                            <FileSpreadsheet size={16} className="text-emerald-400" />
                            Excel
                        </Button>
                        <div className="w-px h-4 bg-slate-800" />
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-transparent hover:bg-slate-800 border-none shadow-none"
                            onClick={() => handleExport('pdf')}
                            loading={exporting === 'pdf'}
                        >
                            <FileText size={16} className="text-red-400" />
                            PDF
                        </Button>
                    </div>

                    <button
                        onClick={() => navigate('/loans/new')}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <PlusCircle size={18} /> Novo Empréstimo
                    </button>
                </div>
            </div>

            {/* Alertas Críticos */}
            {overdueLoans.length > 0 && (
                <div className="relative overflow-hidden group border border-red-500/30 bg-gradient-to-r from-red-950/30 to-slate-900 rounded-2xl p-6">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <AlertCircle size={80} className="text-red-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="bg-red-500/20 p-3 rounded-2xl">
                            <AlertCircle size={28} className="text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-100">Cobranças Pendentes</h3>
                            <p className="text-red-300/80 max-w-xl">
                                Identificamos <span className="font-bold text-white">{overdueLoans.length}</span> contratos com atraso. Recomenda-se o contacto imediato com os clientes.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/loans?filter=overdue')}
                            className="bg-white text-red-950 px-6 py-2 rounded-xl font-black text-sm hover:bg-red-100 transition-colors whitespace-nowrap"
                        >
                            Resolver Agora
                        </button>
                    </div>
                </div>
            )}

            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { title: "Total de Contratos", value: stats?.totalLoans, icon: CreditCard, color: "indigo" },
                    { title: "Empréstimos Activos", value: stats?.activeLoans, icon: TrendingUp, color: "emerald" },
                    { title: "Capital em Dívida", value: formatMZN(stats?.totalLent ?? 0), icon: Wallet, color: "blue" },
                    { title: "Total de Clientes", value: stats?.totalClients, icon: Users, color: "amber" }
                ].map((stat, i) => (
                    <StatCard key={i} {...stat} className="border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors" />
                ))}
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Tabela de Actividades Recentes */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            Contratos Recentes
                        </h2>
                        <button
                            onClick={() => navigate('/loans')}
                            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
                        >
                            Ver Histórico <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
                        {loans.length === 0 ? (
                            <div className="py-20 flex flex-col items-center text-slate-500">
                                <Search size={40} className="mb-4 opacity-20" />
                                <p>Nenhum registo encontrado</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                                            <th className="px-6 py-5">Cliente</th>
                                            <th className="px-6 py-5 text-right">Montante</th>
                                            <th className="px-6 py-5 text-center">Data Limite</th>
                                            <th className="px-6 py-5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {loans.map(loan => (
                                            <tr
                                                key={loan.id}
                                                className="hover:bg-indigo-500/5 cursor-pointer transition-colors group"
                                                onClick={() => navigate(`/loans/${loan.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 group-hover:border-indigo-500/50 transition-all">
                                                            {loan.client_name[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-200 group-hover:text-white">{loan.client_name}</span>
                                                            <span className="text-xs text-slate-500 font-medium">Ref: #{loan.id.toString().padStart(4, '0')}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-200">{formatMZN(loan.remaining_balance)}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium">DE {formatMZN(loan.amount)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-xs font-semibold ${new Date(loan.due_date) < new Date() ? 'text-red-400' : 'text-slate-400'}`}>
                                                        {formatDate(loan.due_date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <LoanStatusBadge status={loan.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar de Insights/Atalhos */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-100 px-2">Análise Rápida</h2>
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/10">
                        <h4 className="font-bold opacity-80 mb-1">Dica do Sistema</h4>
                        <p className="text-sm leading-relaxed font-medium">
                            A sua taxa de recuperação de capital subiu **12%** este mês. Continue a monitorar os alertas vermelhos.
                        </p>
                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                            <div className="text-2xl font-black">88%</div>
                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-right">Taxa de<br />Saúde Financeira</div>
                        </div>
                    </div>

                    {/* Lista de Atalhos */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-2">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <Users size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-300">Novo Cliente</span>
                            </div>
                            <ArrowRight size={14} className="text-slate-600" />
                        </button>
                        {/* Adicione mais atalhos aqui */}
                    </div>
                </div>

            </div>
        </div>
    );
}