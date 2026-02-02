'use client';

import { useState } from 'react';
import { updateBooking, deleteBooking } from '../../lib/actions/booking';

interface Props {
    booking: any;
    onClose: () => void;
}

export default function EditBookingModal({ booking, onClose }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(booking.status || 'CONFIRMED');

    // Minimal editing for now: Status and Deletion. 
    // Full editing would duplicate the BookingForm logic which is complex.
    // We can add Date editing later if requested.

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this booking?')) return;
        setIsSaving(true);
        try {
            await deleteBooking(booking.id);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to delete');
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await updateBooking(booking.id, { status: status as any });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update');
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Edit Booking</h3>

                <div style={{ marginBottom: '1rem' }}>
                    <strong>Client:</strong> {booking.clientName}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Campaign:</strong> {booking.campaignName}
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <strong>Type:</strong> {booking.bookingType || 'N/A'}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Status</label>
                    <select
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-subtle)' }}
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                    >
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="DRAFT">Draft / Holding</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleDelete}
                        disabled={isSaving}
                        style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Delete
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
