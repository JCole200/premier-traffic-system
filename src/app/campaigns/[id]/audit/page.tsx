import Sidebar from '../../../../components/layout/Sidebar';
import { getBookingById, getAuditLogs } from '../../../../lib/actions/booking';
import { notFound } from 'next/navigation';
import AuditHistoryView from '../../../../components/campaigns/AuditHistoryView';

export default async function CampaignAuditPage({ params }: { params: { id: string } }) {
    const booking = await getBookingById(params.id);
    if (!booking) notFound();

    const logs = await getAuditLogs(params.id);

    // Serialize all booking dates to strings to avoid Next.js serialization errors
    const serializedBooking = {
        ...booking,
        startDate: typeof booking.startDate === 'string' ? booking.startDate : (booking.startDate as Date).toISOString(),
        endDate: typeof booking.endDate === 'string' ? booking.endDate : (booking.endDate as Date).toISOString(),
        createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
        updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : booking.updatedAt,
        expiresAt: booking.expiresAt instanceof Date ? booking.expiresAt.toISOString() : booking.expiresAt,
        lastAlertSentAt: booking.lastAlertSentAt instanceof Date ? booking.lastAlertSentAt.toISOString() : booking.lastAlertSentAt,
    };

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh', overflow: 'auto' }}>
                <AuditHistoryView booking={serializedBooking} logs={logs} />
            </section>
        </main>
    );
}

export const dynamic = 'force-dynamic';
