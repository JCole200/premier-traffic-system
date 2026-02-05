import DateBlocker from '../../components/admin/DateBlocker';

// ...

export default async function AdminPage() {
    const items = await getInventoryItems();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Admin Dashboard</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory and block out dates.</p>
                </header>

                <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Inventory Baselines</h3>
                    <InventoryList initialItems={items} />
                </div>

                <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', padding: '2rem' }}>
                    <DateBlocker />
                </div>
            </section>
        </main>
    );
}
