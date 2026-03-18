import Sidebar from '../components/layout/Sidebar';
import Link from 'next/link';
import { getBookings } from '../lib/actions/booking';
import { getInventoryItems } from '../lib/actions/admin';
import MasterViewDashboard from '../components/dashboard/MasterViewDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const [bookings, inventoryItems] = await Promise.all([
        getBookings(),
        getInventoryItems()
    ]);

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh' }}>
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Welcome back, Judah Cole - Live Inventory & Delivery</p>
                    </div>
                    <Link href="/booking">
                        <button className="btn-primary">
                            + New Campaign
                        </button>
                    </Link>
                </header>

                <MasterViewDashboard
                    initialBookings={bookings}
                    inventoryItems={inventoryItems}
                />
            </section>
        </main>
    );
}


