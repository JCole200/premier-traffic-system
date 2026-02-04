import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';
import CampaignTable from '../../components/campaigns/CampaignTable';

export const dynamic = 'force-dynamic';

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
                    <CampaignTable bookings={bookings} />
                )}
            </section>
        </main>
    );
}
