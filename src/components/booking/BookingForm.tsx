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
    // Form State - Dynamic
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Core State needed for logic
    const [bookingType, setBookingType] = useState<BookingType | ''>('');
    const [clientName, setClientName] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [bookerName, setBookerName] = useState('');

    // Calendar State (kept separate for complex logic)
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    // Form Configuration State
    const [formConfig, setFormConfig] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bookingFormConfig');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setFormConfig(parsed);
                } catch (e) {
                    console.error('Failed to parse form config', e);
                }
            }
        }
    }, []);

    // Load booking data for editing
    const loadBookingForEdit = (booking: any) => {
        setEditingBookingId(booking.id);
        setShowNewForm(true);
        setClientName(booking.clientName || '');
        setContractNumber(booking.contractNumber || '');
        setBookerName(booking.bookerName || '');
        setBookingType(booking.bookingType || '');

        // Populate formData based on known mappings for backward compatibility
        const newData: Record<string, any> = {};
        const details = booking.additionalDetails || {};

        // Helper to find field ID for a section/type
        // ideally we would map dynamically but for now we map known fields
        if (booking.bookingType === 'AUDIO') {
            newData['audioStartDate'] = booking.startDate;
            newData['audioEndDate'] = booking.endDate;
            newData['audioImpressions'] = booking.audioSpots;
            newData['audioTargeting'] = details.targeting || [];
        } else if (booking.bookingType === 'DISPLAY') {
            newData['displayStartDate'] = booking.startDate;
            newData['displayEndDate'] = booking.endDate;
            newData['displayImpressions'] = booking.displayImpressions;
            newData['displayType'] = details.displayType;
            newData['displayWebsites'] = details.displayWebsites || [];
        } else if (booking.bookingType === 'BESPOKE_ESEND') {
            newData['bespokeDepartment'] = booking.department;
            newData['bespokeLists'] = details.emailLists || [];
            newData['bespokeQuantity'] = details.emailCount || 1; // Assuming we store this
        } else if (booking.bookingType === 'ADS_IN_ESEND') {
            newData['adsTargeting'] = details.adsEmailType;
            newData['adsQuantity'] = details.emailCount || 1;
        }

        setFormData(newData);
        setSelectedDates(booking.emailDates || []);
    };

    const resetForm = () => {
        setEditingBookingId(null);
        setClientName('');
        setContractNumber('');
        setBookerName('');
        setBookingType('');
        setFormData({});
        setSelectedDates([]);
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

    // Generic Field Handler
    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    // Array Toggle Helper for Checkboxes
    const toggleArrayValue = (fieldId: string, item: string) => {
        const currentList = (formData[fieldId] as string[]) || [];
        if (currentList.includes(item)) {
            handleFieldChange(fieldId, currentList.filter(i => i !== item));
        } else {
            handleFieldChange(fieldId, [...currentList, item]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Extract core values based on active section
            // We use 'any' cast to access dynamic properties safely
            const data = formData as any;

            let startDate = new Date().toISOString();
            let endDate = new Date().toISOString();
            let impressions = 0;
            let department = 'SALES';
            let additionalDetails: ExtraDetails = {};

            if (bookingType === 'AUDIO') {
                startDate = data.audioStartDate;
                endDate = data.audioEndDate;
                impressions = parseInt(data.audioImpressions || '0');
                additionalDetails.targeting = data.audioTargeting;
            } else if (bookingType === 'DISPLAY') {
                startDate = data.displayStartDate;
                endDate = data.displayEndDate;
                impressions = parseInt(data.displayImpressions || '0');
                additionalDetails.displayType = data.displayType;
                additionalDetails.displayWebsites = data.displayWebsites;
            } else if (bookingType === 'BESPOKE_ESEND') {
                department = data.bespokeDepartment || 'SALES';
                additionalDetails.emailLists = data.bespokeLists;
                // emailCount? 
            } else if (bookingType === 'ADS_IN_ESEND') {
                additionalDetails.adsEmailType = data.adsTargeting;
            }

            // Map to BookingRequest
            const bookingData: Omit<BookingRequest, 'id' | 'status'> = {
                clientName,
                campaignName: bookingType + ' Campaign',
                startDate: startDate || new Date().toISOString(),
                endDate: endDate || new Date().toISOString(),
                contractNumber,
                bookerName,
                bookingType,
                department,
                geoTarget: 'GLOBAL' as GeoRegion,
                additionalDetails,

                // Map specific metrics
                audioSpots: bookingType === 'AUDIO' ? impressions : 0,
                displayImpressions: bookingType === 'DISPLAY' ? impressions : 0,
                emailDates: (bookingType === 'BESPOKE_ESEND' || bookingType === 'ADS_IN_ESEND') ? selectedDates : [],
            };

            if (editingBookingId) {
                const { updateBooking } = await import('../../lib/actions/booking');
                await updateBooking(editingBookingId, bookingData as any);
                alert(`Booking updated successfully for ${clientName}!`);
                resetForm();
                setShowNewForm(false);
                router.refresh();
            } else {
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

    // Default Configuration to ensure form is never empty
    const defaultFormConfig = {
        bookingTypeQuestion: 'What would you like to book? *',
        bookingTypes: [
            { id: 'AUDIO', label: 'Audio Ad', description: 'Premier Gospel, WA, CTY' },
            { id: 'DISPLAY', label: 'Display Ads', description: 'MPU, Leaderboard, Skyscraper' },
            { id: 'BESPOKE_ESEND', label: 'Bespoke E-sends', description: 'Standalone email campaigns' },
            { id: 'ADS_IN_ESEND', label: 'Ads in E-sends', description: 'Ads within existing newsletters' }
        ],
        fields: [
            // General Section
            { id: 'clientName', type: 'text', label: 'Client / Brand Name', required: true, section: 'general', placeholder: 'e.g. Nike, Premier Digital...' },
            { id: 'contractNumber', type: 'text', label: 'Contract Number', required: false, section: 'general', placeholder: 'Optional' },
            { id: 'bookerName', type: 'text', label: 'Booked By', required: true, section: 'general', placeholder: 'Your name' },

            // Audio Section
            { id: 'audioStartDate', type: 'date', label: 'Start Date', required: true, section: 'AUDIO' },
            { id: 'audioEndDate', type: 'date', label: 'End Date', required: true, section: 'AUDIO' },
            {
                id: 'audioTargeting',
                type: 'checkbox',
                label: 'Targeting Preference',
                required: false,
                section: 'AUDIO',
                options: ['Location Based', 'Radio Stations', 'Podcasts', 'Run of Network']
            },
            { id: 'audioImpressions', type: 'number', label: 'Number of Impressions/Spots', required: true, section: 'AUDIO', placeholder: 'e.g. 50000' },

            // Display Section
            { id: 'displayImpressions', type: 'number', label: 'Number of Impressions', required: true, section: 'DISPLAY', placeholder: 'e.g. 100000' },
            {
                id: 'displayType',
                type: 'select',
                label: 'Type of Display Ads',
                required: true,
                section: 'DISPLAY',
                options: ['MPU', 'Leaderboard', 'Skyscraper', 'Billboard', 'Double MPU']
            },
            {
                id: 'displayWebsites',
                type: 'checkbox',
                label: 'Websites',
                required: false,
                section: 'DISPLAY',
                options: ['WA', 'CTY', 'UNB', 'NEXGEN', 'Premier Christian Radio']
            },
            { id: 'displayStartDate', type: 'date', label: 'Start Date', required: true, section: 'DISPLAY' },
            { id: 'displayEndDate', type: 'date', label: 'End Date', required: true, section: 'DISPLAY' },

            // Bespoke E-send Section
            {
                id: 'bespokeDepartment',
                type: 'select',
                label: 'Booking Department',
                required: true,
                section: 'BESPOKE_ESEND',
                options: ['Sales', 'Marketing', 'Fundraising', 'Internal']
            },
            {
                id: 'bespokeLists',
                type: 'checkbox',
                label: 'Which e-mail marketing list(s) would you like to send the e-send to?',
                required: true,
                section: 'BESPOKE_ESEND',
                options: ['SALES A+B', 'SALES A', 'SALES B', 'SALES CTY', 'SALES NEXGEN', 'SALES LEADERS', 'FUNDRAISING', 'MARKETING', 'SALES WAlive', 'SALES PG', 'Other (describe)']
            },
            { id: 'bespokeQuantity', type: 'number', label: 'How many bespoke esends would you like to book for this campaign?', required: true, section: 'BESPOKE_ESEND', placeholder: '1' },

            // Ads in E-send Section
            {
                id: 'adsTargeting',
                type: 'radio',
                label: 'Target Email Publication',
                required: true,
                section: 'ADS_IN_ESEND',
                options: ['Daily Content', 'Daily News', 'Be Still & Know', 'CTY (Sat)', 'WA (Sat)', 'PG (Fri)', 'Daily Content (Affiliate)', 'Daily News (Affiliate)', 'Other']
            },
            { id: 'adsQuantity', type: 'number', label: 'Quantity of Ads', required: true, section: 'ADS_IN_ESEND', placeholder: '1' },
        ]
    };

    const bookingTypesToRender = (formConfig || defaultFormConfig).bookingTypes;
    const bookingQuestion = (formConfig || defaultFormConfig).bookingTypeQuestion;

    // Dynamic Field Renderer
    const renderField = (field: any) => {
        const val = formData[field.id];

        switch (field.type) {
            case 'text':
            case 'number':
            case 'date':
                return (
                    <div key={field.id}>
                        <label style={labelStyle}>{field.label} {field.required && '*'}</label>
                        <input
                            type={field.type}
                            style={inputStyle}
                            placeholder={field.placeholder}
                            required={field.required}
                            value={val || ''}
                            onChange={e => handleFieldChange(field.id, e.target.value)}
                        />
                    </div>
                );
            case 'select':
                return (
                    <div key={field.id} style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>{field.label} {field.required && '*'}</label>
                        <select
                            style={inputStyle}
                            required={field.required}
                            value={val || ((field.options && field.options[0]) || '')}
                            onChange={e => handleFieldChange(field.id, e.target.value)}
                        >
                            {field.options?.map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'checkbox':
                return (
                    <div key={field.id} style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>{field.label} {field.required && '*'}</label>
                        <div style={checkboxGroupStyle}>
                            {field.options?.map((opt: string) => (
                                <label key={opt} style={{
                                    ...checkboxLabelStyle,
                                    background: (val || []).includes(opt) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                    borderColor: (val || []).includes(opt) ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={(val || []).includes(opt)}
                                        onChange={() => toggleArrayValue(field.id, opt)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'radio':
                return (
                    <div key={field.id} style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>{field.label} {field.required && '*'}</label>
                        <div style={checkboxGroupStyle}>
                            {field.options?.map((opt: string) => (
                                <label key={opt} style={{
                                    ...checkboxLabelStyle,
                                    background: val === opt ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                                    borderColor: val === opt ? 'var(--primary)' : 'transparent'
                                }}>
                                    <input
                                        type="radio"
                                        name={field.id}
                                        checked={val === opt}
                                        onChange={() => handleFieldChange(field.id, opt)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderSection = (sectionId: string) => {
        const configToUse = formConfig || defaultFormConfig;
        if (!configToUse.fields) return null;

        const fields = configToUse.fields.filter((f: any) => f.section === sectionId);

        return (
            <div style={sectionStyle}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)' }}>
                    {bookingTypesToRender.find((t: any) => t.id === sectionId)?.label || sectionId}
                </h3>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {fields.map(renderField)}
                </div>

                {/* Inject Logic-Heavy Components conditionally */}
                {sectionId === 'BESPOKE_ESEND' && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={labelStyle}>Select Dates</label>
                        <BespokeCalendar
                            selectedDates={selectedDates}
                            onDateSelect={setSelectedDates}
                            selectedLists={formData['bespokeLists'] || []}
                            department={formData['bespokeDepartment'] || 'SALES'}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Selected: {selectedDates.length} dates</p>

                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={labelStyle}>Comments</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '80px' }}
                                placeholder="Any specific requirements..."
                                value={formData['bespokeComments'] || ''}
                                onChange={e => handleFieldChange('bespokeComments', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {sectionId === 'ADS_IN_ESEND' && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={labelStyle}>Select Available Dates</label>
                        <AvailabilityCalendar
                            type="ADS_IN_ESEND"
                            targetId={
                                // Map label back to ID if needed, or use the value directly if it aligns
                                // Current map uses labels like 'Daily News' matching the targetId logic
                                formData['adsTargeting'] === 'Daily Content' ? 'email-daily-content' :
                                    formData['adsTargeting'] === 'Daily News' ? 'email-daily-news' :
                                        formData['adsTargeting'] === 'Be Still & Know' ? 'email-bsak' :
                                            formData['adsTargeting'] === 'CTY (Sat)' ? 'email-cty' :
                                                formData['adsTargeting'] === 'WA (Sat)' ? 'email-wa' :
                                                    formData['adsTargeting'] === 'PG (Fri)' ? 'email-pg' :
                                                        formData['adsTargeting'] === 'Daily Content (Affiliate)' ? 'email-affiliate-content' :
                                                            formData['adsTargeting'] === 'Daily News (Affiliate)' ? 'email-affiliate-news' :
                                                                undefined
                            }
                            selectedDates={selectedDates}
                            onDateSelect={setSelectedDates}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Selected: {selectedDates.length} dates</p>
                    </div>
                )}
            </div>
        );
    };


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
            {bookingType === 'AUDIO' && renderSection('AUDIO')}

            {/* DISPLAY ADS SECTION */}
            {bookingType === 'DISPLAY' && renderSection('DISPLAY')}

            {/* BESPOKE E-SENDS SECTION */}
            {bookingType === 'BESPOKE_ESEND' && renderSection('BESPOKE_ESEND')}

            {/* ADS IN E-SENDS SECTION */}
            {bookingType === 'ADS_IN_ESEND' && renderSection('ADS_IN_ESEND')}

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
