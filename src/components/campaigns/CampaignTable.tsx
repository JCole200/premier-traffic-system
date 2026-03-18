'use client';

import { useState, useMemo } from 'react';
import BookingDetailsModal from './BookingDetailsModal';
import { useRouter } from 'next/navigation';
import ReservationTimer from './ReservationTimer';

const TYPE_LABELS: Record<string, string> = {
    AUDIO: '🔈 Audio',
    DISPLAY: '💻 Display',
    BESPOKE_ESEND: '📧 Bespoke E-send',
    ADS_IN_ESEND: '📨 Ads in E-send',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    CONFIRMED: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)' },
    RESERVED: { bg: 'rgba(234,179,8,0.1)', color: '#eab308' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
};

export default function CampaignTable({ bookings }: { bookings: any[] }) {
    const router = useRouter();
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'client' | 'status'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const filtered = useMemo(() => {
        let result = bookings.filter(b => {
            const q = searchQuery.toLowerCase();
            const matchesQuery = !q ||
                b.clientName?.toLowerCase().includes(q) ||
                b.campaignName?.toLowerCase().includes(q) ||
                b.contractNumber?.toLowerCase().includes(q) ||
                b.bookerName?.toLowerCase().includes(q) ||
                b.bookingType?.toLowerCase().includes(q);

            const matchesType = filterType === 'ALL' || b.bookingType === filterType;
            const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;

            const start = b.startDate;
            const end = b.endDate;
            const matchesFrom = !filterDateFrom || end >= filterDateFrom;
            const matchesTo = !filterDateTo || start <= filterDateTo;

            return matchesQuery && matchesType && matchesStatus && matchesFrom && matchesTo;
        });

        result.sort((a, b) => {
            let aVal = '', bVal = '';
            if (sortBy === 'date') { aVal = a.startDate; bVal = b.startDate; }
            else if (sortBy === 'client') { aVal = a.clientName; bVal = b.clientName; }
            else if (sortBy === 'status') { aVal = a.status; bVal = b.status; }
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

        return result;
    }, [bookings, searchQuery, filterType, filterStatus, filterDateFrom, filterDateTo, sortBy, sortDir]);

    const toggleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const SortIcon = ({ col }: { col: typeof sortBy }) =>
        sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

    return (
        <>
            {/* ── Search & Filter Bar ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                {/* Search */}
                <div style={{ flex: '1 1 260px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Search</div>
                    <input
                        type="text"
                        id="campaign-search"
                        placeholder="🔍 Client, campaign, contract, booker…"
                        style={{
                            width: '100%', padding: '0.7rem 1rem',
                            borderRadius: '10px', background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)', fontSize: '0.9rem'
                        }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <div style={{ flex: '0 1 180px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Media Type</div>
                    <select
                        style={{ width: '100%', padding: '0.7rem 0.8rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="ALL">All Types</option>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>

                {/* Status Filter */}
                <div style={{ flex: '0 1 150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Status</div>
                    <select
                        style={{ width: '100%', padding: '0.7rem 0.8rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {/* Date Range */}
                <div style={{ flex: '0 1 140px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>From Date</div>
                    <input type="date"
                        style={{ width: '100%', padding: '0.7rem 0.8rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-main)' }}
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                    />
                </div>
                <div style={{ flex: '0 1 140px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>To Date</div>
                    <input type="date"
                        style={{ width: '100%', padding: '0.7rem 0.8rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-main)' }}
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                    />
                </div>

                {/* Clear */}
                {(searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL' || filterDateFrom || filterDateTo) && (
                    <button
                        onClick={() => { setSearchQuery(''); setFilterType('ALL'); setFilterStatus('ALL'); setFilterDateFrom(''); setFilterDateTo(''); }}
                        style={{ padding: '0.7rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* ── Results Count ── */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Showing <strong style={{ color: 'var(--text-main)' }}>{filtered.length}</strong> of {bookings.length} campaigns
            </div>

            {/* ── Table ── */}
            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <tr>
                            <th style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('client')}>
                                Client / Campaign <SortIcon col="client" />
                            </th>
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('date')}>
                                Dates <SortIcon col="date" />
                            </th>
                            <th style={{ padding: '1rem' }}>Inventory</th>
                            <th style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => toggleSort('status')}>
                                Status <SortIcon col="status" />
                            </th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No campaigns match your filters.
                                </td>
                            </tr>
                        )}
                        {filtered.map((booking: any) => {
                            const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.CONFIRMED;
                            return (
                                <tr
                                    key={booking.id}
                                    onClick={() => setSelectedBooking(booking)}
                                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{booking.clientName}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{booking.campaignName}</div>
                                        {booking.contractNumber && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                📄 {booking.contractNumber}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                                            {TYPE_LABELS[booking.bookingType] || booking.bookingType || '—'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <div style={{ whiteSpace: 'nowrap' }}>{booking.startDate}</div>
                                        <div style={{ whiteSpace: 'nowrap' }}>→ {booking.endDate}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        {(booking.audioSpots || 0) > 0 && <div>🔈 {(booking.audioSpots).toLocaleString()}</div>}
                                        {(booking.displayImpressions || 0) > 0 && <div>💻 {(booking.displayImpressions).toLocaleString()}</div>}
                                        {booking.emailDates?.length > 0 && <div>📧 {booking.emailDates.length} sends</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600, ...statusStyle }}>
                                            ● {booking.status}
                                        </span>
                                        <ReservationTimer
                                            expiresAt={booking.expiresAt ?? null}
                                            status={booking.status}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); router.push(`/campaigns/${booking.id}/audit`); }}
                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        >
                                            📜 History
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
            )}
        </>
    );
}
