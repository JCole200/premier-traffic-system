import { getInventoryItems } from '@/lib/actions/admin';
import { getBookingRules } from '@/lib/actions/rules';
import { checkAvailability } from '@/lib/actions/booking';
import InventoryList from '@/components/admin/InventoryList';
import Sidebar from '@/components/layout/Sidebar';
import DateBlocker from '@/components/admin/DateBlocker';
import ConflictRuleManager from '@/components/admin/ConflictRuleManager';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const items = await getInventoryItems();
    const rules = await getBookingRules();

    // Calculate usage for the current month to show in the admin list
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const itemsWithUsage = await Promise.all(items.map(async (item: any) => {
        const available = await checkAvailability(item.type, start, end, item.id);
        return {
            ...item,
            available
        };
    }));

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Admin Dashboard</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inventory and block out dates.</p>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Full Width Inventory Section */}
                    <div className="glass-panel" style={{ borderRadius: '24px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem', fontWeight: 600, color: 'var(--primary)' }}>Inventory Configuration</h3>
                        <InventoryList initialItems={itemsWithUsage as any} />
                    </div>

                    {/* Collateral Tools Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                        <ConflictRuleManager initialRules={rules} />
                        <div className="glass-panel" style={{ borderRadius: '24px', padding: '2rem' }}>
                            <DateBlocker />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
