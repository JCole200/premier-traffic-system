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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Manage Inventory</h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary"
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                    + Add Item
                </button>
            </div>

            {/* CREATE MODAL / FORM */}
            {isCreating && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                    <h4 style={{ marginBottom: '1rem' }}>New Inventory Item</h4>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID (Unique Key)</label>
                            <input
                                placeholder="e.g. email-daily-news"
                                value={newItem.id}
                                onChange={e => setNewItem({ ...newItem, id: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name (Display)</label>
                            <input
                                placeholder="e.g. Daily News"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type</label>
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            >
                                <option value="AUDIO">Audio</option>
                                <option value="DISPLAY">Display</option>
                                <option value="BESPOKE_ESEND">Bespoke E-Send</option>
                                <option value="ADS_IN_ESEND">Ads in E-Send</option>
                                <option value="EMAIL">Email (Legacy)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Capacity</label>
                            <input
                                type="number"
                                value={newItem.totalCapacity}
                                onChange={e => setNewItem({ ...newItem, totalCapacity: parseInt(e.target.value) || 0 })}
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unit</label>
                            <input
                                placeholder="e.g. Spots, Emails"
                                value={newItem.unit}
                                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
                            <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST */}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 100px', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>NAME / ID</div>
                    <div>TYPE</div>
                    <div>CAPACITY</div>
                    <div>UNIT</div>
                    <div>ACTIONS</div>
                </div>

                {items.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inventory items found.</div>}

                {items.map(item => (
                    <div key={item.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1fr 1fr 100px',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: editingId === item.id ? 'var(--bg-nav-active)' : 'transparent',
                        borderRadius: '8px',
                        border: editingId === item.id ? '1px solid var(--primary)' : '1px solid transparent'
                    }}>
                        {editingId === item.id ? (
                            <>
                                {/* EDIT MODE */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>ID: {item.id}</div>
                                </div>
                                <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                                    <option value="AUDIO">Audio</option>
                                    <option value="DISPLAY">Display</option>
                                    <option value="BESPOKE_ESEND">Bespoke E-Send</option>
                                    <option value="ADS_IN_ESEND">Ads in E-Send</option>
                                    <option value="EMAIL">Email (Legacy)</option>
                                </select>
                                <input type="number" value={editForm.totalCapacity} onChange={e => setEditForm({ ...editForm, totalCapacity: parseInt(e.target.value) || 0 })} />
                                <input value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={saveEdit} style={{ color: 'var(--success)', background: 'transparent', border: 'none' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                    <button onClick={cancelEdit} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* VIEW MODE */}
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.id}</div>
                                </div>
                                <div>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        {item.type}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.9rem' }}>{item.totalCapacity}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.unit}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => startEdit(item)}
                                        className="btn-icon-circle"
                                        title="Edit"
                                        style={{ width: '30px', height: '30px' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="btn-icon-circle"
                                        title="Delete"
                                        style={{ width: '30px', height: '30px', color: 'var(--danger)' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
