import Sidebar from '../../components/layout/Sidebar';
import InventoryCard from '../../components/dashboard/InventoryCard';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DateSelectionWizard from '../../components/dashboard/DateSelectionWizard';
import { checkAvailability } from '../../lib/actions/booking';
import { getInventoryItems } from '../../lib/actions/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AudioDashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const { date } = await searchParams;
    const selectedDate = date || null;

    if (!selectedDate) {
        return (
            <main className="grid-dashboard">
                <Sidebar />
                <section style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                    <div className="glass-panel" style={{ padding: '3rem', borderRadius: '24px', textAlign: 'center', maxWidth: '500px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔈</div>
                        <h1 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: 700 }}>Audio Inventory</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            Choose your campaign start date to see precise audio inventory availability across Radio Streams and Podcasts.
                        </p>
                        <DateSelectionWizard pathname="/audio-dashboard" />
                    </div>
                </section>
            </main>
        );
    }

    const end = new Date(new Date(selectedDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const allItems = await getInventoryItems();
    const audioItems = allItems.filter((i: any) => i.type === 'AUDIO');

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <DashboardHeader initialDate={selectedDate} title="Audio Dashboard" />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    {await Promise.all(audioItems.map(async (item: any) => {
                        const avail = await checkAvailability('AUDIO', selectedDate, end, item.id);
                        const usedPct = ((item.totalCapacity - avail) / item.totalCapacity) * 100;

                        return (
                            <div key={item.id} className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', borderTop: `4px solid var(--primary)` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>{item.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                                    </div>
                                    <Link href={`/booking?type=AUDIO&target=${item.id}&start=${selectedDate}`}>
                                        <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                            Book This
                                        </button>
                                    </Link>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: avail > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {avail.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available {item.unit}</div>
                                </div>

                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: `${usedPct > 100 ? 100 : usedPct}%`,
                                        background: usedPct > 90 ? 'var(--danger)' : usedPct > 70 ? 'var(--warning)' : 'var(--primary)',
                                        borderRadius: '4px'
                                    }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    <span>{usedPct.toFixed(0)}% Utilized</span>
                                    <span>Total: {item.totalCapacity.toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    }))}
                </div>
            </section>
        </main>
    );
}
