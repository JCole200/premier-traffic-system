'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { BookingRequest, GeoRegion } from '../../types/inventory';
import InventoryDateRangePicker from './InventoryDateRangePicker';
import { createBooking } from '../../lib/actions/booking';

type BookingType = 'AUDIO' | 'DISPLAY' | 'BESPOKE_ESEND' | 'ADS_IN_ESEND';

interface BookingFormProps {
    isAdmin?: boolean;
    existingBookings?: any[];
    searchParams?: { [key: string]: string | undefined };
}

// Temporary Mock Data for standardizing inputs natively
const SALES_EXECS = [
    'Claire Broadmore',
    'Maxine Ellis',
    'Chris Barnham'
];

const PRODUCTS = [
    'Premier Christianity - Web - Blog Post',
    'Premier Christianity - Web - Advertisement',
    'Premier Christianity - Web - E-Send - Bespoke',
    'Premier Christianity - Web - Sponsorship',
    'Premier Christianity & Woman Alive - Web - Leaderboard',
    'Premier Christianity & Woman Alive - Web - MPU',
    'Premier Group - Web - E-Send - Daily News - Advertisement',
    'Premier Group - Web - E-Send - Daily News - Sponsorship',
    'Premier Group - Web - E-Send - Grace For Today - Sponsorship',
    'Premier Group - Web - E-Send - Grace For Today - Advertisement',
    'Premier Group - Web - E-Send - Leaders Weekly - Bespoke',
    'Premier Group - Web - E-Send - Promotes Bespoke - Single List',
    'Premier Group - Web - E-Send - Voice of Hope - Advertisement',
    'Premier Group - Web - E-Send - Voice of Hope - Sponsorship',
    'Premier Group - Web - Podcasts - Advert',
    'Premier Group - Web - Podcasts - Presenter Read',
    'Premier Group - Web - Podcasts - Sponsorship',
    'Premier NexGen - Web - E-Send - Advertisement',
    'Premier NexGen - Web - E-Send - Bespoke',
    'Premier NexGen - Web - E-Send - Sponsorship',
    'Premier NexGen - Web - Leaderboard',
    'Premier NexGen - Web - MPU',
    'Premier NexGen - Web - Sponsored Blog Post',
    'Premier Plus - Web - Livestream/On Demand/Podcasts',
    'Premier Plus - Web - Christmas Radio - Sponsorship',
    'Premier Plus - Web - Be Still & Know - Sponsorship',
    'Premier Podcast - Web - Bible for Today - Sponsorship',
    'Premier Podcast - Web - Bible in a Year - Sponsorship',
    'Premier Podcast - Web - C.S Lewis Podcast - Sponsorship',
    'Premier Podcast - Web - Matters of Life & Death - Sponsorship',
    'Premier Podcast - Web - Naked Love - Sponsorship',
    'Premier Podcast - Web - Newscast - Sponsorship',
    'Premier Podcast - Web - NT Wright - Sponsorship',
    'Premier Podcast - Web - Programme - Sponsorship',
    'Premier Podcast - Web - Soul Survivor - Sponsorship',
    'Premier Podcast - Web - The Leadership Show - Sponsorship',
    'Premier Podcast - Web - The Profile - Sponsorship',
    'Premier Podcast - Web - Unapologetic - Sponsorship',
    'Premier Podcast - Web - Unbelievable - Sponsorship',
    'Premier Unbelievable - Web - E-Send - Advertisement',
    'Premier Unbelievable - Web - Leaderboard',
    'Premier Unbelievable - Web - MPU',
    'Premier Woman Alive - Web - Blog Post',
    'Premier Woman Alive - Web - E-Send - Advertisement',
    'Premier Woman Alive - Web - E-Send - Bespoke',
    'Premier Woman Alive - Web - E-Send - Sponsorship',
    'Premier Woman Alive - Web - Homepage Takeover',
];

const REGIONS = ['London', 'UK', 'International'];
const REPORT_FREQS = ['Daily', 'Weekly', 'End of Campaign'];

