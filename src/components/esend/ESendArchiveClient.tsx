'use client';

import { useState, useMemo } from 'react';
import { createESendArchive, deleteESendArchive } from '../../lib/actions/esend';
import { useRouter } from 'next/navigation';

const EMAIL_TYPES = [
    { id: 'NEWSLETTER', label: '📰 Newsletter / Ads in E-send', desc: 'Ad placement within existing newsletters (Daily Content, WA, CTY, etc.)' },
    { id: 'BESPOKE', label: '✉️ Bespoke E-send', desc: 'Standalone branded email to a mailing list' },
    { id: 'FUNDRAISING', label: '❤️ Fundraising E-send', desc: 'Charity or fundraising appeal sends' },
    { id: 'INTERNAL', label: '🏢 Internal E-send', desc: 'Internal comms or team updates' },
];

export default function ESendArchiveClient({ initialArchives }: { initialArchives: any[] }) {
    const router = useRouter();
    const [archives, setArchives] = useState(initialArchives);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [showAdd, setShowAdd] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const [form, setForm] = useState({ title: '', copy: '', link: '', type: 'NEWSLETTER' });

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return archives.filter(a => {
            const matchQ = !q || a.title?.toLowerCase().includes(q) || a.copy?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q);
            const matchType = filterType === 'ALL' || a.type === filterType;
            return matchQ && matchType;
        });
    }, [archives, searchQuery, filterType]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.copy.trim()) return;
        setIsSubmitting(true);
        try {
            const newEntry = await createESendArchive(form);
            setArchives(prev => [{ ...newEntry, createdAt: new Date().toISOString() }, ...prev]);
            setForm({ title: '', copy: '', link: '', type: 'NEWSLETTER' });
            setShowAdd(false);
            router.refresh();
        } catch (err) {
            alert('Failed to save: ' + (err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await deleteESendArchive(id);
            setArchives(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            alert('Failed to delete: ' + (err as Error).message);
        }
    };

    const typeInfo = (type: string) => EMAIL_TYPES.find(t => t.id === type);

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>E-Send Archive</h1>
                    <p style={{ color: 'var(--text-muted)' }}>A searchable record of all e-send copy and links, organised by type.</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {showAdd ? '✕ Cancel' : '+ Add E-Send'}
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <form onSubmit={handleAdd} className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'grid', gap: '1.2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Archive New E-Send</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Title / Subject Line *</label>
                            <input
                                required
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                                placeholder="e.g. Premier Daily Content – March 2026"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>E-Send Type *</label>
                            <select
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                {EMAIL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Copy / Body Text *</label>
                        <textarea
                            required
                            rows={5}
                            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', resize: 'vertical' }}
                            placeholder="Paste the full e-send copy here..."
                            value={form.copy}
                            onChange={e => setForm({ ...form, copy: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Live URL / Link</label>
                        <input
                            type="url"
                            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                            placeholder="https://..."
                            value={form.link}
                            onChange={e => setForm({ ...form, link: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? 'Saving…' : '✓ Save to Archive'}
                        </button>
                    </div>
                </form>
            )}

            {/* Type Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {EMAIL_TYPES.map(t => (
                    <div key={t.id} style={{
                        padding: '0.5rem 1rem', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem', color: 'var(--text-muted)'
                    }}>
                        <strong style={{ color: 'var(--text-main)' }}>{t.label}</strong>
                        <div style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>{t.desc}</div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="🔍 Search title, copy, or keywords…"
                    style={{ flex: '1 1 280px', padding: '0.7rem 1rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-main)' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <select
                    style={{ flex: '0 1 200px', padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-main)' }}
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="ALL">All Types</option>
                    {EMAIL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Showing <strong style={{ color: 'var(--text-main)' }}>{filtered.length}</strong> of {archives.length} entries
            </div>

            {/* Archive List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.length === 0 && (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                        No e-sends found. Add one above to get started.
                    </div>
                )}
                {filtered.map(entry => (
                    <div key={entry.id} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <div
                            style={{ padding: '1.2rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                            onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px',
                                        background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', whiteSpace: 'nowrap'
                                    }}>
                                        {typeInfo(entry.type)?.label || entry.type}
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{entry.title}</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {entry.link && <> · <a href={entry.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--primary)' }}>View Live ↗</a></>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(entry.id, entry.title); }}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    Delete
                                </button>
                                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{expanded === entry.id ? '▲' : '▼'}</span>
                            </div>
                        </div>
                        {expanded === entry.id && (
                            <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                    {entry.copy}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
