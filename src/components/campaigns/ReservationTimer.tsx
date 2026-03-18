'use client';

import { useEffect, useState } from 'react';

interface Props {
    expiresAt: string | null;
    status: string;
}

export default function ReservationTimer({ expiresAt, status }: Props) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (status !== 'RESERVED' || !expiresAt) return;

        const tick = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Expired');
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, status]);

    if (status !== 'RESERVED' || !expiresAt) return null;

    const pct = (() => {
        const total = 48 * 3600000;
        const remaining = new Date(expiresAt).getTime() - Date.now();
        return Math.max(0, Math.min(100, (remaining / total) * 100));
    })();

    return (
        <div style={{ marginTop: '0.3rem' }}>
            <div style={{ fontSize: '0.7rem', color: isExpired ? '#ef4444' : pct < 25 ? '#f59e0b' : 'var(--text-muted)', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>
                {isExpired ? '⛔ Expired' : `⏳ ${timeLeft}`}
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', width: '80px' }}>
                <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${pct}%`,
                    background: pct < 25 ? '#ef4444' : pct < 50 ? '#f59e0b' : 'var(--success)',
                    transition: 'width 1s linear'
                }} />
            </div>
        </div>
    );
}
