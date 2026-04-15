'use client';

import { useMemo, useState } from 'react';
import EditBookingModal from '../calendar/EditBookingModal';

interface Props {
    bookings: any[];
}

export default function ArchiveDashboard({ bookings }: Props) {
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [filterType, setFilterType] = useState('ALL');

    // Archive logic: End date in the past, or cancelled
    const archivedBookings = useMemo(() => {
        const now = new Date().getTime();
        
        let filtered = bookings.filter(b => {
            const bEnd = new Date(b.endDate).getTime();
            return b.status === 'CANCELLED' || bEnd < now;
        });

        if (filterType !== 'ALL') {
            filtered = filtered.filter(b => {
                if (filterType === 'EMAIL') {
                    return b.bookingType === 'EMAIL' || b.bookingType === 'ADS_IN_ESEND' || b.bookingType === 'BESPOKE_ESEND';
                }
                return b.bookingType === filterType;
            });
        }

        // Sort by end date descending (most recently ended first)
        return filtered.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    }, [bookings, filterType]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inventory Type</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', minWidth: '150px' }}>
                        <option value="ALL">All Campaigns</option>
                        <option value="AUDIO">Audio Streaming</option>
                        <option value="DISPLAY">Digital Display</option>
                        <option value="EMAIL">E-Sends</option>
                    </select>
                </div>
                
                <div style={{ flex: 1 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Showing <strong>{archivedBookings.length}</strong> past/cancelled campaigns
                </div>
            </div>

            <div className="glass-panel" style={{ borderRadius: '16px', padding: '2rem' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Client / Campaign</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Type</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>End Reason</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dates</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archivedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No archived campaigns found.
                                    </td>
                                </tr>
                            ) : (
                                archivedBookings.map((b) => {
                                    const isCancelled = b.status === 'CANCELLED';
                                    return (
                                        <tr key={b.id} onClick={() => setSelectedBooking(b)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', opacity: isCancelled ? 0.6 : 1 }} className="hover-row">
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>{b.clientName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.campaignName}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                    {b.bookingType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '4px',
                                                    background: isCancelled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    color: isCancelled ? 'var(--danger)' : 'var(--text-muted)'
                                                }}>
                                                    {isCancelled ? 'Cancelled' : 'Completed'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.85rem' }}>{b.startDate}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {b.endDate}</div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedBooking && (
                <EditBookingModal 
                    booking={selectedBooking} 
                    onClose={() => setSelectedBooking(null)} 
                />
            )}

            <style dangerouslySetInnerHTML={{__html:`
                .hover-row:hover { background: rgba(255,255,255,0.05); }
            `}} />
        </div>
    );
}
