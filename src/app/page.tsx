import Sidebar from '../components/layout/Sidebar';
import { getBookings } from '../lib/actions/booking';
import UserDashboard from '../components/dashboard/UserDashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
    let bookings = [];
    try {
        bookings = await getBookings();
    } catch (e) {
        console.error('Failed to load dashboard:', e);
    }

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh' }}>
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Welcome to your Sales View</p>
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

                <UserDashboard initialBookings={bookings} />
            </section>
        </main>
    );
}
