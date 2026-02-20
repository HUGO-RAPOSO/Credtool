import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KeyRound, ShieldCheck, Clock, Calendar } from 'lucide-react';

export default function LicensePage() {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [machineId, setMachineId] = useState('...');
    const { activateLicense, licenseStatus } = useLicense();
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        window.electronAPI.getMachineId().then(id => setMachineId(id));
    }, []);

    const copyMachineId = () => {
        navigator.clipboard.writeText(machineId);
        addToast('ID do Computador copiado!', 'success');
    };

    const handleActivate = async (e) => {
        e.preventDefault();
        if (!key.trim()) return;
        setLoading(true);
        const result = await activateLicense(key.trim().toUpperCase());
        setLoading(false);
        if (result.success) {
            addToast('Licença activada com sucesso!', 'success');
            navigate('/login');
        } else {
            addToast(result.message || 'Chave inválida', 'error');
        }
    };

    // UI de Bloqueio (Caso o admin desative remotamente)
    if (licenseStatus?.blocked) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/30 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 mb-2 uppercase tracking-tight">Software Bloqueado</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        A sua licença foi desativada pelo administrador do sistema ou o período de teste terminou.
                    </p>

                    <div className="bg-slate-950/50 border border-slate-700 p-6 rounded-2xl mb-8">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Suporte Técnico</p>
                        <p className="text-2xl font-black text-indigo-400 tracking-tighter">
                            +258 879877288
                        </p>
                    </div>

                    <p className="text-xs text-slate-500">
                        Por favor, entre em contacto para regularizar a sua conta e recuperar o acesso aos dados.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mb-4">
                        <KeyRound size={28} className="text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">Activar Licença</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        Introduza a sua chave de licença para activar o CredTool
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
                    <form onSubmit={handleActivate} className="space-y-4">
                        <Input
                            label="Chave de Licença"
                            placeholder="MONTHLY-XXXX-XXXX ou ANNUAL-XXXX-XXXX"
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            className="font-mono tracking-wider"
                        />
                        <Button type="submit" className="w-full" loading={loading} size="lg">
                            <ShieldCheck size={18} />
                            Activar Licença
                        </Button>
                    </form>

                    {/* Machine ID Info */}
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <div className="bg-slate-800/80 border border-indigo-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">ID do Computador</span>
                                <button
                                    onClick={copyMachineId}
                                    className="text-[10px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-2 py-1 rounded-md transition-colors"
                                >
                                    Copiar ID
                                </button>
                            </div>
                            <p className="text-sm font-mono text-slate-300 break-all bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                {machineId}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                Partilhe este ID com o administrador para vincular a sua licença pro.
                            </p>
                        </div>
                    </div>

                    {/* License types info */}
                    <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={14} className="text-indigo-400" />
                                <span className="text-xs font-semibold text-slate-300">Mensal</span>
                            </div>
                            <p className="text-xs text-slate-500">Prefixo: <code className="text-indigo-400">MONTHLY-</code></p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-emerald-400" />
                                <span className="text-xs font-semibold text-slate-300">Anual</span>
                            </div>
                            <p className="text-xs text-slate-500">Prefixo: <code className="text-emerald-400">ANNUAL-</code></p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-4">
                    CredTool &copy; {new Date().getFullYear()} — Sistema de Gestão de Microcrédito
                </p>
            </div>
        </div>
    );
}
