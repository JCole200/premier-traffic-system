import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';
import ArchiveDashboard from '../../components/dashboard/ArchiveDashboard';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
    const bookings = await getBookings();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Global Campaign Archive</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Historical ledger of all completed and cancelled campaigns.</p>
                </header>

                <ArchiveDashboard bookings={bookings} />
            </section>
        </main>
    );
}
