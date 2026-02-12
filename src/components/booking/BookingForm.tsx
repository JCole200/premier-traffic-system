'use client';

import { useState, useEffect } from 'react';
import { BookingRequest, GeoRegion } from '../../types/inventory';
import { useRouter } from 'next/navigation';
import AvailabilityCalendar from './AvailabilityCalendar';
import BespokeCalendar from './BespokeCalendar';
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


interface BookingFormProps {
    isAdmin?: boolean;
    existingBookings?: any[];
}

export default function BookingForm({ isAdmin = false, existingBookings = [] }: BookingFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
    const [showNewForm, setShowNewForm] = useState(!isAdmin);

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
    const [department, setDepartment] = useState('SALES');
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

    // Load booking data for editing
    const loadBookingForEdit = (booking: any) => {
        setEditingBookingId(booking.id);
        setShowNewForm(true);
        setClientName(booking.clientName || '');
        setContractNumber(booking.contractNumber || '');
        setBookerName(booking.bookerName || '');
        setBookingType(booking.bookingType || '');
        setStartDate(booking.startDate || '');
        setEndDate(booking.endDate || '');
        setDepartment(booking.department || 'SALES');

        // Parse additional details
        const details = booking.additionalDetails;
        if (details) {
            setAudioTargeting(details.targeting || []);
            setDisplayType(details.displayType || 'MPU');
            setDisplayWebsites(details.displayWebsites || []);
            setEmailLists(details.emailLists || []);
            setEmailNote(details.emailNote || '');
            setAdsEmailType(details.adsEmailType || 'Voice of Hope');
        }

        setSelectedDates(booking.emailDates || []);
        setImpressions(booking.audioSpots || booking.displayImpressions || 0);
    };

    const resetForm = () => {
        setEditingBookingId(null);
        setClientName('');
        setContractNumber('');
        setBookerName('');
        setBookingType('');
        setStartDate('');
        setEndDate('');
        setDepartment('SALES');
        setAudioTargeting([]);
        setDisplayType('MPU');
        setDisplayWebsites([]);
        setEmailLists([]);
        setEmailCount(1);
        setEmailComments('');
        setEmailNote('');
        setAdsEmailType('Voice of Hope');
        setSelectedDates([]);
        setImpressions(0);
    };

    const handleDelete = async (bookingId: string) => {
        if (!confirm('Are you sure you want to delete this booking?')) return;

        try {
            const { deleteBooking } = await import('../../lib/actions/booking');
            await deleteBooking(bookingId);
            alert('Booking deleted successfully!');
            router.refresh();
        } catch (error) {
            alert('Failed to delete booking: ' + (error as Error).message);
        }
    };


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
                campaignName: bookingType + ' Campaign',
                startDate: startDate || new Date().toISOString(),
                endDate: endDate || new Date().toISOString(),
                contractNumber,
                bookerName,
                bookingType,
                department, // Add Department
                geoTarget: 'GLOBAL' as GeoRegion,
                additionalDetails,

                // Map specific metrics
                audioSpots: bookingType === 'AUDIO' ? impressions : 0,
                displayImpressions: bookingType === 'DISPLAY' ? impressions : 0,
                emailDates: (bookingType === 'BESPOKE_ESEND' || bookingType === 'ADS_IN_ESEND') ? selectedDates : [],
            };

            if (editingBookingId) {
                // Update existing booking
                const { updateBooking } = await import('../../lib/actions/booking');
                await updateBooking(editingBookingId, bookingData as any);
                alert(`Booking updated successfully for ${clientName}!`);
                resetForm();
                setShowNewForm(false);
                router.refresh();
            } else {
                // Create new booking
                await createBooking(bookingData);
                alert(`Booking Confirmed for ${clientName}!`);
                router.push('/');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong: ' + (err as Error).message);
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

    // Load form configuration
    const [formConfig, setFormConfig] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bookingFormConfig');
            if (saved) {
                try {
                    setFormConfig(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse form config', e);
                }
            }
        }
    }, []);

    // Default booking types if no config
    const defaultBookingTypes = [
        { id: 'AUDIO', label: 'Audio Ad' },
        { id: 'DISPLAY', label: 'Display Ads' },
        { id: 'BESPOKE_ESEND', label: 'Bespoke E-sends' },
        { id: 'ADS_IN_ESEND', label: 'Ads in E-sends' },
    ];

    const bookingTypesToRender = formConfig && formConfig.bookingTypes ? formConfig.bookingTypes : defaultBookingTypes;
    const bookingQuestion = formConfig && formConfig.bookingTypeQuestion ? formConfig.bookingTypeQuestion : 'What would you like to book? *';

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'var(--text-main)' }}>
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
                    <label style={labelStyle}>{bookingQuestion}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {bookingTypesToRender.map((type: any) => (
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
                        <label style={labelStyle}>Booking Department *</label>
                        <select
                            style={inputStyle}
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                        >
                            <option value="SALES">Sales</option>
                            <option value="MARKETING">Marketing</option>
                            <option value="FUNDRAISING">Fundraising</option>
                            <option value="INTERNAL">Internal / Premier</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Which e-mail marketing list(s) would you like to send the e-send to: *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {[
                                'SALES A+B',
                                'SALES A',
                                'SALES B',
                                'SALES CTY',
                                'SALES NEXGEN',
                                'SALES LEADERS',
                                'FUNDRAISING',
                                'MARKETING',
                                'SALES WAlive',
                                'SALES PG',
                                'Other (describe)'
                            ].map(list => (
                                <label key={list} style={{
                                    ...checkboxLabelStyle,
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap',
                                    paddingLeft: '1rem',
                                    background: emailLists.includes(list) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                    borderColor: emailLists.includes(list) ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={emailLists.includes(list)}
                                        onChange={() => toggleArraySelection(list, emailLists, setEmailLists)}
                                        style={{ accentColor: 'var(--primary)', width: 'auto' }}
                                    />
                                    {list}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>How many bespoke esends would you like to book for this campaign?</label>
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
                        <BespokeCalendar
                            selectedDates={selectedDates}
                            onDateSelect={setSelectedDates}
                            selectedLists={emailLists}
                            department={department}
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
                        <label style={labelStyle}>Is there anything else we should know about this email?</label>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {[
                                { label: 'Daily Content', id: 'email-daily-content' },
                                { label: 'Daily News', id: 'email-daily-news' },
                                { label: 'Be Still & Know', id: 'email-bsak' },
                                { label: 'CTY (Sat)', id: 'email-cty' },
                                { label: 'WA (Sat)', id: 'email-wa' },
                                { label: 'PG (Fri)', id: 'email-pg' },
                                { label: 'Daily Content (Affiliate)', id: 'email-affiliate-content' },
                                { label: 'Daily News (Affiliate)', id: 'email-affiliate-news' },
                                { label: 'Other', id: '' }
                            ].map(pub => (
                                <label key={pub.label} style={{
                                    ...checkboxLabelStyle,
                                    background: adsEmailType === pub.label ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                                    borderColor: adsEmailType === pub.label ? 'var(--primary)' : 'transparent',
                                    justifyContent: 'flex-start' // Ensure left alignment
                                }}>
                                    <input
                                        type="radio"
                                        name="adsEmailPub"
                                        checked={adsEmailType === pub.label}
                                        onChange={() => setAdsEmailType(pub.label)}
                                        style={{ accentColor: 'var(--primary)', width: 'auto', marginRight: '0.5rem' }}
                                    />
                                    {pub.label}
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
                            type="ADS_IN_ESEND"
                            targetId={
                                // Map label back to ID for availability check
                                // Ideally state should store ID, but keeping label for legacy compatibility for now
                                adsEmailType === 'Daily Content' ? 'email-daily-content' :
                                    adsEmailType === 'Daily News' ? 'email-daily-news' :
                                        adsEmailType === 'Be Still & Know' ? 'email-bsak' :
                                            adsEmailType === 'CTY (Sat)' ? 'email-cty' :
                                                adsEmailType === 'WA (Sat)' ? 'email-wa' :
                                                    adsEmailType === 'PG (Fri)' ? 'email-pg' :
                                                        adsEmailType === 'Daily Content (Affiliate)' ? 'email-affiliate-content' :
                                                            adsEmailType === 'Daily News (Affiliate)' ? 'email-affiliate-news' :
                                                                undefined
                            }
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
