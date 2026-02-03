'use client';

import { useState } from 'react';
import { updateInventoryCapacity } from '../../lib/actions/admin';

interface InventoryItem {
    id: string;
    name: string;
    type: string;
    totalCapacity: number;
    unit: string;
}

export default function InventoryList({ initialItems }: { initialItems: InventoryItem[] }) {
    const [items, setItems] = useState(initialItems);

    const handleUpdate = async (id: string, val: string) => {
        const num = parseInt(val);
        if (!isNaN(num)) {
            await updateInventoryCapacity(id, num);
            // Optimistic update
            setItems(prev => prev.map(i => i.id === id ? { ...i, totalCapacity: num } : i));
        }
    };

    if (items.length === 0) {
        return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No inventory items found. database might be empty.</div>;
    }

    return (
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
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
