'use client';

import { useState } from 'react';
import { updateInventoryItem, createInventoryItem, deleteInventoryItem } from '../../lib/actions/admin';

interface InventoryItem {
    id: string;
    name: string;
    type: string;
    totalCapacity: number;
    unit: string;
}

export default function InventoryList({ initialItems }: { initialItems: InventoryItem[] }) {
    const [items, setItems] = useState(initialItems);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State for New Item
    const [newItem, setNewItem] = useState({
        id: '',
        name: '',
        type: 'AUDIO',
        totalCapacity: 0,
        unit: 'Spots'
    });

    // Form State for Editing
    const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newItem.id || !newItem.name) return alert('ID and Name are required');

            await createInventoryItem(newItem);

            // Optimistic Add
            setItems(prev => [...prev, newItem]);
            setIsCreating(false);
            setNewItem({ id: '', name: '', type: 'AUDIO', totalCapacity: 0, unit: 'Spots' });
            alert('Item created successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to create item. ID must be unique.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item? This operation cannot be undone and may fail if bookings exist for this item.')) return;
        try {
            await deleteInventoryItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete item. It might be in use.');
        }
    };

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditForm(item);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await updateInventoryItem(editingId, editForm);
            setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...editForm } : i));
            setEditingId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to update item.');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Active Inventory Items</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>{items.length} items currently tracked in the database.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary"
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px var(--primary-shadow)'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Inventory Item
                </button>
            </div>

            {/* CREATE MODAL / FORM */}
            {isCreating && (
                <div className="glass-panel" style={{
                    padding: '2rem',
                    borderRadius: '20px',
                    border: '1px solid var(--primary)',
                    background: 'rgba(var(--primary-rgb), 0.05)',
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>Create New Inventory Item</h4>
                        <button onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Item ID (Immutable)</label>
                            <input
                                placeholder="e.g. email-daily-news"
                                value={newItem.id}
                                onChange={e => setNewItem({ ...newItem, id: e.target.value })}
                                style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Display Name</label>
                            <input
                                placeholder="e.g. Daily News"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Resource Type</label>
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                            >
                                <option value="AUDIO">Audio</option>
                                <option value="DISPLAY">Display</option>
                                <option value="BESPOKE_ESEND">Bespoke E-Send</option>
                                <option value="ADS_IN_ESEND">Ads in E-Send</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Baseline Capacity</label>
                            <input
                                type="number"
                                value={newItem.totalCapacity}
                                onChange={e => setNewItem({ ...newItem, totalCapacity: parseInt(e.target.value) || 0 })}
                                style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Metric Unit</label>
                            <input
                                placeholder="e.g. Spots, Pageviews"
                                value={newItem.unit}
                                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '0.8rem' }}>Confirm & Create</button>
                    </form>
                </div>
            )}

            {/* TABLE-LIKE LIST */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr 100px',
                    padding: '1.25rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-dim)',
                    background: 'rgba(255,255,255,0.05)',
                    borderBottom: '1px solid var(--border-subtle)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    <div>Inventory Item / ID</div>
                    <div>Type</div>
                    <div style={{ textAlign: 'right' }}>Baseline</div>
                    <div style={{ textAlign: 'right' }}>Current Usage</div>
                    <div style={{ textAlign: 'center' }}>Unit</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {items.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <p>No inventory items found in the database.</p>
                    </div>
                )}

                {items.map(item => (
                    <div key={item.id} className="inventory-row" style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr 100px',
                        alignItems: 'center',
                        gap: '0',
                        padding: '1.25rem 1.5rem',
                        transition: 'all 0.2s',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: editingId === item.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
                    }}>
                        {editingId === item.id ? (
                            <>
                                {/* EDIT MODE */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Name"
                                        style={{ background: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', padding: '0.4rem' }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{item.id}</span>
                                </div>
                                <select
                                    value={editForm.type}
                                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', padding: '0.4rem' }}
                                >
                                    <option value="AUDIO">Audio</option>
                                    <option value="DISPLAY">Display</option>
                                    <option value="BESPOKE_ESEND">Bespoke E-Send</option>
                                    <option value="ADS_IN_ESEND">Ads in E-Send</option>
                                </select>
                                <input
                                    type="number"
                                    value={editForm.totalCapacity}
                                    onChange={e => setEditForm({ ...editForm, totalCapacity: parseInt(e.target.value) || 0 })}
                                    style={{ background: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', padding: '0.4rem', textAlign: 'right' }}
                                />
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Editing...</div>
                                <input
                                    value={editForm.unit}
                                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', padding: '0.4rem', textAlign: 'center' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={saveEdit} title="Save" style={{ color: 'var(--success)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                    <button onClick={cancelEdit} title="Cancel" style={{ color: 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* VIEW MODE */}
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginTop: '0.2rem' }}>{item.id}</div>
                                </div>
                                <div style={{ display: 'flex' }}>
                                    <span style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        color: item.type === 'AUDIO' ? 'var(--accent-pink)' : item.type === 'DISPLAY' ? 'var(--accent-cyan)' : 'var(--warning)'
                                    }}>
                                        {item.type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 500, fontSize: '0.95rem' }}>{item.totalCapacity.toLocaleString()}</div>
                                <div style={{
                                    textAlign: 'right',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: (item as any).available < item.totalCapacity ? 'var(--warning)' : 'var(--success)'
                                }}>
                                    {Math.max(0, item.totalCapacity - ((item as any).available ?? item.totalCapacity)).toLocaleString()}
                                </div>
                                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)' }}>{item.unit}</div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => startEdit(item)}
                                        className="btn-icon-circle"
                                        title="Edit Item"
                                        style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.03)' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="btn-icon-circle"
                                        title="Delete Item"
                                        style={{ width: '32px', height: '32px', color: 'rgba(var(--danger-rgb), 0.8)', background: 'rgba(var(--danger-rgb), 0.05)' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            <style jsx>{`
                .inventory-row:hover {
                    background: rgba(255,255,255,0.04) !important;
                }
            `}</style>
        </div>
    );
}
