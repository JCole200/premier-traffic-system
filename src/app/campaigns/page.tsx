import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';

export default async function CampaignsPage() {
    const bookings = await getBookings();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Active Campaigns</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Overview of all booked campaigns.</p>
                </header>

                {bookings.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>
                        No campaigns booked yet.
                    </div>
                ) : (
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
                                {bookings.map((booking: any) => (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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
                )}
            </section>
        </main>
    );
}
