import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';
import { getInventoryItems } from '../../lib/actions/admin';
import ESendsDashboard from '../../components/dashboard/ESendsDashboard';

export const dynamic = 'force-dynamic';

export default async function ESendsPage() {
    const [bookings, inventoryItems] = await Promise.all([
        getBookings(),
        getInventoryItems()
    ]);

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>E-sends Inventory Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time availability and campaign management for bespoke e-sends and newsletter ads.</p>
                </header>

                <ESendsDashboard 
                    initialBookings={bookings} 
                    inventoryItems={inventoryItems} 
                />
            </section>
        </main>
    );
}
