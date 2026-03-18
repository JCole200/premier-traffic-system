import Sidebar from '../../../../components/layout/Sidebar';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import prisma from '../../../../lib/prisma';
import CsvDownloadButton from '../../../../components/campaigns/CsvDownloadButton';

export const dynamic = 'force-dynamic';

export default async function CampaignAuditPage({ params }: { params: { id: string } }) {
    // Fetch directly in the page to avoid server action serialization issues
    const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        include: { audioTarget: true }
    });

    if (!booking) notFound();

    const logsRaw = await (prisma as any).auditLog.findMany({
        where: { bookingId: params.id },
        orderBy: { createdAt: 'desc' }
    });

    // Serialize logs for the CSV client component
    const logsForCsv = logsRaw.map((log: any) => ({
        id: log.id,
        action: log.action,
        field: log.field,
        oldValue: log.oldValue,
        newValue: log.newValue,
        changedBy: log.changedBy,
        createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt)
    }));

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <Link href="/campaigns" style={{ color: 'var(--primary)', fontSize: '0.9rem', display: 'inline-block', marginBottom: '0.5rem' }}>
                            ← Back to Campaigns
                        </Link>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Audit Trail</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {booking.clientName} — {booking.campaignName}
                        </p>
                    </div>
                    <CsvDownloadButton logs={logsForCsv} clientName={booking.clientName} bookingId={booking.id} />
                </div>

                {/* Summary card */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Client</div>
                        <div style={{ fontWeight: 600 }}>{booking.clientName}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Campaign</div>
                        <div style={{ fontWeight: 600 }}>{booking.campaignName}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contract</div>
                        <div style={{ fontWeight: 600 }}>{booking.contractNumber || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Events</div>
                        <div style={{ fontWeight: 600 }}>{logsRaw.length}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Created</div>
                        <div style={{ fontWeight: 600 }}>{format(booking.createdAt, 'MMM d, yyyy')}</div>
                    </div>
                </div>

                {/* Logs table */}
                {logsRaw.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No audit events recorded for this campaign yet.
                    </div>
                ) : (
                    <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <tr>
                                    <th style={{ padding: '1.2rem' }}>Timestamp</th>
                                    <th style={{ padding: '1.2rem' }}>Action</th>
                                    <th style={{ padding: '1.2rem' }}>Field</th>
                                    <th style={{ padding: '1.2rem' }}>Changed By</th>
                                    <th style={{ padding: '1.2rem' }}>Changes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logsRaw.map((log: any) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top' }}>
                                        <td style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                            {format(log.createdAt, 'MMM d yyyy, HH:mm:ss')}
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                background: log.action === 'CREATE' ? 'rgba(16, 185, 129, 0.15)' : log.action === 'UPDATE' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: log.action === 'CREATE' ? 'var(--success)' : log.action === 'UPDATE' ? 'var(--primary)' : 'var(--danger)'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {log.field || '—'}
                                        </td>
                                        <td style={{ padding: '1.2rem', fontWeight: 500, fontSize: '0.85rem' }}>
                                            {log.changedBy || 'System'}
                                        </td>
                                        <td style={{ padding: '1.2rem', fontSize: '0.8rem' }}>
                                            {log.action === 'UPDATE' && log.oldValue && (
                                                <div>
                                                    <div style={{ opacity: 0.5, textDecoration: 'line-through', marginBottom: '0.25rem' }}>
                                                        {String(log.oldValue).substring(0, 60)}{log.oldValue.length > 60 ? '…' : ''}
                                                    </div>
                                                    <div style={{ color: 'var(--primary)' }}>
                                                        {String(log.newValue || '').substring(0, 60)}{(log.newValue || '').length > 60 ? '…' : ''}
                                                    </div>
                                                </div>
                                            )}
                                            {log.action === 'CREATE' && (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Campaign created</span>
                                            )}
                                            {log.action === 'DELETE' && (
                                                <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>Campaign deleted</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
