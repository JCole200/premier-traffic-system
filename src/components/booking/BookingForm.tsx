'use client';

import { useState } from 'react';
import { BookingRequest, GeoRegion } from '../../types/inventory';
import { useRouter } from 'next/navigation';
import AvailabilityCalendar from './AvailabilityCalendar';
import { createBooking } from '../../lib/actions/booking';

type BookingType = 'AUDIO' | 'DISPLAY' | 'BESPOKE_ESEND' | 'ADS_IN_ESEND';

interface ExtraDetails {
    targeting?: string[]; // Audio targeting
    displayType?: string; // MPU, Leaderboard, etc.
    displayWebsites?: string[]; // WA, CTY...
    emailLists?: string[]; // SALES A, etc.
    emailNote?: string;
    adsEmailType?: string; // Voice of Hope, etc.
}

export default function BookingForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [clientName, setClientName] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [bookerName, setBookerName] = useState('');
    const [bookingType, setBookingType] = useState<BookingType | ''>('');

    // Shared / Specific State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [impressions, setImpressions] = useState<number>(0); // For Audio or Display

    // Specifics
    const [audioTargeting, setAudioTargeting] = useState<string[]>([]);
    const [displayType, setDisplayType] = useState('MPU');
    const [displayWebsites, setDisplayWebsites] = useState<string[]>([]);
    const [emailLists, setEmailLists] = useState<string[]>([]);
    const [emailCount, setEmailCount] = useState<number>(1);
    const [emailComments, setEmailComments] = useState('');
    const [emailNote, setEmailNote] = useState('');
    const [adsEmailType, setAdsEmailType] = useState('Voice of Hope');

    // Calendar State
    const [selectedDates, setSelectedDates] = useState<string[]>([]);


    // Handlers
    const toggleArraySelection = (item: string, currentList: string[], setter: (l: string[]) => void) => {
        if (currentList.includes(item)) {
            setter(currentList.filter(i => i !== item));
        } else {
            setter([...currentList, item]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Construct Additional Details
            const additionalDetails: ExtraDetails = {
                targeting: bookingType === 'AUDIO' ? audioTargeting : undefined,
                displayType: bookingType === 'DISPLAY' ? displayType : undefined,
                displayWebsites: bookingType === 'DISPLAY' ? displayWebsites : undefined,
                emailLists: bookingType === 'BESPOKE_ESEND' ? emailLists : undefined,
                emailNote: bookingType === 'BESPOKE_ESEND' ? `<Comments> ${emailComments} </Comments> <Note> ${emailNote} </Note>` : undefined,
                adsEmailType: bookingType === 'ADS_IN_ESEND' ? adsEmailType : undefined,
            };

            // Map to BookingRequest
            const bookingData: Omit<BookingRequest, 'id' | 'status'> = {
                clientName,
                campaignName: bookingType + ' Campaign', // Defaulting as user didn't ask for it specifically in the new form
                startDate: startDate || new Date().toISOString(),
                endDate: endDate || new Date().toISOString(),
                contractNumber,
                bookerName,
                bookingType,
                geoTarget: 'GLOBAL' as GeoRegion, // Default
                additionalDetails,

                // Map specific metrics
                audioSpots: bookingType === 'AUDIO' ? impressions : 0,
                displayImpressions: bookingType === 'DISPLAY' ? impressions : 0,
                emailDates: (bookingType === 'BESPOKE_ESEND' || bookingType === 'ADS_IN_ESEND') ? selectedDates : [],
            };

            await createBooking(bookingData);

            alert(`Booking Confirmed for ${clientName}!`);
            router.push('/');
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Styling Helpers
    const sectionStyle = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '1.5rem',
        animation: 'fadeIn 0.5s ease-out'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.6rem',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: 500
    };

    const inputStyle = {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.2)',
        color: 'var(--foreground)',
        fontSize: '1rem'
    };

    const checkboxGroupStyle = {
        display: 'flex',
        flexWrap: 'wrap' as 'wrap',
        gap: '1rem',
        marginTop: '0.5rem'
    };

    const checkboxLabelStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.05)',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '0.9rem',
        border: '1px solid transparent',
        transition: 'all 0.2s'
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                New Booking Request
            </h2>

            {/* GENERAL QUESTIONS */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                    <label style={labelStyle}>Client / Brand Name *</label>
                    <input
                        required
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. Nike, Premier Digital..."
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Contract Number</label>
                        <input
                            type="text"
                            style={inputStyle}
                            placeholder="Optional"
                            value={contractNumber}
                            onChange={e => setContractNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Your Name *</label>
                        <input
                            required
                            type="text"
                            style={inputStyle}
                            value={bookerName}
                            onChange={e => setBookerName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>What would you like to book? *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            { id: 'AUDIO', label: 'Audio Ad' },
                            { id: 'DISPLAY', label: 'Display Ads' },
                            { id: 'BESPOKE_ESEND', label: 'Bespoke E-sends' },
                            { id: 'ADS_IN_ESEND', label: 'Ads in E-sends' },
                        ].map(type => (
                            <div
                                key={type.id}
                                onClick={() => setBookingType(type.id as BookingType)}
                                style={{
                                    ...inputStyle,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    background: bookingType === type.id ? 'var(--primary-glow)' : 'rgba(0,0,0,0.3)',
                                    borderColor: bookingType === type.id ? 'var(--primary)' : 'var(--border-subtle)',
                                    fontWeight: bookingType === type.id ? 600 : 400
                                }}
                            >
                                {type.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AUDIO ADS SECTION */}
            {bookingType === 'AUDIO' && (
                <div style={sectionStyle}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)' }}>Audio Ads</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Start Date</label>
                            <input type="date" required style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>End Date</label>
                            <input type="date" required style={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Targeting Preference</label>
                        <div style={checkboxGroupStyle}>
                            {['Location Based', 'Radio Stations', 'Podcasts', 'Run of Network'].map(opt => (
                                <label key={opt} style={{
                                    ...checkboxLabelStyle,
                                    background: audioTargeting.includes(opt) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                    borderColor: audioTargeting.includes(opt) ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={audioTargeting.includes(opt)}
                                        onChange={() => toggleArraySelection(opt, audioTargeting, setAudioTargeting)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Number of Impressions/Spots</label>
                        <input
                            type="number"
                            required
                            min="1000"
                            step="1000"
                            style={inputStyle}
                            value={impressions || ''}
                            onChange={e => setImpressions(parseInt(e.target.value))}
                        />
                    </div>
                </div>
            )}

            {/* DISPLAY ADS SECTION */}
            {bookingType === 'DISPLAY' && (
                <div style={sectionStyle}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)' }}>Display Ads</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Number of Impressions</label>
                        <input
                            type="number"
                            required
                            min="1000"
                            step="1000"
                            style={inputStyle}
                            value={impressions || ''}
                            onChange={e => setImpressions(parseInt(e.target.value))}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Type of Display Ads</label>
                        <select
                            style={inputStyle}
                            value={displayType}
                            onChange={e => setDisplayType(e.target.value)}
                        >
                            <option value="MPU">MPU</option>
                            <option value="LEADERBOARD">Leaderboard</option>
                            <option value="WALLPAPER">Wallpaper / Takeover</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Websites</label>
                        <div style={checkboxGroupStyle}>
                            {['WA', 'CTY', 'UNB', 'NEXGEN'].map(site => (
                                <label key={site} style={{
                                    ...checkboxLabelStyle,
                                    background: displayWebsites.includes(site) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                    borderColor: displayWebsites.includes(site) ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={displayWebsites.includes(site)}
                                        onChange={() => toggleArraySelection(site, displayWebsites, setDisplayWebsites)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {site}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Start Date</label>
                            <input type="date" required style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>End Date</label>
                            <input type="date" required style={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* BESPOKE E-SENDS SECTION */}
            {bookingType === 'BESPOKE_ESEND' && (
                <div style={sectionStyle}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)' }}>Bespoke E-sends</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Target Email List(s) *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {[
                                'SALES A+B', 'SALES A', 'SALES B', 'SALES CTY',
                                'SALES NEXGEN', 'SALES LEADERS', 'FUNDRAISING',
                                'MARKETING', 'SALES WAlive', 'SALES PG', 'Other'
                            ].map(list => (
                                <label key={list} style={{
                                    ...checkboxLabelStyle,
                                    width: '100%',
                                    background: emailLists.includes(list) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                    borderColor: emailLists.includes(list) ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={emailLists.includes(list)}
                                        onChange={() => toggleArraySelection(list, emailLists, setEmailLists)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {list}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Quantity of E-sends</label>
                        <input
                            type="number"
                            min="1"
                            style={inputStyle}
                            value={emailCount}
                            onChange={e => setEmailCount(parseInt(e.target.value))}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Select Dates</label>
                        <AvailabilityCalendar
                            type="EMAIL"
                            selectedDates={selectedDates}
                            onDateSelect={setSelectedDates}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Selected: {selectedDates.length} dates</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Comments</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '80px' }}
                            placeholder="Any specific requirements..."
                            value={emailComments}
                            onChange={e => setEmailComments(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Is there anything else we should know?</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '80px' }}
                            value={emailNote}
                            onChange={e => setEmailNote(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* ADS IN E-SENDS SECTION */}
            {bookingType === 'ADS_IN_ESEND' && (
                <div style={sectionStyle}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)' }}>Ads in E-sends</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Target Email Publication *</label>
                        <div style={checkboxGroupStyle}>
                            {['Voice of Hope', 'Be Still and Know', 'Daily News', 'It doesn\'t matter', 'Other'].map(pub => (
                                <label key={pub} style={{
                                    ...checkboxLabelStyle,
                                    background: adsEmailType === pub ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                                    borderColor: adsEmailType === pub ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="radio"
                                        name="adsEmailPub"
                                        checked={adsEmailType === pub}
                                        onChange={() => setAdsEmailType(pub)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {pub}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Quantity of Ads</label>
                        <input
                            type="number"
                            min="1"
                            style={inputStyle}
                            value={emailCount}
                            onChange={e => setEmailCount(parseInt(e.target.value))}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Select Available Dates</label>
                        <AvailabilityCalendar
                            type="EMAIL"
                            selectedDates={selectedDates}
                            onDateSelect={setSelectedDates}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Selected: {selectedDates.length} dates</p>
                    </div>
                </div>
            )}

            {/* SUBMIT */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                    type="button"
                    style={{
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                    onClick={() => router.back()}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !bookingType}
                    className="btn-primary" // Assuming global class for gradient button
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
            </div>
        </form>
    );
}
