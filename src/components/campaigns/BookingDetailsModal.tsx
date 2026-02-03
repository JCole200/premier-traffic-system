'use client';

import { useState } from 'react';
import { updateBooking, deleteBooking } from '../../lib/actions/booking';
import { useRouter } from 'next/navigation';

interface BookingDetailsModalProps {
    booking: any;
    onClose: () => void;
}

export default function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...booking });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateBooking(booking.id, formData);
            router.refresh(); // Refresh page data
            setIsEditing(false);
        } catch (error) {
            alert('Failed to update booking');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this booking? This cannot be undone.')) {
            try {
                await deleteBooking(booking.id);
                router.refresh();
                onClose();
            } catch (error) {
                alert('Failed to delete booking');
            }
        }
    };

    // Parse details if string
    const details = typeof booking.additionalDetails === 'string'
        ? JSON.parse(booking.additionalDetails)
        : booking.additionalDetails || {};

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
                padding: '2rem', position: 'relative', color: 'var(--text-main)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>{isEditing ? 'Edit Booking' : 'Booking Details'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem' }}>×</button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* READ ONLY VIEW */}
                    {!isEditing && (
                        <>
                            <div className="detail-row">
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Client</label>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{booking.clientName}</div>
                            </div>
                            <div className="detail-row">
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Campaign</label>
                                <div>{booking.campaignName}</div>
                            </div>
                            <div className="detail-row">
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dates</label>
                                <div>{booking.startDate} to {booking.endDate}</div>
                            </div>
                            <div className="detail-row">
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Type</label>
                                <div>{booking.bookingType || 'Standard'}</div>
                            </div>
                            <div className="detail-row">
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Booker</label>
                                <div>{booking.bookerName || 'N/A'}</div>
                            </div>
                            {booking.contractNumber && (
                                <div className="detail-row">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Contract</label>
                                    <div>{booking.contractNumber}</div>
                                </div>
                            )}

                            {/* Dynamic Metrics */}
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                {(booking.audioSpots > 0) && <div>🔈 {booking.audioSpots.toLocaleString()} Spots</div>}
                                {(booking.displayImpressions > 0) && <div>💻 {booking.displayImpressions.toLocaleString()} Impressions</div>}
                                {booking.emailDates && <div>📧 {Array.isArray(booking.emailDates) ? booking.emailDates.length : 0} Sends</div>}
                            </div>

                            {/* Additional Details */}
                            {details && Object.keys(details).length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Specifications</h4>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                        {details.targeting && <div>🎯 Targeting: {details.targeting.join(', ')}</div>}
                                        {details.displayType && <div>🖼 Format: {details.displayType}</div>}
                                        {details.emailLists && <div>📬 Lists: {details.emailLists.join(', ')}</div>}
                                        {details.emailNote && <div>📝 Note: {details.emailNote.replace(/<[^>]*>?/gm, '')}</div>}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Edit Booking
                                </button>
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        flex: 1, padding: '0.8rem', borderRadius: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.2)'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}

                    {/* EDIT MODE */}
                    {isEditing && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Client Name</label>
                                <input
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-main)' }}
                                    value={formData.clientName}
                                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Campaign Name</label>
                                <input
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-main)' }}
                                    value={formData.campaignName}
                                    onChange={e => setFormData({ ...formData, campaignName: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Start Date</label>
                                    <input type="date"
                                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-main)' }}
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>End Date</label>
                                    <input type="date"
                                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-main)' }}
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Simple Metrics Edit */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Units (Spots/Impressions)</label>
                                <input type="number"
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-main)' }}
                                    value={formData.audioSpots || formData.displayImpressions || 0}
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        if (booking.bookingType === 'AUDIO') setFormData({ ...formData, audioSpots: val });
                                        else if (booking.bookingType === 'DISPLAY') setFormData({ ...formData, displayImpressions: val });
                                    }}
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: '8px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary"
                                    disabled={isSaving}
                                    style={{ flex: 1 }}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
