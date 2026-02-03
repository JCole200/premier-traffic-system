import Sidebar from '../../components/layout/Sidebar';
import { getInventoryItems } from '../../lib/actions/admin';
import InventoryList from '../../components/admin/InventoryList';

// Force dynamic because we are fetching data that changes
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const items = await getInventoryItems();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Admin Dashboard</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory baselines and system configuration.</p>
                </header>

                <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Inventory Baselines</h3>

                    <InventoryList initialItems={items} />
                </div>
            </section>
        </main>
    );
}
