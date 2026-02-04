'use client';

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import EditBookingModal from './EditBookingModal';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Props {
    bookings: any[];
    inventoryItems: any[];
}

export default function MasterCalendar({ bookings, inventoryItems }: Props) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [viewTab, setViewTab] = useState<'SALES' | 'PREMIER'>('SALES'); // Tab State
    const [filterType, setFilterType] = useState<string>('ALL'); // ALL, AUDIO, DISPLAY, EMAIL
    const [filterTargetId, setFilterTargetId] = useState<string>(''); // specific ID
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Transform bookings to events
    const events = useMemo(() => {
        let filtered = bookings;

        // 0. Filter by View Tab
        if (viewTab === 'SALES') {
            filtered = filtered.filter(b => b.department === 'SALES' || !b.department); // Default to Sales if null
        } else {
            // Premier / Internal View
            filtered = filtered.filter(b => b.department && b.department !== 'SALES');
        }

        // 1. Filter by Type
        if (filterType !== 'ALL') {
            // This relies on inferred type or explicit bookingType
            // If bookingType is set (new bookings), use it. 
            // If not (old data), try to infer from used slots.
            filtered = filtered.filter(b => {
                if (b.bookingType) {
                    if (filterType === 'AUDIO') return b.bookingType === 'AUDIO';
                    if (filterType === 'DISPLAY') return b.bookingType === 'DISPLAY';
                    if (filterType === 'EMAIL') return b.bookingType === 'BESPOKE_ESEND' || b.bookingType === 'ADS_IN_ESEND';
                }
                // Inference fallback
                if (filterType === 'AUDIO') return b.audioSpots > 0;
                if (filterType === 'DISPLAY') return b.displayImpressions > 0;
                if (filterType === 'EMAIL') return b.emailDates && b.emailDates.length > 0;
                return true;
            });
        }

        // 2. Filter by Specific Target (Channel)
        if (filterTargetId) {
            filtered = filtered.filter(b => b.audioTargetId === filterTargetId);
        }

        return filtered.map(b => {
            // Determine Color
            let color = '#3174ad'; // Default Blue
            if (b.bookingType === 'AUDIO') color = '#dd5e5e'; // Red
            if (b.bookingType === 'DISPLAY') color = '#55b467'; // Green
            if (b.bookingType === 'BESPOKE_ESEND') color = '#e3a008'; // Orange
            if (b.bookingType === 'ADS_IN_ESEND') color = '#9333ea'; // Purple

            // Override for Department Colors in Premier View?
            if (viewTab === 'PREMIER') {
                if (b.department === 'MARKETING') color = '#be185d'; // Pink
                if (b.department === 'FUNDRAISING') color = '#059669'; // Teal
            }

            return {
                id: b.id,
                title: `${b.clientName} (${b.campaignName})`,
                start: new Date(b.startDate),
                end: new Date(b.endDate),
                resource: b,
                style: { backgroundColor: color }
            };
        });
    }, [bookings, viewTab, filterType, filterTargetId]);

    // Handle Event Click
    const handleSelectEvent = (event: any) => {
        setSelectedBooking(event.resource);
    };

    // Custom Event Style
    const eventPropGetter = (event: any) => {
        return {
            style: {
                backgroundColor: event.style.backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0 1rem' }}>
                <button
                    onClick={() => setViewTab('SALES')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px 8px 0 0',
                        background: viewTab === 'SALES' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: 'none',
                        borderBottom: viewTab === 'SALES' ? '2px solid white' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Sales View
                </button>
                <button
                    onClick={() => setViewTab('PREMIER')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px 8px 0 0',
                        background: viewTab === 'PREMIER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: 'none',
                        borderBottom: viewTab === 'PREMIER' ? '2px solid white' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Premier (Internal)
                </button>
            </div>

            {/* Toolbar */}
            <div className="glass-panel" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>

                {/* Type Filter */}
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setFilterTargetId(''); }}
                    style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)' }}
                >
                    <option value="ALL">All Media Types</option>
                    <option value="AUDIO">Audio</option>
                    <option value="DISPLAY">Display</option>
                    <option value="EMAIL">Email</option>
                </select>

                {/* Sub-Channel Filter (Only showing Audio channels for now as that's what we have IDs for) */}
                {filterType === 'AUDIO' && (
                    <select
                        value={filterTargetId}
                        onChange={e => setFilterTargetId(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)' }}
                    >
                        <option value="">All Audio Channels</option>
                        {inventoryItems
                            .filter(i => i.type === 'AUDIO')
                            .map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))
                        }
                    </select>
                )}

                <div style={{ flex: 1 }}></div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {events.length} Bookings Shown
                </div>
            </div>

            {/* Calendar */}
            <div className="glass-panel" style={{ flex: 1, padding: '1rem' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    eventPropGetter={eventPropGetter}
                    onSelectEvent={handleSelectEvent}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]} // Limits available views
                    popup
                />
            </div>

            {/* Edit Modal */}
            {selectedBooking && (
                <EditBookingModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    );
}
