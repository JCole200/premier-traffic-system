'use client';

import { useState } from 'react';
import BookingDetailsModal from './BookingDetailsModal';

export default function CampaignTable({ bookings }: { bookings: any[] }) {
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBookings = bookings.filter(b =>
        b.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Search campaigns, clients, or contract numbers..."
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '0.8rem 1.2rem',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.9rem'
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Client</th>
                            <th style={{ padding: '1rem' }}>Campaign</th>
                            <th style={{ padding: '1rem' }}>Dates</th>
                            <th style={{ padding: '1rem' }}>Geo</th>
                            <th style={{ padding: '1rem' }}>Inventory Used</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map((booking: any) => (
                            <tr
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                style={{
                                    borderBottom: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{booking.clientName}</td>
                                <td style={{ padding: '1rem' }}>{booking.campaignName}</td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                    {booking.startDate} <br /> to {booking.endDate}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.1)'
                                    }}>
                                        {booking.geoTarget}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                    {(booking.audioSpots || 0) > 0 && <div style={{ marginBottom: '0.25rem' }}>🔈 {(booking.audioSpots || 0).toLocaleString()} Audio</div>}
                                    {(booking.displayImpressions || 0) > 0 && <div style={{ marginBottom: '0.25rem' }}>💻 {(booking.displayImpressions || 0).toLocaleString()} Display</div>}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>● Confirmed</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </>
    );
}
