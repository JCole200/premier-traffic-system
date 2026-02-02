import Sidebar from '../../components/layout/Sidebar';
import BookingForm from '../../components/booking/BookingForm';

export default function BookingPage() {
    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', maxWidth: '1000px', margin: '0 0' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Create New Campaign</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Enter campaign details to check availability and book inventory.</p>
                </div>

                <BookingForm />
            </section>
        </main>
    );
}