export default function BookingForm({ isAdmin = false, existingBookings = [], searchParams = {} }: BookingFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Core Schema Fields
    const [bookingType, setBookingType] = useState<BookingType>(searchParams.type as BookingType || 'AUDIO');
    const [bookerName, setBookerName] = useState(SALES_EXECS[0]);
    const [clientName, setClientName] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [isCharity, setIsCharity] = useState(false);
    const [aquiraBookingNumber, setAquiraBookingNumber] = useState('');
    const [product, setProduct] = useState(PRODUCTS[0]);
    const [quantity, setQuantity] = useState('');
    
    // Date Logic
    const [startDate, setStartDate] = useState<string | null>(searchParams.start || null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [flexibleDates, setFlexibleDates] = useState('');
    
    // Target Linking
    const [targetId, setTargetId] = useState(searchParams.target || '');
    
    // Specific Arrays
    const [regions, setRegions] = useState<string[]>([]);
    const [reportFreq, setReportFreq] = useState<string[]>([]);
    
    // Base Inventory 
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchItems = async () => {
            const { getInventoryItems } = await import('../../lib/actions/admin');
            const items = await getInventoryItems();
            setInventoryItems(items);
            if (!targetId && items.length > 0) {
                // Auto-select first matching target to make calendar happy
                const audioTarget = items.find((i: any) => i.type === 'AUDIO');
                if (audioTarget) setTargetId(audioTarget.id);
            }
        };
        fetchItems();
    }, []);

    // Change target if type changes
    useEffect(() => {
        const matchingItems = inventoryItems.filter(i => {
            if (bookingType === 'AUDIO') return i.type === 'AUDIO';
            if (bookingType === 'DISPLAY') return i.type === 'DISPLAY';
            return i.type === 'EMAIL' || i.type === 'ADS_IN_ESEND' || i.type === 'BESPOKE_ESEND';
        });
        if (matchingItems.length > 0) {
            setTargetId(matchingItems[0].id);
        }
    }, [bookingType, inventoryItems]);

    const toggleArrayValue = (val: string, currentArr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (currentArr.includes(val)) {
            setArr(currentArr.filter(i => i !== val));
        } else {
            setArr([...currentArr, val]);
        }
    };

    const handleSubmit = async (e: React.FormEvent, statusOverride?: 'CONFIRMED' | 'RESERVED') => {
        e.preventDefault();
        setIsSubmitting(true);
        const finalStatus = statusOverride || 'CONFIRMED';

        try {
            if (!clientName || !startDate || !endDate) {
                throw new Error("Client Name and strict Date Selection on the calendar are required.");
            }

            const additionalDetails = {
                isCharity,
                product,
                flexibleDatesText: flexibleDates,
                regions,
                reportFrequency: reportFreq,
                // simulated file upload
                creativeAssetsUploaded: false 
            };

            const bookingData: Omit<BookingRequest, 'id'> = {
                clientName,
                campaignName: campaignName || `${clientName} Campaign`,
                startDate: startDate,
                endDate: endDate,
                contractNumber: aquiraBookingNumber,
                bookerName,
                bookingType,
                department: 'SALES',
                category: 'PAID',
                geoTarget: 'GLOBAL' as GeoRegion,
                additionalDetails,
                
                audioTargetId: targetId,
                audioSpots: bookingType === 'AUDIO' ? parseInt(quantity || '0') : 0,
                displayImpressions: bookingType === 'DISPLAY' ? parseInt(quantity || '0') : 0,
                emailDates: (bookingType === 'BESPOKE_ESEND' || bookingType === 'ADS_IN_ESEND') ? [startDate] : [],
                status: finalStatus
            };

            await createBooking(bookingData);
            alert(`${finalStatus === 'RESERVED' ? 'Reservation Saved' : 'Booking Confirmed'} for ${clientName}!`);
            router.push('/');
            
        } catch (err) {
            console.error(err);
            alert('Something went wrong: ' + (err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Styling Helpers
    const sectionStyle = {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '1.5rem',
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

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{color:'var(--primary)'}}>■</span> New Booking Form
            </h2>

            {/* CHANNEL TYPES */}
            <div style={sectionStyle}>
                <label style={labelStyle}>What channel are you booking?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    {[
                        { id: 'AUDIO', label: '🔈 Audio' },
                        { id: 'DISPLAY', label: '💻 Display' },
                        { id: 'BESPOKE_ESEND', label: '✉️ Bespoke E-Send' },
                        { id: 'ADS_IN_ESEND', label: '📰 Newsletter Ad' }
                    ].map(type => (
                        <div 
                            key={type.id}
                            onClick={() => setBookingType(type.id as BookingType)}
                            style={{
                                padding: '0.8rem',
                                textAlign: 'center',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: bookingType === type.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                                color: bookingType === type.id ? 'white' : 'var(--text-muted)',
                                border: `1px solid ${bookingType === type.id ? 'var(--primary)' : 'transparent'}`,
                                fontWeight: bookingType === type.id ? 600 : 400
                            }}
                        >
                            {type.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* GENERAL FIELDS */}
            <div style={{...sectionStyle, display: 'grid', gap: '1.5rem'}}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Sales Exec Name *</label>
                        <select required style={inputStyle} value={bookerName} onChange={e => setBookerName(e.target.value)}>
                            {SALES_EXECS.map(exec => <option key={exec} value={exec}>{exec}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Advertiser Name *</label>
                        <input required type="text" style={inputStyle} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Compassion UK" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Campaign Name</label>
                        <input type="text" style={inputStyle} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. COTY 2026" />
                    </div>
                    <div>
                        <label style={labelStyle}>Aquira Booking Number</label>
                        <input type="text" style={inputStyle} value={aquiraBookingNumber} onChange={e => setAquiraBookingNumber(e.target.value)} placeholder="AQU-..." />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <input type="checkbox" id="charityTick" checked={isCharity} onChange={e => setIsCharity(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                    <label htmlFor="charityTick" style={{ color: 'white', cursor: 'pointer', fontWeight: 600 }}>Is this a Charity?</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Required tracking for Premier Appeals)</span>
                </div>
            </div>

            {/* PRODUCT SPECIFICS */}
            <div style={{...sectionStyle, display: 'grid', gap: '1.5rem'}}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Product *</label>
                        <select required style={inputStyle} value={product} onChange={e => setProduct(e.target.value)}>
                            {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Quantity requested *</label>
                        <input required type="number" style={inputStyle} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder={bookingType === 'AUDIO' ? "Spots" : "Impressions"} />
                    </div>
                </div>
                
                <div>
                     <label style={labelStyle}>Network Targeting Pool</label>
                     <select style={inputStyle} value={targetId} onChange={e => setTargetId(e.target.value)}>
                        {inventoryItems.filter(i => {
                            if (bookingType === 'AUDIO') return i.type === 'AUDIO';
                            if (bookingType === 'DISPLAY') return i.type === 'DISPLAY';
                            return i.type === 'EMAIL' || i.type === 'ADS_IN_ESEND' || i.type === 'BESPOKE_ESEND';
                        }).map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                     </select>
                </div>
            </div>

            {/* DATES */}
            <div style={{...sectionStyle, display: 'grid', gap: '1.5rem'}}>
                <div>
                    <label style={labelStyle}>Date Range (Select Start & End) *</label>
                    <InventoryDateRangePicker 
                        bookingType={bookingType}
                        targetId={targetId}
                        inventoryItems={inventoryItems}
                        bookings={existingBookings}
                        selectedStartDate={startDate}
                        selectedEndDate={endDate}
                        onDateSelect={(start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                    />
                    
                    {startDate && endDate && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px', color: 'var(--accent-cyan)', textAlign: 'center', fontSize: '0.9rem' }}>
                            Selected Run: <strong>{startDate}</strong> to <strong>{endDate}</strong>
                        </div>
                    )}
                </div>

                <div>
                    <label style={labelStyle}>Flexible Dates Box (TBC)</label>
                    <input type="text" style={inputStyle} value={flexibleDates} onChange={e => setFlexibleDates(e.target.value)} placeholder="If dates above are estimates, specify flexible logic here (e.g. 'TBC Mid-May')" />
                </div>
            </div>

            {/* PERFORMANCE & REPORTING */}
            <div style={{...sectionStyle, display: 'grid', gap: '1.5rem'}}>
                
                {bookingType === 'AUDIO' && (
                    <div>
                        <label style={labelStyle}>Region (Streaming Only)</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' as 'wrap' }}>
                            {REGIONS.map(reg => (
                                <label key={reg} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: regions.includes(reg) ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}>
                                    <input type="checkbox" checked={regions.includes(reg)} onChange={() => toggleArrayValue(reg, regions, setRegions)} />
                                    <span>{reg}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                <div>
                    <label style={labelStyle}>Performance Report Frequency</label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' as 'wrap' }}>
                        {REPORT_FREQS.map(freq => (
                            <label key={freq} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: reportFreq.includes(freq) ? '1px solid var(--primary)' : '1px solid transparent' }}>
                                <input type="checkbox" checked={reportFreq.includes(freq)} onChange={() => toggleArrayValue(freq, reportFreq, setReportFreq)} />
                                <span>{freq}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Creative Assets Upload</label>
                    <div style={{ width: '100%', padding: '2rem', border: '2px dashed var(--border-subtle)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                        Drop files here or click to upload creatives
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Accepted: .mp3, .png, .jpg, .gif, .pdf</div>
                    </div>
                </div>
            </div>


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
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleSubmit(e as any, 'RESERVED')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSubmitting ? '...' : 'Save as Reservation'}
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Booking...' : 'Confirm Final Booking'}
                </button>
            </div>
        </form>
    );
}
