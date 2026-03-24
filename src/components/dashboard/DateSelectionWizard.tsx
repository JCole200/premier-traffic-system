'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    pathname: string;
    type?: 'AUDIO' | 'DISPLAY';
}

const STEPS = [
    { num: 1, label: 'Campaign Start Date' },
    { num: 2, label: 'Campaign End Date' },
    { num: 3, label: 'Check Availability' },
];

export default function DateSelectionWizard({ pathname, type }: Props) {
    const router = useRouter();

    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [step, setStep] = useState(1);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(defaultEnd);

    const durationDays = startDate && endDate
        ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
        : null;

    const handleNext = () => {
        if (step === 1) {
            if (!startDate) return;
            // Auto-update end date if it's before start date
            if (endDate && endDate < startDate) {
                setEndDate(new Date(new Date(startDate).getTime() + 30 * 86400000).toISOString().split('T')[0]);
            }
            setStep(2);
        } else if (step === 2) {
            if (!endDate || endDate < startDate) {
                alert('End date must be on or after the start date.');
                return;
            }
            setStep(3);
        }
    };

    const handleSubmit = () => {
        const url = `${pathname}?date=${startDate}&endDate=${endDate}`;
        router.push(url);
    };

    const accentColor = type === 'DISPLAY' ? 'var(--accent-cyan, #06b6d4)' : 'var(--primary)';

    return (
        <div style={{ width: '100%' }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '2rem' }}>
                {STEPS.map((s, i) => (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.3s',
                                background: step > s.num ? accentColor : step === s.num ? accentColor : 'rgba(255,255,255,0.08)',
                                color: step >= s.num ? 'white' : 'var(--text-muted)',
                                boxShadow: step === s.num ? `0 0 16px ${accentColor}44` : 'none',
                            }}>
                                {step > s.num ? '✓' : s.num}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: step === s.num ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: '70px', textAlign: 'center', lineHeight: 1.2 }}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div style={{ width: '40px', height: '2px', margin: '0 4px 18px', background: step > s.num ? accentColor : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1 — Start Date */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            When does this campaign start? *
                        </label>
                        <input
                            name="startDate"
                            type="date"
                            required
                            min={today}
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{
                                width: '100%', padding: '1.2rem', borderRadius: '12px',
                                background: 'var(--bg-panel)', border: `2px solid ${accentColor}`,
                                color: 'var(--text-main)', fontSize: '1.2rem', textAlign: 'center',
                                outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        />
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                            This date will be used to calculate real-time inventory availability.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', fontWeight: 600, background: accentColor }}
                    >
                        Set Start Date → 
                    </button>
                </div>
            )}

            {/* Step 2 — End Date */}
            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📅 Start Date</span>
                        <strong style={{ color: 'var(--text-main)' }}>{new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            When does this campaign end? *
                        </label>
                        <input
                            name="endDate"
                            type="date"
                            required
                            min={startDate}
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{
                                width: '100%', padding: '1.2rem', borderRadius: '12px',
                                background: 'var(--bg-panel)', border: `2px solid ${accentColor}`,
                                color: 'var(--text-main)', fontSize: '1.2rem', textAlign: 'center',
                                outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        />
                        {durationDays !== null && durationDays > 0 && (
                            <div style={{ fontSize: '0.78rem', color: accentColor, marginTop: '0.5rem', textAlign: 'center', fontWeight: 500 }}>
                                Campaign duration: {durationDays} day{durationDays !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '1rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                            ← Back
                        </button>
                        <button type="button" onClick={handleNext} className="btn-primary" style={{ flex: 2, padding: '1rem', fontSize: '1rem', fontWeight: 600, background: accentColor }}>
                            Set End Date →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3 — Confirm & Proceed */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>📅 Start Date</span>
                            <strong>{new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>📅 End Date</span>
                            <strong>{new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>⏱ Duration</span>
                            <strong style={{ color: accentColor }}>{durationDays} day{durationDays !== 1 ? 's' : ''}</strong>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        We'll show real-time inventory availability for this date window.
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '1rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                            ← Back
                        </button>
                        <button type="button" onClick={handleSubmit} className="btn-primary" style={{ flex: 2, padding: '1rem', fontSize: '1rem', fontWeight: 600, background: accentColor, boxShadow: `0 4px 20px ${accentColor}44` }}>
                            Check Availability →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
