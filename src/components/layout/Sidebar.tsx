'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../lib/auth-context';

export default function Sidebar() {
    const pathname = usePathname();
    const { session, logout } = useAuth();

    const navItems = [
        { label: 'Dashboard', href: '/' },
        { label: 'Streaming Inventory', href: '/audio-dashboard' },
        { label: 'Digital Display Inventory', href: '/display-dashboard' },
        { label: 'E-sends Inventory', href: '/e-sends' },
        { label: 'Booking Form', href: '/booking' },
        { label: 'Reports & Performance', href: '/reports' },
        { label: 'Archive', href: '/archive' },
    ];

    if (session?.role === 'ADMIN') {
        navItems.push({ label: 'Admin Management', href: '/admin/users' });
    }

    return (
        <aside className="glass-panel" style={{
            borderRight: '1px solid var(--border-subtle)',
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '260px',
            flexShrink: 0
        }}>
            <div style={{ padding: '2rem 1.5rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '2rem', paddingLeft: '0.5rem' }}>
                    <img
                        src="/premier-logo.png"
                        alt="Premier"
                        style={{ width: '140px', height: 'auto', objectFit: 'contain' }}
                    />
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {navItems.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: isActive ? 'var(--primary-glow)' : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}
                                className="nav-item"
                            >
                                <span style={{ 
                                    opacity: isActive ? 1 : 0.6,
                                    fontSize: '1.1rem'
                                }}>
                                    {item.label === 'Dashboard' && '🏠'}
                                    {item.label === 'Streaming Inventory' && '🔈'}
                                    {item.label === 'Digital Display Inventory' && '💻'}
                                    {item.label === 'E-sends Inventory' && '✉️'}
                                    {item.label === 'Booking Form' && '📝'}
                                    {item.label === 'Reports & Performance' && '📊'}
                                    {item.label === 'Archive' && '📁'}
                                    {item.label === 'Admin Management' && '⚙️'}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Appearance</span>
                    <ThemeToggle />
                </div>

                {session && (
                    <div style={{ 
                        padding: '1rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'white', 
                            marginBottom: '0.2rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {session.email.split('@')[0]}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            {session.role}
                        </div>
                        <button 
                            onClick={logout}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </aside >
    );
}
