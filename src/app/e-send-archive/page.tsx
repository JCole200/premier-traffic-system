import Sidebar from '@/components/layout/Sidebar';
import { getESendArchives } from '@/lib/actions/esend';
import ESendArchiveClient from '@/components/esend/ESendArchiveClient';

export const dynamic = 'force-dynamic';

export default async function ESendArchivePage() {
    const archivesRaw = await getESendArchives();

    // Serialize dates to avoid server→client serialization errors
    const archives = archivesRaw.map((a: any) => ({
        ...a,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt
    }));

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh' }}>
                <ESendArchiveClient initialArchives={archives} />
            </section>
        </main>
    );
}
