import Sidebar from '../../../../components/layout/Sidebar';
import { getBookingById, getAuditLogs } from '../../../../lib/actions/booking';
import AuditHistoryView from '../../../../components/campaigns/AuditHistoryView';
import { notFound } from 'next/navigation';

export default async function CampaignAuditPage({ params }: { params: { id: string } }) {
    const booking = await getBookingById(params.id);
    if (!booking) notFound();

    const logs = await getAuditLogs(params.id);

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh', overflow: 'auto' }}>
                <AuditHistoryView booking={booking} logs={logs} />
            </section>
        </main>
    );
}

export const dynamic = 'force-dynamic';
