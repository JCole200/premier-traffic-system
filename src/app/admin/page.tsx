'use client';

import Sidebar from '../../components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { getInventoryItems, updateInventoryCapacity } from '../../lib/actions/admin';

export default function AdminPage() {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        getInventoryItems().then(setItems);
    }, []);

    const handleUpdate = async (id: string, val: string) => {
        const num = parseInt(val);
        if (!isNaN(num)) {
            await updateInventoryCapacity(id, num);
            // Optimistic update locally
            setItems(prev => prev.map(i => i.id === id ? { ...i, totalCapacity: num } : i));
        }
    };

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

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {items.map(item => (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {item.id}</div>
                                </div>
                                <div style={{ color: 'var(--text-dim)' }}>
                                    {item.type} ({item.unit})
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        defaultValue={item.totalCapacity}
                                        onBlur={(e) => handleUpdate(item.id, e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
