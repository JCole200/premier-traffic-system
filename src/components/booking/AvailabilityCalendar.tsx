'use client';

import { useState, useEffect } from 'react';
import { getMonthlyAvailability } from '../../lib/actions/calendar';

interface Props {
    type: string;
    targetId?: string;
    onDateSelect?: (dates: string[]) => void;
    selectedDates?: string[];
}

export default function AvailabilityCalendar({ type, targetId, onDateSelect, selectedDates = [] }: Props) {
    const [data, setData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed for our API

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await getMonthlyAvailability(type, year, month, targetId);
                setData(res);
            } catch (error) {
                console.error("Failed to load availability:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [type, targetId]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading availability...</div>;

    const daysInMonth = Array.from({ length: Object.keys(data).length }, (_, i) => i + 1);

    const toggleDate = (day: number) => {
        // Construct date string YYYY-MM-DD
        const dStr = new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
        if (onDateSelect) {
            if (selectedDates.includes(dStr)) {
                onDateSelect(selectedDates.filter(d => d !== dStr));
            } else {
                onDateSelect([...selectedDates, dStr]);
            }
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h4 style={{ marginBottom: '1rem' }}>Availability Calendar ({type})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d}</div>
                ))}
                {/* Offset for start of month - skipped for brevity in prototype */}

                {daysInMonth.map(d => {
                    const dayData = data[d];
                    // If type is Email, capacity is small (e.g. 4). If type is Audio, capacity is huge.

                    let bg = 'rgba(255,255,255,0.05)';
                    const isSelected = selectedDates.includes(new Date(Date.UTC(year, month - 1, d)).toISOString().split('T')[0]);

                    if (isSelected) bg = 'var(--primary)';
                    else if (dayData && dayData.available <= 0) bg = 'var(--danger)'; // Full
                    else if (dayData && dayData.used > 0) bg = 'var(--warning)'; // Partial

                    return (
                        <div
                            key={d}
                            onClick={() => toggleDate(d)}
                            style={{
                                aspectRatio: '1',
                                background: bg,
                                borderRadius: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {d}
                            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                                {dayData?.used}/{dayData?.capacity}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
