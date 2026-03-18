'use client';

import { format } from 'date-fns';
import Link from 'next/link';

interface AuditLog {
    id: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    changedBy: string | null;
    createdAt: Date | string;
}

interface Props {
    booking: any;
    logs: AuditLog[];
}

export default function AuditHistoryView({ booking, logs }: Props) {
    
    const downloadCSV = () => {
        const headers = ['Action', 'Field', 'Old Value', 'New Value', 'Changed By', 'Timestamp'];
        const rows = logs.map(log => [
            log.action,
            log.field || 'N/A',
            log.oldValue || '',
            log.newValue || '',
            log.changedBy || 'Unknown',
            format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_trail_${booking.clientName?.replace(/\s+/g, '_')}_${booking.id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <Link href="/campaigns" style={{ color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        ← Back to Campaigns
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Audit Trail: {booking.clientName}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{booking.campaignName} | ID: {booking.id}</p>
                </div>
                <button 
                    onClick={downloadCSV}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    📥 Download CSV
                </button>
            </div>

            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <tr>
                            <th style={{ padding: '1.2rem' }}>Timestamp</th>
                            <th style={{ padding: '1.2rem' }}>Action</th>
                            <th style={{ padding: '1.2rem' }}>User</th>
                            <th style={{ padding: '1.2rem' }}>Changes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top' }}>
                                <td style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <span style={{ 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 600,
                                        background: log.action === 'CREATE' ? 'rgba(16, 185, 129, 0.1)' : log.action === 'UPDATE' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: log.action === 'CREATE' ? 'var(--success)' : log.action === 'UPDATE' ? 'var(--primary)' : 'var(--danger)'
                                    }}>
                                        {log.action}
                                    </span>
                                    {log.field && <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>{log.field}</div>}
                                </td>
                                <td style={{ padding: '1.2rem', fontWeight: 500 }}>
                                    {log.changedBy}
                                </td>
                                <td style={{ padding: '1.2rem', fontSize: '0.85rem' }}>
                                    {log.action === 'UPDATE' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ opacity: 0.6, textDecoration: 'line-through' }}>
                                                {log.oldValue || '(Empty)'}
                                            </div>
                                            <div style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                                {log.newValue}
                                            </div>
                                        </div>
                                    )}
                                    {log.action === 'CREATE' && (
                                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            Campaign created in system
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
