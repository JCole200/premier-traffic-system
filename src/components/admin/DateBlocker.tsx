'use client';

import { useState } from 'react';
import AvailabilityCalendar from '../booking/AvailabilityCalendar';
import { blockDates } from '../../lib/actions/admin';

export default function DateBlocker() {
    const [type, setType] = useState('BESPOKE_ESEND');
    const [adsEmailType, setAdsEmailType] = useState('Daily Content');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDates.length === 0) {
            alert('Please select at least one date.');
            return;
        }
        setIsSubmitting(true);
        try {
            await blockDates(selectedDates, type, reason, undefined, type === 'ADS_IN_ESEND' ? adsEmailType : undefined);
            alert('Dates blocked successfully.');
            setSelectedDates([]);
            setReason('');
        } catch (error) {
            console.error(error);
            alert('Failed to block dates.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Block Out Calendars</h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Prevent any bookings on specific dates across selected channels.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>1. Select Calendar</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.95rem'
                            }}
                        >
                            <option value="BESPOKE_ESEND">Bespoke E-sends</option>
                            <option value="ADS_IN_ESEND">Ads in E-sends</option>
                        </select>
                    </div>

                    {type === 'ADS_IN_ESEND' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>2. Target Publication</label>
                            <select
                                value={adsEmailType}
                                onChange={e => setAdsEmailType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'var(--foreground)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <option>Daily Content</option>
                                <option>Daily News</option>
                                <option>Be Still & Know</option>
                                <option>CTY (Sat)</option>
                                <option>WA (Sat)</option>
                                <option>PG (Fri)</option>
                                <option>Woman Alive</option>
                                <option>A Mucky Business</option>
                                <option>The Profile</option>
                                <option>Daily Content (Affiliate)</option>
                                <option>Daily News (Affiliate)</option>
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>3. Choose Dates on Calendar</label>
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <AvailabilityCalendar
                            type={type}
                            targetId={
                                type === 'ADS_IN_ESEND' ? (
                                    adsEmailType === 'Daily Content' ? 'email-daily-content' :
                                        adsEmailType === 'Daily News' ? 'email-daily-news' :
                                            adsEmailType === 'Be Still & Know' ? 'email-bsak' :
                                                adsEmailType === 'CTY (Sat)' ? 'email-cty' :
                                                    adsEmailType === 'WA (Sat)' ? 'email-wa' :
                                                        adsEmailType === 'PG (Fri)' ? 'email-pg' :
                                                            adsEmailType === 'Daily Content (Affiliate)' ? 'email-affiliate-content' :
                                                                adsEmailType === 'Daily News (Affiliate)' ? 'email-affiliate-news' :
                                                                    adsEmailType === 'Woman Alive' ? 'email-wa' :
                                                                        adsEmailType === 'A Mucky Business' ? 'email-mucky-business' :
                                                                            adsEmailType === 'The Profile' ? 'email-the-profile' :
                                                                                undefined
                                ) : undefined
                            }
                            selectedDates={selectedDates}
                            onDateSelect={setSelectedDates}
                            allowFullSelection={true}
                        />
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedDates.length > 0 ? 'var(--primary)' : 'var(--text-dim)' }}></div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>{selectedDates.length} dates selected for blocking</p>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>4. Reason for Blocking</label>
                    <input
                        type="text"
                        placeholder="e.g. Easter Holiday, System Maintenance..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedDates.length === 0}
                        className="btn-primary"
                        style={{
                            background: 'var(--danger)',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            fontWeight: 600,
                            opacity: isSubmitting || selectedDates.length === 0 ? 0.6 : 1,
                            transition: 'all 0.2s',
                            boxShadow: selectedDates.length > 0 ? '0 4px 15px rgba(239, 68, 68, 0.3)' : 'none'
                        }}
                    >
                        {isSubmitting ? 'Processing Block...' : 'Block Selected Dates'}
                    </button>
                </div>
            </form>
        </div>
    );
}
