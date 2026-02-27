'use client';

import { useState } from 'react';
import { createBookingRule, deleteBookingRule, updateBookingRule } from '@/lib/actions/rules';

interface BookingRule {
    id: string;
    name: string;
    category: string;
    conflictsWith: string; // JSON string
    maxDaily: number;
    isActive: boolean;
}

interface Props {
    initialRules: any[];
}

export default function ConflictRuleManager({ initialRules }: Props) {
    const [rules, setRules] = useState<BookingRule[]>(initialRules.map(r => ({
        ...r,
        conflictsWith: typeof r.conflictsWith === 'string' ? r.conflictsWith : JSON.stringify(r.conflictsWith)
    })));

    const [isAdding, setIsAdding] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        category: 'PAID',
        conflictsWith: [] as string[],
        maxDaily: 1
    });

    const categories = ['PAID', 'GIFT', 'FILLER', 'INTERNAL'];

    const handleCreate = async () => {
        if (!newRule.name) return alert('Name is required');
        try {
            const rule = await createBookingRule(newRule);
            setRules([{ ...rule, conflictsWith: JSON.stringify(newRule.conflictsWith) } as any, ...rules]);
            setIsAdding(false);
            setNewRule({ name: '', category: 'PAID', conflictsWith: [], maxDaily: 1 });
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this rule?')) return;
        await deleteBookingRule(id);
        setRules(rules.filter(r => r.id !== id));
    };

    const toggleActive = async (rule: BookingRule) => {
        const updated = await updateBookingRule(rule.id, { isActive: !rule.isActive });
        setRules(rules.map(r => r.id === rule.id ? { ...r, isActive: updated.isActive } : r));
    };

    const toggleConflict = (cat: string) => {
        setNewRule(prev => ({
            ...prev,
            conflictsWith: prev.conflictsWith.includes(cat)
                ? prev.conflictsWith.filter(c => c !== cat)
                : [...prev.conflictsWith, cat]
        }));
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Category Conflict Rules</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                >
                    {isAdding ? 'Cancel' : '+ New Rule'}
                </button>
            </header>

            {isAdding && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Rule Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Paid vs Gift Exclusivity"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'white' }}
                                value={newRule.name}
                                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>For Category</label>
                                <select
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'white' }}
                                    value={newRule.category}
                                    onChange={e => setNewRule({ ...newRule, category: e.target.value })}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Max Daily Total</label>
                                <input
                                    type="number"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'white' }}
                                    value={newRule.maxDaily}
                                    onChange={e => setNewRule({ ...newRule, maxDaily: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Conflicts With</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleConflict(cat)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            border: '1px solid var(--border-subtle)',
                                            background: newRule.conflictsWith.includes(cat) ? 'var(--primary)' : 'transparent',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleCreate} className="btn-primary" style={{ marginTop: '0.5rem' }}>Create Rule</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {rules.length === 0 && <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>No rules configured yet.</p>}
                {rules.map(rule => {
                    const conflicts = JSON.parse(rule.conflictsWith);
                    return (
                        <div key={rule.id} style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: rule.isActive ? 1 : 0.6
                        }}>
                            <div>
                                <h4 style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{rule.name}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    If <span style={{ color: 'var(--primary)' }}>{rule.category}</span> is booked,
                                    cannot exceed **{rule.maxDaily}** total on same day with **{conflicts.join(', ')}**.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => toggleActive(rule)}
                                    style={{ background: 'transparent', border: 'none', color: rule.isActive ? '#10b981' : '#6b7280', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    {rule.isActive ? 'Active' : 'Disabled'}
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
