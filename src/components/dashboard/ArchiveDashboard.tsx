'use client';

import { useMemo, useState } from 'react';
import EditBookingModal from '../calendar/EditBookingModal';

interface Props {
    bookings: any[];
}

export default function ArchiveDashboard({ bookings }: Props) {
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    
    // Filter State
    const [filterType, setFilterType] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProduct, setFilterProduct] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Sort State
    const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'CLIENT_ASC'>('DATE_DESC');

    // Archive logic
    const archivedBookings = useMemo(() => {
        const now = new Date().getTime();
        
        let filtered = bookings.filter(b => {
            const bEnd = new Date(b.endDate).getTime();
            return b.status === 'CANCELLED' || bEnd < now;
        });

        // 1. Channel Filter
        if (filterType !== 'ALL') {
            filtered = filtered.filter(b => {
                if (filterType === 'EMAIL') {
                    return b.bookingType === 'EMAIL' || b.bookingType === 'ADS_IN_ESEND' || b.bookingType === 'BESPOKE_ESEND';
                }
                return b.bookingType === filterType;
            });
        }

        // 2. Search Query (Client or Booking Number)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b => 
                (b.clientName && b.clientName.toLowerCase().includes(q)) ||
                (b.contractNumber && b.contractNumber.toLowerCase().includes(q))
            );
        }

        // 3. Product Filter
        if (filterProduct !== 'ALL') {
            filtered = filtered.filter(b => {
                const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                return details.product === filterProduct;
            });
        }

        // 4. Date Range
        if (startDate && endDate) {
            const startT = new Date(startDate).getTime();
            const endT = new Date(endDate).getTime() + 86399999;
            filtered = filtered.filter(b => {
                const bEnd = new Date(b.endDate).getTime();
                return bEnd >= startT && bEnd <= endT;
            });
        }

        // 5. Sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'DATE_DESC') return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
            if (sortBy === 'DATE_ASC') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            if (sortBy === 'CLIENT_ASC') return a.clientName.localeCompare(b.clientName);
            return 0;
        });
    }, [bookings, filterType, searchQuery, filterProduct, startDate, endDate, sortBy]);

    const handleExportCSV = () => {
        const headers = ["Client", "Campaign", "Booking Number", "Channel", "Product", "End Reason", "Start Date", "End Date"];
        const rows = archivedBookings.map(b => {
            const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
            return [
                `"${b.clientName}"`,
                `"${b.campaignName}"`,
                b.contractNumber || 'N/A',
                b.bookingType,
                details.product || 'Unknown',
                b.status === 'CANCELLED' ? 'Cancelled' : 'Completed',
                b.startDate,
                b.endDate
            ];
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `archived_campaigns_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Filters Bar */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search Client or ID</label>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)' }} 
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Channel</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)' }}>
                        <option value="ALL">All Channels</option>
                        <option value="AUDIO">Audio Streaming</option>
                        <option value="DISPLAY">Digital Display</option>
                        <option value="EMAIL">E-Sends</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)' }}>
                        <option value="DATE_DESC">Newest First</option>
                        <option value="DATE_ASC">Oldest First</option>
                        <option value="CLIENT_ASC">Client Name (A-Z)</option>
                    </select>
                </div>

                <button onClick={handleExportCSV} style={{ padding: '0.6rem 1rem', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    📥 Download CSV
                </button>
            </div>

            <div className="glass-panel" style={{ borderRadius: '16px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Campaign Ledger</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Showing <strong>{archivedBookings.length}</strong> campaigns
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>ID & Client</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Product</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>End Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archivedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No archived campaigns matching your search.
                                    </td>
                                </tr>
                            ) : (
                                archivedBookings.map((b) => {
                                    const isCancelled = b.status === 'CANCELLED';
                                    const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                                                    
                                    return (
                                        <tr key={b.id} onClick={() => setSelectedBooking(b)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', opacity: isCancelled ? 0.6 : 1 }} className="hover-row">
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{b.contractNumber || b.id.slice(0,8)}</div>
                                                <div style={{ fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>{b.clientName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.campaignName}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                    {b.bookingType}
                                                </span>
                                                {details.product && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{details.product}</div>}
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
                                                <div style={{ fontSize: '0.85rem' }}>{b.endDate}</div>
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
