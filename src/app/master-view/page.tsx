import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';
import { getInventoryItems } from '../../lib/actions/admin';
import MasterViewDashboard from '../../components/dashboard/MasterViewDashboard';

export const dynamic = 'force-dynamic';

export default async function MasterViewPage() {
    const [bookings, inventoryItems] = await Promise.all([
        getBookings(),
        getInventoryItems()
    ]);

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', height: '100vh', overflow: 'auto' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Master Dashboard & Calendar</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Centralized view of all inventory, bookings, and delivery status.</p>
                </header>

                <MasterViewDashboard
                    initialBookings={bookings}
                    inventoryItems={inventoryItems}
                />
            </section>
        </main>
    );
}
