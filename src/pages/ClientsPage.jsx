import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../lib/utils';
import { UserPlus, Search, CreditCard, Edit2, Trash2, FileSpreadsheet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ClientForm({ onSubmit, loading }) {
    const [form, setForm] = useState({ name: '', phone: '', address: '', bi: '' });
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
            className="space-y-4"
        >
            <Input label="Nome Completo *" placeholder="Ex: João Silva" value={form.name} onChange={set('name')} required />
            <Input label="Telemóvel" placeholder="Ex: 84 123 4567" value={form.phone} onChange={set('phone')} />
            <Input label="B.I. / NUIT" placeholder="Número do documento" value={form.bi} onChange={set('bi')} />
            <Textarea label="Endereço" placeholder="Morada completa" value={form.address} onChange={set('address')} />
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800 mt-2">
                <Button type="submit" loading={loading} size="md">Guardar Cliente</Button>
            </div>
        </form>
    );
}

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(null); // { id, type }
    const [modalOpen, setModalOpen] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await window.electronAPI.getClients();
            setClients(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadClients(); }, []);

    const handleCreate = async (form) => {
        if (!form.name.trim()) { addToast('Nome obrigatório', 'warning'); return; }
        setCreating(true);
        try {
            await window.electronAPI.createClient(form);
            setModalOpen(false);
            addToast('Cliente criado com sucesso!', 'success');
            loadClients();
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = async (form) => {
        setSaving(true);
        try {
            await window.electronAPI.updateClient(form);
            setEditModal(null);
            addToast('Cliente atualizado com sucesso!', 'success');
            loadClients();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await window.electronAPI.deleteClient(deleteModal.id);
            setDeleteModal(null);
            addToast('Cliente e registros associados removidos!', 'success');
            loadClients();
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = async (client, type) => {
        setExporting({ id: client.id, type });
        try {
            const result = type === 'excel'
                ? await window.electronAPI.exportClientExcel(client.id)
                : await window.electronAPI.exportClientPDF(client.id);

            if (result.success) {
                addToast(`Relatório de ${client.name} guardado.`, 'success');
            }
        } catch (e) {
            addToast('Erro ao exportar cliente', 'error');
        } finally {
            setExporting(null);
        }
    };

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    );

    return (
        <div className="flex-1 flex flex-col space-y-10 animate-fade-in pb-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Clientes</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Gestão da base de dados de beneficiários.</p>
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    size="md"
                    className="flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    Novo Cliente
                </Button>
            </div>

            {/* Table Card */}
            <div className="bg-slate-900/40 border border-slate-700/40 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
                {/* Search Bar */}
                <div className="p-6 border-b border-slate-800/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            className="w-full max-w-sm pl-11 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                            placeholder="Pesquisar por nome ou telefone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 text-base font-medium">
                        {search ? 'Nenhum cliente corresponde à sua pesquisa.' : 'A sua base de clientes está vazia.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/30 border-b border-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Beneficiário</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hidden sm:table-cell text-center">Contacto</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hidden md:table-cell text-center">Identificação</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">Registo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {filtered.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-800/30 transition-all duration-200 group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base font-black text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all flex-shrink-0">
                                                    {client.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-100">{client.name}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5">{client.address || 'Sem endereço'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center hidden sm:table-cell">
                                            <span className="font-medium text-slate-300 text-sm">{client.phone || '—'}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center hidden md:table-cell">
                                            <span className="font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50 text-xs">{client.bi || '—'}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-slate-400 text-sm">
                                            {formatDate(client.created_at)}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/loans?client=${client.id}`)}
                                                    className="p-2 text-indigo-400 hover:bg-indigo-600/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30"
                                                    title="Ver Empréstimos"
                                                >
                                                    <CreditCard size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleExport(client, 'excel')}
                                                    disabled={exporting?.id === client.id}
                                                    className="p-2 text-emerald-400 hover:bg-emerald-600/10 rounded-lg transition-all"
                                                    title="Exportar Excel"
                                                >
                                                    <FileSpreadsheet size={16} className={exporting?.id === client.id && exporting?.type === 'excel' ? 'animate-pulse' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => handleExport(client, 'pdf')}
                                                    disabled={exporting?.id === client.id}
                                                    className="p-2 text-red-400 hover:bg-red-600/10 rounded-lg transition-all"
                                                    title="Exportar PDF"
                                                >
                                                    <FileText size={16} className={exporting?.id === client.id && exporting?.type === 'pdf' ? 'animate-pulse' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => setEditModal(client)}
                                                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal(client)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Apagar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Registar Novo Cliente"
                size="md"
            >
                <ClientForm
                    onSubmit={handleCreate}
                    loading={creating}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editModal}
                onClose={() => setEditModal(null)}
                title="Editar Cliente"
                size="md"
            >
                {editModal && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleEdit({
                                id: editModal.id,
                                name: e.target.name.value,
                                phone: e.target.phone.value,
                                address: e.target.address.value,
                                bi: e.target.bi.value
                            });
                        }}
                        className="space-y-4"
                    >
                        <Input label="Nome Completo *" name="name" defaultValue={editModal.name} required />
                        <Input label="Telemóvel" name="phone" defaultValue={editModal.phone} />
                        <Input label="B.I. / NUIT" name="bi" defaultValue={editModal.bi} />
                        <Textarea label="Endereço" name="address" defaultValue={editModal.address} />
                        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800 mt-2">
                            <Button type="button" variant="secondary" onClick={() => setEditModal(null)}>Cancelar</Button>
                            <Button type="submit" loading={saving}>Guardar Alterações</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title="Eliminar Cliente"
                size="sm"
            >
                {deleteModal && (
                    <div className="space-y-6">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-sm text-red-400 leading-relaxed font-medium">
                                Desejas apagar <span className="font-black text-red-300">{deleteModal.name}</span>?
                            </p>
                            <p className="text-xs text-red-500/60 mt-2 font-bold italic">
                                ⚠️ Isto apagará permanentemente todos os empréstimos e pagamentos deste cliente.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancelar</Button>
                            <Button variant="danger" loading={deleting} onClick={handleDelete}>
                                <Trash2 size={16} />
                                Confirmar Exclusão
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
