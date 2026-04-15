import Sidebar from '../../components/layout/Sidebar';
import { getBookings } from '../../lib/actions/booking';
import { getInventoryItems } from '../../lib/actions/admin';
import DisplayInventoryDashboard from '../../components/dashboard/DisplayInventoryDashboard';

export const dynamic = 'force-dynamic';

export default async function DisplayDashboard() {
    const [bookings, inventoryItems] = await Promise.all([
        getBookings(),
        getInventoryItems()
    ]);

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Digital Display Inventory Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time availability and campaign management for all website placements and ad formats.</p>
                </header>

                <DisplayInventoryDashboard 
                    initialBookings={bookings} 
                    inventoryItems={inventoryItems} 
                />
            </section>
        </main>
    );
}
