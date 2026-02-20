import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KeyRound, LogIn } from 'lucide-react';

export default function LoginPage() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password) {
            addToast('Preencha todos os campos', 'warning');
            return;
        }
        setLoading(true);
        const result = await login(form.username, form.password);
        setLoading(false);
        if (result.success) {
            addToast(`Bem-vindo, ${result.user.username}!`, 'success');
            navigate('/');
        } else {
            addToast(result.message || 'Credenciais inválidas', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
                        <KeyRound size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">CredTool</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestão de Microcrédito</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-7 backdrop-blur-sm shadow-2xl">
                    <h2 className="text-base font-semibold text-slate-200 mb-5">Entrar na conta</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Utilizador"
                            placeholder="Nome de utilizador"
                            value={form.username}
                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            autoFocus
                        />
                        <Input
                            label="Palavra-passe"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        />
                        <div className="pt-1">
                            <Button type="submit" className="w-full" loading={loading} size="lg">
                                <LogIn size={18} />
                                Entrar
                            </Button>
                        </div>
                    </form>
                    <p className="text-xs text-slate-600 text-center mt-4">
                        Admin padrão: <code className="text-slate-400">admin</code> / <code className="text-slate-400">admin123</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
