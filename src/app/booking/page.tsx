import { cookies } from 'next/headers';
import Sidebar from '../../components/layout/Sidebar';
import BookingForm from '../../components/booking/BookingForm';
import { getBookings } from '../../lib/actions/booking';

export default async function BookingPage() {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.has('admin_session');

    // Fetch existing bookings if admin
    const existingBookings = isAdmin ? await getBookings() : [];

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', maxWidth: '1200px', margin: '0 0' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>
                        {isAdmin ? 'Manage Campaigns' : 'Create New Campaign'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isAdmin
                            ? 'Create new campaigns or edit/delete existing bookings.'
                            : 'Enter campaign details to check availability and book inventory.'}
                    </p>
                </div>

                <BookingForm isAdmin={isAdmin} existingBookings={existingBookings} />
            </section>
        </main>
    );
}
