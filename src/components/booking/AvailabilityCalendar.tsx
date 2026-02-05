'use client';

import { useState, useEffect } from 'react';
import { getMonthlyAvailability } from '../../lib/actions/calendar';

interface Props {
    type: string;
    targetId?: string;
    onDateSelect?: (dates: string[]) => void;
    selectedDates?: string[];
    allowFullSelection?: boolean; // New prop for Admin override
}

export default function AvailabilityCalendar({ type, targetId, onDateSelect, selectedDates = [], allowFullSelection = false }: Props) {
    const [data, setData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Manage View State
    const [viewDate, setViewDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1; // 1-indexed

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await getMonthlyAvailability(type, year, month, targetId);
                setData(res);
            } catch (error) {
                console.error("Failed to load availability:", error);
                setError("Failed to load availability data. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [type, targetId, year, month]);

    const handlePrevMonth = () => {
        setViewDate(new Date(year, month - 2, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(year, month, 1));
    };

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

    // Calendar Grid Logic
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDayOffset = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const offsetArray = Array.from({ length: startDayOffset }, (_, i) => i);

    const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}
                >
                    &lt;
                </button>
                <h4 style={{ margin: 0 }}>{monthLabel}</h4>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}
                >
                    &gt;
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading availability...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{d}</div>
                    ))}

                    {/* Empty slots for offset */}
                    {offsetArray.map(i => <div key={`offset-${i}`} />)}

                    {daysArray.map(d => {
                        const dayData = data[d];
                        const dateStr = new Date(Date.UTC(year, month - 1, d)).toISOString().split('T')[0];
                        const isSelected = selectedDates.includes(dateStr);

                        let bg = 'rgba(255,255,255,0.05)';
                        let cursor = 'pointer';
                        let opacity = 1;

                        if (isSelected) {
                            bg = 'var(--primary)';
                        } else if (dayData) {
                            if (dayData.available <= 0) {
                                bg = 'var(--danger)';
                                cursor = 'not-allowed';
                                opacity = 0.5;
                            } else if (dayData.used > 0) {
                                bg = 'var(--warning)';
                            }
                        }

                        return (
                            <div
                                key={d}
                                onClick={() => (allowFullSelection || dayData?.available > 0 || isSelected) ? toggleDate(d) : null}
                                style={{
                                    aspectRatio: '1',
                                    background: bg,
                                    borderRadius: '4px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: (allowFullSelection || dayData?.available > 0 || isSelected) ? 'pointer' : 'not-allowed',
                                    opacity: opacity,
                                    fontSize: '0.9rem',
                                    position: 'relative'
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
            )}
        </div>
    );
}
