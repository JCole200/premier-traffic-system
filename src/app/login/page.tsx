'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #1a2a44, #0a0a0c)',
            padding: '2rem'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-glow))',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '2rem',
                        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
                    }}>
                        🏢
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: '0.5rem',
                        letterSpacing: '-1px'
                    }}>
                        Premier Traffic
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Authorized Access Only
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@premier.org.uk"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontSize: '1rem'
                            }}
                            className="login-input"
                        />
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontSize: '1rem'
                            }}
                            className="login-input"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            color: '#f87171',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'white',
                            color: 'black',
                            fontWeight: 700,
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '1rem',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1,
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? 'Securing Connection...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    opacity: 0.5
                }}>
                    Premier Global Traffic Operations © 2026
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .login-input:focus {
                    background: rgba(255,255,255,0.1) !important;
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
            `}} />
        </div>
    );
}
