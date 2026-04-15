'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface Session {
    email: string;
    role: string;
}

interface AuthContextType {
    session: Session | null;
    setSession: (session: Session | null) => void;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Since we're using cookies in middleware/API, we can check a public API or just the cookie existence
        // For simplicity, let's just fetch a 'me' endpoint or parse the cookie if client-side accessible
        // But better: the session is already in the cookie. We just need to know if we're logged in.
        
        const checkAuth = async () => {
            try {
                // We'll create a simple /api/auth/me endpoint
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.user);
                } else {
                    setSession(null);
                }
            } catch (err) {
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setSession(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ session, setSession, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
