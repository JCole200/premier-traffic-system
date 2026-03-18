'use client';

import { useState } from 'react';
import { createBookingRule, deleteBookingRule, updateBookingRule } from '@/lib/actions/rules';

interface BookingRule {
    id: string;
    name: string;
    category: string;
    conflictsWith: string;
    maxDaily: number;
    isActive: boolean;
    bookingType?: string;
    description?: string;
}

const CATEGORIES = ['PAID', 'GIFT', 'FILLER', 'INTERNAL'];
const BOOKING_TYPES = ['ANY', 'AUDIO', 'DISPLAY', 'BESPOKE_ESEND', 'ADS_IN_ESEND'];
const TYPE_LABELS: Record<string, string> = {
    ANY: 'All Types', AUDIO: '🔈 Audio', DISPLAY: '💻 Display',
    BESPOKE_ESEND: '✉️ Bespoke E-send', ADS_IN_ESEND: '📰 Newsletter Ad'
};
const CAT_COLORS: Record<string, string> = {
    PAID: '#6366f1', GIFT: '#10b981', FILLER: '#f59e0b', INTERNAL: '#64748b'
};

interface Props { initialRules: any[] }

const emptyRule = { name: '', category: 'PAID', conflictsWith: [] as string[], maxDaily: 1, bookingType: 'ANY', description: '' };

