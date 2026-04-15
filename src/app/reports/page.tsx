import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';
import ReportsDashboard from '../../components/dashboard/ReportsDashboard';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const bookings = await getBookings();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Reports & Performance</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Aggregate data view and unified dashboard exporting tools.</p>
                </header>

                <ReportsDashboard bookings={bookings} />
            </section>
        </main>
    );
}
