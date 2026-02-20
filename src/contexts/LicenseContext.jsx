import { createContext, useContext, useState, useEffect } from 'react';

const LicenseContext = createContext(null);

export function LicenseProvider({ children }) {
    const [licenseStatus, setLicenseStatus] = useState(null); // null = loading
    const [loading, setLoading] = useState(true);

    const checkLicense = async () => {
        setLoading(true);
        try {
            // Tenta verificação em tempo real (Firebase)
            const result = await window.electronAPI.checkLicenseLive();

            // Se o retorno for um erro genérico (ex: sem net), 
            // tentamos a validação local normal para não bloquear quem está offline
            if (result.error) {
                const localResult = await window.electronAPI.checkLicense();
                setLicenseStatus(localResult);
            } else {
                setLicenseStatus(result);
            }
        } catch (err) {
            console.error("Erro na verificação de licença:", err);
            setLicenseStatus({ valid: false, reason: 'Erro ao verificar licença' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial check
        checkLicense();

        // Re-check periodically (every 5 minutes) to enforce expiration
        // if the app is left running.
        const interval = setInterval(() => {
            // Only check if we are not already in a loading state
            // and the previous status was valid.
            checkLicense();
        }, 1000 * 60 * 5);

        return () => clearInterval(interval);
    }, []);

    const activateLicense = async (key) => {
        const result = await window.electronAPI.activateLicense(key);
        if (result.success) {
            await checkLicense();
        }
        return result;
    };

    return (
        <LicenseContext.Provider value={{ licenseStatus, loading, activateLicense, checkLicense }}>
            {children}
        </LicenseContext.Provider>
    );
}

export const useLicense = () => {
    const ctx = useContext(LicenseContext);
    if (!ctx) throw new Error('useLicense must be used within LicenseProvider');
    return ctx;
};
