import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoanStatusBadge } from '../components/ui/Badge';
import { formatMZN, formatDate, calculateMonthlyPayment } from '../lib/utils';
import { PlusCircle, Search, DollarSign, ChevronDown, ChevronUp, Edit2, Trash2, History } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function LoanForm({ clients, onSubmit, loading }) {
    const [form, setForm] = useState({
        client_id: '',
        amount: '',
        rate: '5',
        term_months: '12',
        notes: '',
    });
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const monthly = form.amount && form.rate && form.term_months
        ? calculateMonthlyPayment(+form.amount, +form.rate, +form.term_months)
        : null;

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
            <Select label="Cliente *" value={form.client_id} onChange={set('client_id')} required>
                <option value="">-- Seleccionar cliente --</option>
                {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Montante (MT) *"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Ex: 50000"
                    value={form.amount}
                    onChange={set('amount')}
                    required
                />
                <Input
                    label="Taxa Juro (% mensal) *"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ex: 5"
                    value={form.rate}
                    onChange={set('rate')}
                    required
                />
            </div>
            <Input
                label="Prazo (meses) *"
                type="number"
                min="1"
                max="360"
                placeholder="Ex: 12"
                value={form.term_months}
                onChange={set('term_months')}
                required
            />
            <Textarea label="Observações" placeholder="Notas adicionais" value={form.notes} onChange={set('notes')} />

            {/* Preview */}
            {monthly !== null && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3.5 text-sm">
                    <p className="text-slate-400 text-xs mb-1">Prestação mensal estimada:</p>
                    <p className="text-lg font-bold text-indigo-300">{formatMZN(monthly)}</p>
                </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
                <Button type="submit" loading={loading} size="md">Criar Empréstimo</Button>
            </div>
        </form>
    );
}

function PaymentForm({ loanId, onSubmit, loading }) {
    const [form, setForm] = useState({ amount: '', notes: '' });
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, loan_id: loanId }); }} className="space-y-4">
            <Input
                label="Valor do Pagamento (MT) *"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex: 5000"
                value={form.amount}
                onChange={set('amount')}
                required
            />
            <Textarea label="Observações" placeholder="Referência ou notas" value={form.notes} onChange={set('notes')} />
            <div className="flex justify-end pt-2 border-t border-slate-800">
                <Button type="submit" variant="success" loading={loading} size="md">Registar Pagamento</Button>
            </div>
        </form>
    );
}

