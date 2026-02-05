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
        <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Block Out Dates</h3>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Calendar Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)' }}
                        >
                            <option value="BESPOKE_ESEND">Bespoke E-sends</option>
                            <option value="ADS_IN_ESEND">Ads in E-sends</option>
                        </select>
                    </div>

                    {type === 'ADS_IN_ESEND' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Target Publication</label>
                            <select
                                value={adsEmailType}
                                onChange={e => setAdsEmailType(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)' }}
                            >
                                <option>Daily Content</option>
                                <option>Daily News</option>
                                <option>Be Still & Know</option>
                                <option>CTY (Sat)</option>
                                <option>WA (Sat)</option>
                                <option>PG (Fri)</option>
                                <option>Daily Content (Affiliate)</option>
                                <option>Daily News (Affiliate)</option>
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Select Dates to Block</label>
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
                                                                undefined
                            ) : undefined
                        }
                        selectedDates={selectedDates}
                        onDateSelect={setSelectedDates}
                    />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{selectedDates.length} dates selected</p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reason / Note</label>
                    <input
                        type="text"
                        placeholder="e.g. Easter Holiday, System Maintenance..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)' }}
                    />
                </div>

                <div style={{ display: 'flex', justifySelf: 'end' }}>
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedDates.length === 0}
                        className="btn-primary"
                        style={{ background: 'var(--danger)', opacity: isSubmitting ? 0.7 : 1 }}
                    >
                        {isSubmitting ? 'Blocking...' : 'Block Dates'}
                    </button>
                </div>
            </form>
        </div>
    );
}
