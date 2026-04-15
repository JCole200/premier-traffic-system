'use client';

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import EditBookingModal from '../calendar/EditBookingModal';

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
    initialBookings: any[];
    inventoryItems: any[];
}

export default function DisplayInventoryDashboard({ initialBookings, inventoryItems }: Props) {
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<any>(Views.MONTH);
    const [displayMode, setDisplayMode] = useState<'OVERVIEW' | 'CALENDAR'>('OVERVIEW');
    
    // Filters
    const [filterWebsite, setFilterWebsite] = useState('ALL');
    const [filterFormat, setFilterFormat] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Display Bookings
    const displayBookings = useMemo(() => {
        return initialBookings.filter(b => b.bookingType === 'DISPLAY');
    }, [initialBookings]);

    // Available Impressions Calculations
    const availableImpressions = useMemo(() => {
        let items = inventoryItems.filter(i => i.type === 'DISPLAY');
        if (filterWebsite !== 'ALL') items = items.filter(i => i.id === filterWebsite);

        const startFilterTime = startDate ? new Date(startDate).getTime() : 0;
        const endFilterTime = endDate ? new Date(endDate).getTime() + 86399999 : Infinity;

        return items.map(item => {
            const itemBookings = displayBookings.filter(b => {
                // If there's an audioTargetId but it's really the generic target field, we need to check how it's mapped.
                // But previously for Audio we used `audioTargetId`. For display, we might also use `audioTargetId` as the generic target id, or it could be null.
                // Assuming it's the same schema, and display targets use `audioTargetId`.
                if (b.audioTargetId && b.audioTargetId !== item.id) return false;
                
                // Format check
                if (filterFormat !== 'ALL') {
                    const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                    if (details.displayFormat && details.displayFormat !== filterFormat) return false;
                }

                // Date overlap check
                const bStart = new Date(b.startDate).getTime();
                const bEnd = new Date(b.endDate).getTime();
                return bStart <= endFilterTime && bEnd >= startFilterTime;
            });

            const bookedImpressions = itemBookings.reduce((acc, curr) => acc + (curr.displayImpressions || 0), 0);
            
            // Single pool logic for site impressions
            const available = item.totalCapacity - bookedImpressions;

            return {
                ...item,
                booked: bookedImpressions,
                available: available,
                pctUtilized: (bookedImpressions / item.totalCapacity) * 100
            };
        });
    }, [inventoryItems, displayBookings, filterWebsite, filterFormat, startDate, endDate]);

    // Booked & Pending Ads
    const filteredBookings = useMemo(() => {
        let filtered = displayBookings;

        if (filterWebsite !== 'ALL') filtered = filtered.filter(b => b.audioTargetId === filterWebsite); // We assume audioTargetId stores the placement id here too.
        
        if (filterFormat !== 'ALL') {
            filtered = filtered.filter(b => {
                const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                return details.displayFormat === filterFormat;
            });
        }

        if (startDate && endDate) {
            const startT = new Date(startDate).getTime();
            const endT = new Date(endDate).getTime() + 86399999;
            filtered = filtered.filter(b => {
                const bStart = new Date(b.startDate).getTime();
                const bEnd = new Date(b.endDate).getTime();
                return bStart <= endT && bEnd >= startT;
            });
        }

        return filtered;
    }, [displayBookings, filterWebsite, filterFormat, startDate, endDate]);

    const confirmedBookings = filteredBookings.filter(b => b.status === 'CONFIRMED');
    const reservedBookings = filteredBookings.filter(b => b.status === 'RESERVED');

    // Calendar Events
    const events = useMemo(() => {
        return filteredBookings.map(b => {
            const isReserved = b.status === 'RESERVED';
            const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
            const fmt = details.displayFormat ? ` [${details.displayFormat}]` : '';

            return {
                id: b.id,
                title: `${isReserved ? '⚠️ ' : ''}${b.clientName} - ${b.campaignName}${fmt}`,
                start: new Date(b.startDate),
                end: new Date(new Date(b.endDate).setHours(23, 59, 59)),
                resource: b,
                style: { backgroundColor: isReserved ? 'var(--warning)' : 'var(--accent-cyan)', color: isReserved ? 'black' : 'white' }
            };
        });
    }, [filteredBookings]);

    const eventPropGetter = (event: any) => ({
        style: {
            backgroundColor: event.style.backgroundColor,
            color: event.style.color,
            borderRadius: '6px',
            opacity: 0.9,
            border: 'none',
            display: 'block',
            padding: '2px 5px',
            fontSize: '0.8rem',
            boxShadow: event.resource.status === 'RESERVED' ? '0 0 8px rgba(234, 179, 8, 0.4)' : 'none'
        }
    });

    const getTargetName = (id: string) => {
        const i = inventoryItems.find(item => item.id === id);
        return i ? i.name : id || 'Run of Network';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Filters Bar */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Website / Placement</label>
                    <select value={filterWebsite} onChange={e => setFilterWebsite(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', minWidth: '150px' }}>
                        <option value="ALL">All Websites</option>
                        {inventoryItems.filter(i => i.type === 'DISPLAY').map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date Range</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }} />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ad Format</label>
                    <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', minWidth: '120px' }}>
                        <option value="ALL">All Formats</option>
                        <option value="MPU">MPU</option>
                        <option value="LEADERBOARD">Leaderboard</option>
                        <option value="BILLBOARD">Billboard</option>
                        <option value="MOBILE">Mobile Banner</option>
                    </select>
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setDisplayMode('OVERVIEW')} className={displayMode === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'OVERVIEW' ? 'var(--accent-cyan)' : 'transparent', color: 'white' }}>
                        Overview
                    </button>
                    <button onClick={() => setDisplayMode('CALENDAR')} className={displayMode === 'CALENDAR' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'CALENDAR' ? 'var(--accent-cyan)' : 'transparent', color: 'white' }}>
                        Calendar
                    </button>
                </div>
            </div>

            {displayMode === 'OVERVIEW' ? (
                <>
                    {/* Available Inventory Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Available Impressions (Real-Time)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {availableImpressions.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)' }}>No display inventory items found.</div>
                            ) : availableImpressions.map(item => (
                                <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: '4px solid var(--accent-cyan)' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>{item.name}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                                    </div>
                                    
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: item.available > 0 ? 'var(--success)' : 'var(--danger)', marginBottom: '0.2rem' }}>
                                        {item.available.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                        Available Impressions {startDate ? 'in filtered range' : 'total capacity'}
                                    </div>

                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, item.pctUtilized)}%`, height: '100%', background: item.pctUtilized > 90 ? 'var(--danger)' : 'var(--accent-cyan)' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                        <span>{item.pctUtilized.toFixed(1)}% Used</span>
                                        <span>Total: {item.totalCapacity.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending / Reserved Highlights */}
                    {reservedBookings.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--warning, #eab308)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>⚠️</span> Pending & Reserved Ads (Requiring Action)
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {reservedBookings.map(b => {
                                    const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                                    return (
                                        <div key={b.id} onClick={() => setSelectedBooking(b)} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--warning)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.25rem' }}>Awaiting Assets</div>
                                            <div style={{ fontWeight: 600 }}>{b.campaignName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{b.clientName}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span>{b.displayImpressions?.toLocaleString()} Imps</span>
                                                <span>{details.displayFormat || 'Any Format'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Booked Display Campaigns List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Booked Display Ads</h3>
                        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Advertiser / Campaign</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Website / Placement</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Format</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dates</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Volume</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {confirmedBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No confirmed display campaigns found matching criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        confirmedBookings.map((b) => {
                                            const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                                            return (
                                                <tr key={b.id} onClick={() => setSelectedBooking(b)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} className="hover-row">
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{b.clientName}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.campaignName}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {b.audioTargetId ? getTargetName(b.audioTargetId) : 'Run of Network'}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                            {details.displayFormat || 'Any'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontSize: '0.85rem' }}>{b.startDate}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {b.endDate}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                                        {b.displayImpressions?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', minHeight: '600px' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        eventPropGetter={eventPropGetter}
                        onSelectEvent={(e) => setSelectedBooking(e.resource)}
                        style={{ height: '600px' }}
                    />
                </div>
            )}

            {selectedBooking && (
                <EditBookingModal 
                    booking={selectedBooking} 
                    onClose={() => setSelectedBooking(null)} 
                />
            )}

            <style dangerouslySetInnerHTML={{__html:`
                .hover-row:hover { background: rgba(255,255,255,0.03); }
            `}} />
        </div>
    );
}