function LoanRow({ loan, onPayment, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const progressPct = loan.amount > 0
        ? ((loan.amount - loan.remaining_balance) / loan.amount) * 100
        : 0;

    const fetchHistory = async () => {
        if (!expanded) {
            setLoadingHistory(true);
            try {
                const data = await window.electronAPI.getLoanHistory(loan.id);
                setHistory(data);
            } finally {
                setLoadingHistory(false);
            }
        }
        setExpanded(!expanded);
    };

    return (
        <>
            <tr className="hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group" onClick={fetchHistory}>
                <td className="px-6 py-5 font-semibold text-slate-100 text-sm">{loan.client_name}</td>
                <td className="px-6 py-5 text-slate-300 text-sm">{formatMZN(loan.amount)}</td>
                <td className="px-6 py-5 text-slate-100 font-bold text-sm">{formatMZN(loan.remaining_balance)}</td>
                <td className="px-6 py-5 text-indigo-400 font-semibold text-sm">{loan.rate}%</td>
                <td className="px-6 py-5 text-slate-400 text-sm hidden md:table-cell">{loan.term_months}m</td>
                <td className="px-6 py-5 text-slate-400 text-sm hidden lg:table-cell">{formatDate(loan.due_date)}</td>
                <td className="px-6 py-5"><LoanStatusBadge status={loan.status} /></td>
                <td className="px-6 py-5 text-slate-500">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(loan); }}
                            className="p-1.5 hover:text-indigo-400 transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(loan); }}
                            className="p-1.5 hover:text-red-400 transition-colors"
                            title="Apagar"
                        >
                            <Trash2 size={14} />
                        </button>
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-900/50">
                    <td colSpan={8} className="px-6 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Stats & Actions */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                        <span className="font-bold uppercase tracking-wider">Progresso de Reembolso</span>
                                        <span className="font-bold text-slate-200">{progressPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Início</p>
                                        <p className="text-sm font-semibold text-slate-200">{formatDate(loan.created_at)}</p>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Último Juro</p>
                                        <p className="text-sm font-semibold text-slate-200">{formatDate(loan.last_interest_calc)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {loan.status === 'ACTIVE' && (
                                        <Button
                                            size="sm"
                                            variant="success"
                                            className="flex-1"
                                            onClick={(e) => { e.stopPropagation(); onPayment(loan); }}
                                        >
                                            <DollarSign size={14} />
                                            Registar Pagamento
                                        </Button>
                                    )}
                                    {loan.notes && (
                                        <div className="flex-1 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                            <p className="text-[10px] text-indigo-400/70 uppercase font-black mb-1">Notas</p>
                                            <p className="text-xs text-slate-400 leading-relaxed italic">"{loan.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col">
                                <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-800/30 flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <History size={12} className="text-indigo-400" />
                                        Histórico de Pagamentos
                                    </h4>
                                    {loadingHistory && <div className="w-3 h-3 border border-indigo-400 border-t-transparent animate-spin rounded-full" />}
                                </div>
                                <div className="max-h-[220px] overflow-y-auto">
                                    {history.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <p className="text-xs text-slate-500 font-medium">Nenhum pagamento registado.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left text-xs">
                                            <thead className="sticky top-0 bg-slate-900">
                                                <tr className="border-b border-slate-800/60">
                                                    <th className="px-4 py-2 text-slate-500 font-bold uppercase tracking-wider">Data</th>
                                                    <th className="px-4 py-2 text-slate-500 font-bold uppercase tracking-wider text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/30">
                                                {history.map(p => (
                                                    <tr key={p.id} className="hover:bg-slate-800/20">
                                                        <td className="px-4 py-3 text-slate-400">{formatDate(p.payment_date)}</td>
                                                        <td className="px-4 py-3 text-emerald-400 font-black text-right">{formatMZN(p.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function LoansPage() {
    const [loans, setLoans] = useState([]);
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [loanModalOpen, setLoanModalOpen] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [paying, setPaying] = useState(false);
    const { addToast } = useToast();
    const location = useLocation();

    const loadData = async () => {
        setLoading(true);
        try {
            const [l, c] = await Promise.all([
                window.electronAPI.getLoans(),
                window.electronAPI.getClients(),
            ]);
            setLoans(l);
            setClients(c);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const params = new URLSearchParams(location.search);
        if (params.get('client')) setFilter('ALL');
    }, []);

    const handleCreateLoan = async (form) => {
        if (!form.client_id || !form.amount || !form.rate || !form.term_months) {
            addToast('Preencha todos os campos obrigatórios', 'warning');
            return;
        }
        setCreating(true);
        await window.electronAPI.createLoan({
            client_id: +form.client_id,
            amount: +form.amount,
            rate: +form.rate,
            term_months: +form.term_months,
            notes: form.notes,
        });
        setCreating(false);
        setLoanModalOpen(false);
        addToast('Empréstimo criado com sucesso!', 'success');
        loadData();
    };

    const handlePayment = async (form) => {
        if (!form.amount || +form.amount <= 0) {
            addToast('Valor inválido', 'warning');
            return;
        }
        setPaying(true);
        const result = await window.electronAPI.addPayment({
            loan_id: form.loan_id,
            amount: +form.amount,
            notes: form.notes,
        });
        setPaying(false);
        setPaymentModal(null);
        if (result.success) {
            addToast('Pagamento registado com sucesso!', 'success');
        } else {
            addToast(result.message || 'Erro ao registar pagamento', 'error');
        }
        loadData();
    };

    const handleEditLoan = async (form) => {
        setSaving(true);
        try {
            await window.electronAPI.updateLoan(form);
            setEditModal(null);
            addToast('Registro atualizado com sucesso!', 'success');
            loadData();
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLoan = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await window.electronAPI.deleteLoan(deleteModal.id);
            setDeleteModal(null);
            addToast('Empréstimo removido com sucesso!', 'success');
            loadData();
        } finally {
            setDeleting(false);
        }
    };

    const filtered = loans.filter(l => {
        const matchSearch = l.client_name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'ALL' || l.status === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div className="flex-1 flex flex-col space-y-10 animate-fade-in pb-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Empréstimos</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Controlo total sobre a carteira de crédito.</p>
                </div>
                <Button
                    onClick={() => { setLoanModalOpen(true); }}
                    size="md"
                    className="flex items-center gap-2"
                >
                    <PlusCircle size={18} />
                    Novo Empréstimo
                </Button>
            </div>

            {/* Table Card */}
            <div className="bg-slate-900/40 border border-slate-700/40 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
                {/* Filters Bar */}
                <div className="p-6 border-b border-slate-800/50 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                            placeholder="Procurar empréstimo..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
                            {['ALL', 'ACTIVE', 'PAID'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${filter === s
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {s === 'ALL' ? 'Todos' : s === 'ACTIVE' ? 'Activos' : 'Pagos'}
                                </button>
                            ))}
                        </div>

                        {(search || filter !== 'ALL') && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => { setSearch(''); setFilter('ALL'); }}
                            >
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 text-base font-medium">
                        Nenhum contrato encontrado.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/30 border-b border-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Beneficiário</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Capital</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Saldo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Taxa</th>
                                    <th className="px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hidden md:table-cell">Prazo</th>
                                    <th className="px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hidden lg:table-cell">Vencimento</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Estado</th>
                                    <th className="px-5 py-3.5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {filtered.map(loan => (
                                    <LoanRow
                                        key={loan.id}
                                        loan={loan}
                                        onPayment={setPaymentModal}
                                        onEdit={setEditModal}
                                        onDelete={setDeleteModal}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={loanModalOpen} onClose={() => setLoanModalOpen(false)} title="Novo Empréstimo" size="md">
                <LoanForm clients={clients} onSubmit={handleCreateLoan} loading={creating} />
            </Modal>

            <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title={`Liquidando — ${paymentModal?.client_name}`} size="sm">
                {paymentModal && (
                    <div className="space-y-4">
                        <div className="bg-slate-800/60 rounded-xl px-5 py-4 border border-indigo-500/20">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Saldo em dívida</span>
                                <span className="font-black text-slate-100 text-2xl">{formatMZN(paymentModal.remaining_balance)}</span>
                            </div>
                        </div>
                        <PaymentForm loanId={paymentModal.id} onSubmit={handlePayment} loading={paying} />
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Editar Empréstimo" size="sm">
                {editModal && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleEditLoan({
                                id: editModal.id,
                                notes: e.target.notes.value,
                                term_months: +e.target.term.value,
                                status: e.target.status.value
                            });
                        }}
                        className="space-y-5"
                    >
                        <Input
                            label="Notas / Observações"
                            name="notes"
                            defaultValue={editModal.notes}
                            placeholder="Notas adicionais"
                        />
                        <Input
                            label="Prazo (Meses)"
                            name="term"
                            type="number"
                            defaultValue={editModal.term_months}
                        />
                        <Select label="Estado" name="status" defaultValue={editModal.status}>
                            <option value="ACTIVE">Activo</option>
                            <option value="PAID">Pago</option>
                            <option value="OVERDUE">Vencido</option>
                        </Select>
                        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
                            <Button type="button" variant="secondary" onClick={() => setEditModal(null)}>Cancelar</Button>
                            <Button type="submit" loading={saving}>Salvar Alterações</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Apagar Registro" size="sm">
                {deleteModal && (
                    <div className="space-y-6">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-sm text-red-400 leading-relaxed font-medium">
                                Tens a certeza que desejas apagar o empréstimo de <span className="font-black text-red-300">{deleteModal.client_name}</span>?
                            </p>
                            <p className="text-xs text-red-500/60 mt-2 font-bold uppercase tracking-tighter">⚠️ Esta ação é irreversível e apagará todo o histórico de pagamentos associado.</p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancelar</Button>
                            <Button variant="danger" loading={deleting} onClick={handleDeleteLoan}>
                                <Trash2 size={16} />
                                Apagar Permanentemente
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}
