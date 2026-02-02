'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../ThemeToggle';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Dashboard', href: '/' },
        { label: 'Booking', href: '/booking' },
        { label: 'Availability', href: '/availability' },
        { label: 'Inventory', href: '/inventory' },
        { label: 'Campaigns', href: '/campaigns' },
        { label: 'Admin', href: '/admin' },
    ];

    return (
        <aside className="glass-panel" style={{
            borderRight: '1px solid var(--border-subtle)',
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
                <h1 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                    Premier
                </h1>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navItems.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: isActive ? 'var(--bg-nav-active)' : 'transparent',
                                    color: isActive ? 'var(--text-nav-active)' : 'var(--text-muted)',
                                    fontWeight: isActive ? 600 : 400,
                                }}
                                className="nav-item"
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Theme</span>
                    <ThemeToggle />
                </div>
            </div>
        </aside >
    );
}
