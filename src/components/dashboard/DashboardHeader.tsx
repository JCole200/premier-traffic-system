'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHeader({ initialDate, title }: { initialDate?: string; title: string }) {
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const router = useRouter();

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        const params = new URLSearchParams(window.location.search);
        params.set('date', newDate);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h1>
                <p style={{ color: 'var(--text-muted)' }}>Inventory availability for the selected campaign start.</p>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Campaign Start Date:</span>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        color: 'white',
                        colorScheme: 'dark'
                    }}
                />
            </div>
        </header>
    );
}
