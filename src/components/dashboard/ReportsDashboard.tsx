'use client';

import { useMemo, useState } from 'react';
import EditBookingModal from '../calendar/EditBookingModal';

interface Props {
    bookings: any[];
}

export default function ReportsDashboard({ bookings }: Props) {
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // KPI Calculations
    const kpis = useMemo(() => {
        const now = new Date().getTime();
        const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        
        let active = 0;
        let pending = 0;
        let totalMonthlyCampaigns = 0;
        let totalAudioImps = 0;
        let totalDisplayImps = 0;

        bookings.forEach(b => {
            const bStart = new Date(b.startDate).getTime();
            const bEnd = new Date(b.endDate).getTime();
            
            // Active right now
            if (b.status === 'CONFIRMED' && bStart <= now && bEnd >= now) {
                active++;
            }

            // Pending action
            if (b.status === 'RESERVED') {
                pending++;
            }

            // Occurring this month
            if (bEnd >= thisMonthStart) {
                totalMonthlyCampaigns++;
                if (b.bookingType === 'AUDIO') {
                    totalAudioImps += (b.audioSpots || 0);
                }
                if (b.bookingType === 'DISPLAY') {
                    totalDisplayImps += (b.displayImpressions || 0);
                }
            }
        });

        return {
            active,
            pending,
            totalMonthlyCampaigns,
            totalAudioImps,
            totalDisplayImps
        };
    }, [bookings]);

    // Top Recent Activity (Last 10 created/updated)
    // Simulated as the newest by ID/Date since we don't have updatedAt exposed right now easily, 
    // assuming they are sorted implicitly or by ID if it's a numeric/uuid that correlates
    const recentActivity = useMemo(() => {
        return [...bookings]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
    }, [bookings]);

    // Global CSV Exporter
    const handleExportCSV = () => {
        const headers = ["ID", "Client", "Campaign", "Type", "Status", "Start", "End"];
        const rows = bookings.map(b => [
            b.id,
            `"${b.clientName}"`,
            `"${b.campaignName}"`,
            b.bookingType,
            b.status,
            new Date(b.startDate).toLocaleDateString(),
            new Date(b.endDate).toLocaleDateString()
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `premier_campaign_performance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleExportCSV} className="btn-primary" style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-cyan)' }}>
                    Download Master CSV File
                </button>
            </div>

            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Live Network Campaigns</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{kpis.active}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Currently broadcasting</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--warning)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Requires Action (Pending)</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{kpis.pending}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>Reserved or Awaiting approvals</div>
                </div>
                
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--accent-magenta)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Audio Impacts (Month)</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{(kpis.totalAudioImps / 1000).toFixed(0)}k</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reserved volume booked</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid #3b82f6' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Display Impressions (Month)</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{(kpis.totalDisplayImps / 1000).toFixed(0)}k</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reserved volume booked</div>
                </div>
            </div>

            {/* Recent Activity Ledger */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Booking Activity</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Client / Campaign</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Type</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dates</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map((b) => (
                                <tr key={b.id} onClick={() => setSelectedBooking(b)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} className="hover-row">
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{b.clientName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.campaignName}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                            {b.bookingType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '999px',
                                            background: b.status === 'CONFIRMED' ? 'rgba(34, 197, 94, 0.2)' : b.status === 'RESERVED' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: b.status === 'CONFIRMED' ? 'var(--success)' : b.status === 'RESERVED' ? 'var(--warning)' : 'var(--danger)'
                                        }}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{b.startDate}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {b.endDate}</div>
                                    </td>
                                </tr>
                            ))}
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
                .hover-row:hover { background: rgba(255,255,255,0.03); }
            `}} />
        </div>
    );
}
