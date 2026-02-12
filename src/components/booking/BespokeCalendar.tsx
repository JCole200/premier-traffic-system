'use client';

import { useState, useEffect } from 'react';
import { getMonthlyAvailability } from '../../lib/actions/calendar';

interface Props {
    selectedDates?: string[];
    onDateSelect?: (dates: string[]) => void;
    selectedLists?: string[];
    department?: string;
}

// Map list names to inventory IDs (if needed for specific tracking)
const LIST_CATEGORIES = {
    sales: ['SALES A+B', 'SALES A', 'SALES B', 'SALES CTY', 'SALES NEXGEN', 'SALES LEADERS', 'SALES WAlive', 'SALES PG'],
    premier: ['FUNDRAISING', 'MARKETING', 'Marketplace', 'Jobsearch', 'Magazines', 'Impact/Fundraising', 'E-appeal', 'United Prayer']
};

export default function BespokeCalendar({ onDateSelect, selectedDates = [], selectedLists = [], department = 'SALES' }: Props) {
    const [data, setData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sales' | 'premier'>('sales');
    const [selectedListFilter, setSelectedListFilter] = useState<string>('all');

    // Manage View State
    const [viewDate, setViewDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1; // 1-indexed

    // Determine which tab to show based on department
    useEffect(() => {
        if (department === 'MARKETING' || department === 'FUNDRAISING' || department === 'INTERNAL') {
            setActiveTab('premier');
        } else {
            setActiveTab('sales');
        }
    }, [department]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // For Bespoke, we use generic EMAIL type
                const res = await getMonthlyAvailability('BESPOKE_ESEND', year, month);
                setData(res);
            } catch (error) {
                console.error("Failed to load availability:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [year, month]);

    const handlePrevMonth = () => {
        setViewDate(new Date(year, month - 2, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(year, month, 1));
    };

    const toggleDate = (day: number) => {
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
    const startDayOffset = new Date(year, month - 1, 1).getDay();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const offsetArray = Array.from({ length: startDayOffset }, (_, i) => i);

    const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Get lists for current tab
    const currentLists = activeTab === 'sales' ? LIST_CATEGORIES.sales : LIST_CATEGORIES.premier;
    const availableFilters = ['all', ...currentLists];

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('sales')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: activeTab === 'sales' ? 'var(--primary)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        color: activeTab === 'sales' ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'sales' ? 600 : 400,
                        transition: 'all 0.2s'
                    }}
                >
                    Sales Lists
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('premier')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: activeTab === 'premier' ? 'var(--primary)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        color: activeTab === 'premier' ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'premier' ? 600 : 400,
                        transition: 'all 0.2s'
                    }}
                >
                    Premier Lists (Internal)
                </button>
            </div>

            {/* List Filter */}
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                    Filter by List:
                </label>
                <select
                    value={selectedListFilter}
                    onChange={e => setSelectedListFilter(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value="all">All Lists (Aggregate View)</option>
                    {currentLists.map(list => (
                        <option key={list} value={list}>{list}</option>
                    ))}
                </select>
                {selectedListFilter !== 'all' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Showing availability for: <strong>{selectedListFilter}</strong>
                    </p>
                )}
            </div>

            {/* Month Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="btn-icon-circle"
                    title="Previous Month"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{monthLabel}</h4>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="btn-icon-circle"
                    title="Next Month"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', background: 'var(--success)', borderRadius: '4px' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', background: 'var(--warning)', borderRadius: '4px' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Partially Booked</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', background: 'var(--danger)', borderRadius: '4px' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Full / Blocked</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>Selected</span>
                </div>
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
                        const dayOfWeek = new Date(year, month - 1, d).getDay();
                        const isSunday = dayOfWeek === 0;

                        let bg = 'rgba(255,255,255,0.05)';
                        let cursor = 'pointer';
                        let opacity = 1;

                        if (isSelected) {
                            bg = 'var(--primary)';
                        } else if (isSunday) {
                            bg = 'rgba(0,0,0,0.3)';
                            cursor = 'not-allowed';
                            opacity = 0.4;
                        } else if (dayData) {
                            if (dayData.available <= 0) {
                                bg = 'var(--danger)';
                                cursor = 'not-allowed';
                                opacity = 0.6;
                            } else if (dayData.used > 0) {
                                bg = 'var(--warning)';
                            } else {
                                bg = 'var(--success)';
                            }
                        }

                        return (
                            <div
                                key={d}
                                onClick={() => (!isSunday && (dayData?.available > 0 || isSelected)) ? toggleDate(d) : null}
                                style={{
                                    aspectRatio: '1',
                                    background: bg,
                                    borderRadius: '4px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: cursor,
                                    opacity: opacity,
                                    fontSize: '0.9rem',
                                    position: 'relative',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{d}</div>
                                {!isSunday && dayData && (
                                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                                        {dayData.available}/{dayData.capacity}
                                    </span>
                                )}
                                {isSunday && (
                                    <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>No bookings</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Info Box */}
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Rules for {activeTab === 'sales' ? 'Sales' : 'Premier'} Bookings:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', lineHeight: '1.6' }}>
                    {activeTab === 'sales' ? (
                        <>
                            <li>Maximum 2 e-sends per week (Mon-Sun)</li>
                            <li>No bookings on Sundays</li>
                            <li>Cannot book same day as Marketing/Fundraising</li>
                        </>
                    ) : (
                        <>
                            <li>No bookings on Sundays</li>
                            <li>Cannot book same day as Sales</li>
                            <li>Some lists limited to 1 send per month</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
