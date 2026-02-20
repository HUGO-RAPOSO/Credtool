import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLicense } from '../contexts/LicenseContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
    ShieldCheck,
    Key,
    Lock,
    Calendar,
    Monitor,
    Clock,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function SettingsPage() {
    const { user } = useAuth();
    const { licenseStatus } = useLicense();
    const { addToast } = useToast();

    // Password state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Machine ID state
    const [machineId, setMachineId] = useState('...');

    useEffect(() => {
        window.electronAPI.getMachineId().then(id => setMachineId(id));
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return addToast('As novas palavras-passe não coincidem', 'error');
        }
        if (newPassword.length < 4) {
            return addToast('A nova palavra-passe deve ter pelo menos 4 caracteres', 'error');
        }

        setLoading(true);
        try {
            const result = await window.electronAPI.changePassword(user.id, oldPassword, newPassword);
            if (result.success) {
                addToast('Palavra-passe alterada com sucesso!', 'success');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                addToast(result.message, 'error');
            }
        } catch (error) {
            addToast('Erro ao alterar palavra-passe', 'error');
        } finally {
            setLoading(false);
        }
    };

    const daysRemaining = licenseStatus?.expiresAt
        ? differenceInDays(new Date(licenseStatus.expiresAt), new Date())
        : 0;

    const isExpiringSoon = daysRemaining <= 7;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Configurações</h1>
                <p className="text-slate-400 mt-2">Gerencie sua conta e visualize o estado da sua licença.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Security Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Lock size={20} className="text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-100">Segurança</h2>
                    </div>

                    <Card className="p-6">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Input
                                type="password"
                                label="Palavra-passe Actual"
                                placeholder="••••••••"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                label="Nova Palavra-passe"
                                placeholder="Pelo menos 4 caracteres"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                label="Confirmar Nova Palavra-passe"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                            <div className="pt-2">
                                <Button type="submit" loading={loading} className="w-full justify-center">
                                    <ShieldCheck size={18} />
                                    Actualizar Palavra-passe
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* License Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Key size={20} className="text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-100">Estado da Licença</h2>
                    </div>

                    <Card className="p-6 overflow-hidden relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Key size={120} />
                        </div>

                        <div className="space-y-6 relative">
                            {/* License Badge */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${licenseStatus?.valid ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                        <ShieldCheck size={24} className={licenseStatus?.valid ? 'text-emerald-400' : 'text-red-400'} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Tipo de Licença</p>
                                        <p className="text-lg font-bold text-slate-100">{licenseStatus?.type || 'Nenhuma'}</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${licenseStatus?.valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {licenseStatus?.valid ? 'Ativa' : 'Expirada'}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Expira em</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-200">
                                        {licenseStatus?.expiresAt
                                            ? format(new Date(licenseStatus.expiresAt), "d 'de' MMMM 'de' yyyy", { locale: pt })
                                            : 'N/A'}
                                    </p>
                                </div>

                                <div className={`border rounded-xl p-4 transition-colors ${isExpiringSoon ? 'bg-orange-500/10 border-orange-500/20' : 'bg-slate-800/40 border-slate-700/50'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Clock size={14} className={isExpiringSoon ? 'text-orange-400' : ''} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isExpiringSoon ? 'text-orange-400' : ''}`}>Dias Restantes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-xl font-black ${isExpiringSoon ? 'text-orange-400' : 'text-slate-100'}`}>
                                            {daysRemaining}
                                        </p>
                                        {isExpiringSoon && <AlertTriangle size={16} className="text-orange-400 animate-pulse" />}
                                    </div>
                                </div>
                            </div>

                            {/* Machine ID */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Monitor size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">ID do Computador</span>
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-mono select-none">Buscado via Hardware</span>
                                </div>
                                <code className="text-xs text-indigo-400 block p-2 bg-slate-950/50 rounded border border-slate-800/50 break-all font-mono">
                                    {machineId}
                                </code>
                            </div>

                            {/* Status Message */}
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${licenseStatus?.valid
                                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/80'
                                    : 'bg-red-500/5 border-red-500/10 text-red-400/80'
                                }`}>
                                {licenseStatus?.valid ? (
                                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                                )}
                                <p className="text-xs leading-relaxed">
                                    {licenseStatus?.valid
                                        ? "O seu sistema está totalmente licenciado e a funcionar corretamente. Todas as funcionalidades estão desbloqueadas."
                                        : "A sua licença expirou. Por favor, contacte o suporte para renovar o acesso ao sistema."}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
