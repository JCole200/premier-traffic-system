import Sidebar from '../../components/layout/Sidebar';
import MasterCalendar from '../../components/calendar/MasterCalendar';
import { getBookings } from '../../lib/actions/booking';
import { getInventoryItems } from '../../lib/actions/admin';

export default async function AvailabilityPage() {
    const bookings = await getBookings();
    const inventoryItems = await getInventoryItems();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', height: '100vh', overflow: 'hidden' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Master Availability</h2>
                    <p style={{ color: 'var(--text-muted)' }}>View and manage bookings across all channels.</p>
                </div>

                <MasterCalendar
                    bookings={bookings}
                    inventoryItems={inventoryItems}
                />
            </section>
        </main>
    );
}

// Force dynamic since we fetch data
export const dynamic = 'force-dynamic';
