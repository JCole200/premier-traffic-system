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
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href="/audio-dashboard">
                            <button className="btn-primary" style={{ background: 'var(--primary)' }}>
                                🔈 Book Audio
                            </button>
                        </Link>
                        <Link href="/display-dashboard">
                            <button className="btn-primary" style={{ background: 'var(--accent-cyan, #06b6d4)' }}>
                                💻 Book Display
                            </button>
                        </Link>
                        <Link href="/booking">
                            <button className="btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                                ✉️ E-sends
                            </button>
                        </Link>
                    </div>
                </header>

                <MasterViewDashboard
                    initialBookings={bookings}
                    inventoryItems={inventoryItems}
                />
            </section>
        </main>
    );
}


