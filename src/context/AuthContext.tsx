import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Check local storage for persistent auth session
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const authValue = localStorage.getItem('stockcard_auth');
        return authValue === 'true';
    });

    const login = (password: string) => {
        // Simple hardcoded password for now
        if (password === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('stockcard_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('stockcard_auth');
    };

    // Keep auth state in sync across tabs if needed
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'stockcard_auth') {
                setIsAuthenticated(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
