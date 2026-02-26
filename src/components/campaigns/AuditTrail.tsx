'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../lib/actions/booking';
import { format } from 'date-fns';

interface AuditTrailProps {
    bookingId: string;
}

export default function AuditTrail({ bookingId }: AuditTrailProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const data = await getAuditLogs(bookingId);
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLogs();
    }, [bookingId]);

    if (isLoading) {
        return <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading audit history...</div>;
    }

    if (logs.length === 0) {
        return <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No history found for this campaign.</div>;
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                Audit Trail & History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {logs.map((log) => (
                    <div key={log.id} style={{
                        fontSize: '0.75rem',
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        borderLeft: `2px solid ${log.action === 'CREATE' ? 'var(--success)' : log.action === 'UPDATE' ? 'var(--primary)' : 'var(--danger)'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {log.action} {log.field ? `- ${log.field}` : ''}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                                {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                            </span>
                        </div>
                        {log.action === 'UPDATE' && (
                            <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{log.oldValue?.substring(0, 30)}...</span>
                                <span>→</span>
                                <span style={{ color: 'var(--primary)' }}>{log.newValue?.substring(0, 30)}...</span>
                            </div>
                        )}
                        <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', opacity: 0.8 }}>
                            By: {log.changedBy}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