export default function ConflictRuleManager({ initialRules }: Props) {
    const [rules, setRules] = useState<BookingRule[]>(initialRules.map(r => ({
        ...r,
        conflictsWith: typeof r.conflictsWith === 'string' ? r.conflictsWith : JSON.stringify(r.conflictsWith),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })));

    const [mode, setMode] = useState<'list' | 'add' | 'matrix'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyRule });
    const [isSaving, setIsSaving] = useState(false);

    const openAdd = () => { setForm({ ...emptyRule }); setEditingId(null); setMode('add'); };
    const openEdit = (rule: BookingRule) => {
        setForm({
            name: rule.name,
            category: rule.category,
            conflictsWith: JSON.parse(rule.conflictsWith) as string[],
            maxDaily: rule.maxDaily,
            bookingType: (rule as any).bookingType || 'ANY',
            description: (rule as any).description || '',
        });
        setEditingId(rule.id);
        setMode('add');
    };

    const toggleConflict = (cat: string) => {
        setForm(prev => ({
            ...prev,
            conflictsWith: prev.conflictsWith.includes(cat)
                ? prev.conflictsWith.filter(c => c !== cat)
                : [...prev.conflictsWith, cat]
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) return alert('Rule name is required.');
        setIsSaving(true);
        try {
            if (editingId) {
                const updated = await updateBookingRule(editingId, {
                    name: form.name,
                    category: form.category,
                    conflictsWith: form.conflictsWith,
                    maxDaily: form.maxDaily,
                    description: form.description,
                });
                setRules(prev => prev.map(r => r.id === editingId
                    ? { ...r, ...updated, conflictsWith: JSON.stringify(form.conflictsWith) }
                    : r));
            } else {
                const rule = await createBookingRule({
                    name: form.name,
                    category: form.category,
                    conflictsWith: form.conflictsWith,
                    maxDaily: form.maxDaily,
                });
                setRules(prev => [{ ...rule, conflictsWith: JSON.stringify(form.conflictsWith) }, ...prev]);
            }
            setMode('list');
            setEditingId(null);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this rule permanently?')) return;
        await deleteBookingRule(id);
        setRules(prev => prev.filter(r => r.id !== id));
    };

    const toggleActive = async (rule: BookingRule) => {
        const updated = await updateBookingRule(rule.id, { isActive: !rule.isActive });
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: updated.isActive } : r));
    };

    // Build conflict matrix data
    const conflictMatrix: Record<string, Record<string, number>> = {};
    CATEGORIES.forEach(a => { conflictMatrix[a] = {}; CATEGORIES.forEach(b => { conflictMatrix[a][b] = 0; }); });
    rules.filter(r => r.isActive).forEach(rule => {
        const conflicts = JSON.parse(rule.conflictsWith) as string[];
        conflicts.forEach(c => {
            if (conflictMatrix[rule.category]) conflictMatrix[rule.category][c] = (conflictMatrix[rule.category][c] || 0) + 1;
            if (conflictMatrix[c]) conflictMatrix[c][rule.category] = (conflictMatrix[c][rule.category] || 0) + 1;
        });
    });

    return (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Category Conflict Rules</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Prevent overlapping bookings between category types on the same dates.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setMode(mode === 'matrix' ? 'list' : 'matrix')}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        {mode === 'matrix' ? '← Back' : '⊞ Matrix'}
                    </button>
                    <button onClick={openAdd} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                        + New Rule
                    </button>
                </div>
            </div>

            {/* ── CONFLICT MATRIX VIEW ── */}
            {mode === 'matrix' && (
                <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Shows how many active rules restrict each pair of categories. A cell with a number means those categories have active conflict rules.
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}></th>
                                    {CATEGORIES.map(c => (
                                        <th key={c} style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontSize: '0.8rem', color: CAT_COLORS[c] || 'var(--text-main)' }}>{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CATEGORIES.map(row => (
                                    <tr key={row}>
                                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: CAT_COLORS[row] }}>{row}</td>
                                        {CATEGORIES.map(col => {
                                            const count = conflictMatrix[row]?.[col] ?? 0;
                                            const isSelf = row === col;
                                            return (
                                                <td key={col} style={{
                                                    padding: '0.6rem 0.8rem', textAlign: 'center', fontSize: '0.8rem', borderRadius: '4px',
                                                    background: isSelf ? 'rgba(255,255,255,0.03)' : count > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.06)',
                                                    color: isSelf ? 'var(--text-muted)' : count > 0 ? '#ef4444' : '#10b981',
                                                    border: '1px solid rgba(255,255,255,0.04)'
                                                }}>
                                                    {isSelf ? '—' : count > 0 ? `⚠ ${count}` : '✓'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span><span style={{ color: '#10b981' }}>✓</span> No conflict rules</span>
                        <span><span style={{ color: '#ef4444' }}>⚠ N</span> N active rules restricting this pair</span>
                    </div>
                </div>
            )}

            {/* ── ADD / EDIT FORM ── */}
            {mode === 'add' && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>
                        {editingId ? 'Edit Rule' : 'New Conflict Rule'}
                    </h4>

                    <div style={{ display: 'grid', gap: '1.2rem' }}>
                        {/* Rule name + description */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Rule Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. No PAID + GIFT same day"
                                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Description (optional)</label>
                            <input
                                type="text"
                                placeholder="Plain-language explanation of this rule"
                                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Applies To Category</label>
                                <select
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Max Allowed Per Day</label>
                                <input
                                    type="number" min={1} max={99}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                                    value={form.maxDaily}
                                    onChange={e => setForm({ ...form, maxDaily: Math.max(1, parseInt(e.target.value) || 1) })}
                                />
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    If total combined bookings on a date ≥ this number, the booking is blocked.
                                </div>
                            </div>
                        </div>

                        {/* Conflicts With */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Cannot Be Combined With (select all that apply)
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat} type="button"
                                        onClick={() => toggleConflict(cat)}
                                        style={{
                                            padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.82rem',
                                            border: `1px solid ${form.conflictsWith.includes(cat) ? CAT_COLORS[cat] : 'var(--border-subtle)'}`,
                                            background: form.conflictsWith.includes(cat) ? `${CAT_COLORS[cat]}22` : 'transparent',
                                            color: form.conflictsWith.includes(cat) ? CAT_COLORS[cat] : 'var(--text-muted)',
                                            cursor: 'pointer', transition: 'all 0.15s'
                                        }}
                                    >
                                        {form.conflictsWith.includes(cat) ? '✓ ' : ''}{cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live preview */}
                        {form.name && form.conflictsWith.length > 0 && (
                            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                📋 <strong style={{ color: 'var(--primary)' }}>{form.name}</strong>: When a <strong>{form.category}</strong> booking is made, the combined total on that date with <strong>{form.conflictsWith.join(', ')}</strong> cannot exceed <strong>{form.maxDaily}</strong>.
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setMode('list'); setEditingId(null); }}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
                                {isSaving ? 'Saving…' : editingId ? 'Update Rule' : 'Create Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RULES LIST ── */}
            {mode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rules.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No conflict rules configured yet.
                            <br />
                            <span style={{ fontSize: '0.8rem' }}>Click <strong>+ New Rule</strong> to prevent categories from overlapping on the same dates.</span>
                        </div>
                    )}
                    {rules.map(rule => {
                        const conflicts = JSON.parse(rule.conflictsWith) as string[];
                        return (
                            <div key={rule.id} style={{
                                padding: '1rem 1.2rem', borderRadius: '10px',
                                background: rule.isActive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                border: `1px solid ${rule.isActive ? 'var(--border-subtle)' : 'rgba(255,255,255,0.04)'}`,
                                opacity: rule.isActive ? 1 : 0.55
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rule.name}</span>
                                            <span style={{
                                                fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700,
                                                background: rule.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                                                color: rule.isActive ? '#10b981' : 'var(--text-muted)'
                                            }}>
                                                {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${CAT_COLORS[rule.category]}22`, color: CAT_COLORS[rule.category], fontWeight: 600, fontSize: '0.75rem' }}>
                                                {rule.category}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>conflicts with</span>
                                            {conflicts.map(c => (
                                                <span key={c} style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: `${CAT_COLORS[c] || '#999'}22`, color: CAT_COLORS[c] || '#999', fontWeight: 600, fontSize: '0.75rem' }}>
                                                    {c}
                                                </span>
                                            ))}
                                            <span style={{ color: 'var(--text-muted)' }}>· max <strong style={{ color: 'var(--text-main)' }}>{rule.maxDaily}</strong>/day</span>
                                        </div>
                                        {(rule as any).description && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                                                {(rule as any).description}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                        <button onClick={() => toggleActive(rule)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            {rule.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button onClick={() => openEdit(rule)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--primary)', cursor: 'pointer' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(rule.id)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
