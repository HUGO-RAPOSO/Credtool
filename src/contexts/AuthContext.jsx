import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage
        const saved = localStorage.getItem('credtool_user');
        if (saved) {
            try { setUser(JSON.parse(saved)); } catch { }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const result = await window.electronAPI.login(username, password);
        if (result.success) {
            setUser(result.user);
            localStorage.setItem('credtool_user', JSON.stringify(result.user));
        }
        return result;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('credtool_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
