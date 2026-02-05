import Sidebar from '../../components/layout/Sidebar';
import { checkAvailability } from '../../lib/actions/booking';
import { getInventoryItems } from '../../lib/actions/admin';
import { InventoryItem } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    // Mock Date Range for "Month View"
    const start = new Date().toISOString();
    const end = new Date().toISOString();

    const items = await getInventoryItems();

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Inventory Status</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Detailed breakdown of monthly capacity and utilization.</p>
                </header>

                <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Inventory Line</th>
                                <th style={{ padding: '1rem' }}>Type</th>
                                <th style={{ padding: '1rem' }}>Total Capacity</th>
                                <th style={{ padding: '1rem' }}>Booked</th>
                                <th style={{ padding: '1rem' }}>Available</th>
                                <th style={{ padding: '1rem' }}>Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inventory items found. database might be empty.</td>
                                </tr>
                            )}
                            {await Promise.all(items.map(async (item: InventoryItem) => {
                                // Calculate availability for this SPECIFIC item ID
                                const itemAvailable = await checkAvailability(item.type, start, end, item.id);
                                const itemUsed = item.totalCapacity - itemAvailable;
                                const percentUsed = item.totalCapacity > 0 ? (itemUsed / item.totalCapacity) : 0;

                                // Color coding
                                let statusColor = 'var(--success)';
                                if (percentUsed > 0.7) statusColor = 'var(--warning)';
                                if (percentUsed > 0.9) statusColor = 'var(--danger)';

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                background: 'rgba(255,255,255,0.1)'
                                            }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{item.totalCapacity.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{itemUsed.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: statusColor, fontWeight: 'bold' }}>{itemAvailable.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', width: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                    <div style={{ width: `${percentUsed * 100}%`, height: '100%', background: statusColor, borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(percentUsed * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
