'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DateSelectionWizard({ pathname }: { pathname: string }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const router = useRouter();

    return (
        <form action={pathname} method="GET" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Select Start Date
                </label>
                <input
                    name="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        borderRadius: '12px',
                        background: 'var(--bg-panel)',
                        border: '2px solid var(--primary)',
                        color: 'var(--text-main)',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                    }}
                />
            </div>
            <button
                type="submit"
                className="btn-primary"
                style={{
                    width: '100%',
                    padding: '1.2rem',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px var(--primary-glow)'
                }}
            >
                Check Availability →
            </button>
        </form>
    );
}
