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

export default function ESendsDashboard({ initialBookings, inventoryItems }: Props) {
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<any>(Views.MONTH);
    const [displayMode, setDisplayMode] = useState<'OVERVIEW' | 'CALENDAR'>('OVERVIEW');
    
    // Filters
    const [filterList, setFilterList] = useState('ALL');
    const [filterPosition, setFilterPosition] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // E-sends Bookings
    const emailBookings = useMemo(() => {
        return initialBookings.filter(b => b.bookingType === 'EMAIL' || b.bookingType === 'BESPOKE_ESEND' || b.bookingType === 'ADS_IN_ESEND');
    }, [initialBookings]);

    // Available Inventory Stats
    const availableLists = useMemo(() => {
        let items = inventoryItems.filter(i => i.type === 'ADS_IN_ESEND' || i.type === 'BESPOKE_ESEND' || i.type === 'EMAIL');
        if (filterList !== 'ALL') items = items.filter(i => i.id === filterList);

        const startFilterTime = startDate ? new Date(startDate).getTime() : 0;
        const endFilterTime = endDate ? new Date(endDate).getTime() + 86399999 : Infinity;

        return items.map(item => {
            const itemBookings = emailBookings.filter(b => {
                if (b.audioTargetId && b.audioTargetId !== item.id) return false;
                
                // Position Check
                if (filterPosition !== 'ALL') {
                    const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                    if (details.emailPosition && details.emailPosition !== filterPosition) return false;
                }

                // Date overlap check
                const bStart = new Date(b.startDate).getTime();
                const bEnd = new Date(b.endDate).getTime();
                return bStart <= endFilterTime && bEnd >= startFilterTime;
            });

            // Count the total number of dates requested in emailDates array
            const bookedSends = itemBookings.reduce((acc, curr) => {
                const dates = curr.emailDates ? (typeof curr.emailDates === 'string' ? JSON.parse(curr.emailDates) : curr.emailDates) : [];
                return acc + dates.length;
            }, 0);
            
            const available = item.totalCapacity - bookedSends;
            const pctUsed = item.totalCapacity > 0 ? (bookedSends / item.totalCapacity) * 100 : 0;

            return {
                ...item,
                booked: bookedSends,
                available: available,
                pctUtilized: pctUsed
            };
        });
    }, [inventoryItems, emailBookings, filterList, filterPosition, startDate, endDate]);

    // Booked & Pending Streams
    const filteredBookings = useMemo(() => {
        let filtered = emailBookings;

        if (filterList !== 'ALL') filtered = filtered.filter(b => b.audioTargetId === filterList);
        
        if (filterPosition !== 'ALL') {
            filtered = filtered.filter(b => {
                const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                return details.emailPosition === filterPosition;
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
    }, [emailBookings, filterList, filterPosition, startDate, endDate]);

    const confirmedBookings = filteredBookings.filter(b => b.status === 'CONFIRMED');
    const reservedBookings = filteredBookings.filter(b => b.status === 'RESERVED');

    // Calendar Events
    const events = useMemo(() => {
        const evts: any[] = [];
        filteredBookings.forEach(b => {
            const isReserved = b.status === 'RESERVED';
            const dates = b.emailDates ? (typeof b.emailDates === 'string' ? JSON.parse(b.emailDates) : b.emailDates) : [];
            const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
            const pos = details.emailPosition ? ` [${details.emailPosition}]` : '';
            
            if (dates.length > 0) {
                dates.forEach((dStr: string) => {
                    evts.push({
                        id: `${b.id}-${dStr}`,
                        title: `${isReserved ? '⚠️ ' : ''}${b.clientName} - ${b.campaignName}${pos}`,
                        start: new Date(dStr),
                        end: new Date(new Date(dStr).setHours(23, 59, 59)),
                        resource: b,
                        style: { backgroundColor: isReserved ? 'var(--warning)' : 'var(--primary-glow)', color: isReserved ? 'black' : 'white' }
                    });
                });
            } else {
                evts.push({
                    id: b.id,
                    title: `${isReserved ? '⚠️ ' : ''}${b.clientName} - ${b.campaignName}${pos}`,
                    start: new Date(b.startDate),
                    end: new Date(new Date(b.endDate).setHours(23, 59, 59)),
                    resource: b,
                    style: { backgroundColor: isReserved ? 'var(--warning)' : 'var(--primary-glow)', color: isReserved ? 'black' : 'white' }
                });
            }
        });
        return evts;
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mailing List / Newsletter</label>
                    <select value={filterList} onChange={e => setFilterList(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', minWidth: '150px' }}>
                        <option value="ALL">All Newsletters</option>
                        {inventoryItems.filter(i => i.type === 'ADS_IN_ESEND' || i.type === 'BESPOKE_ESEND').map(i => (
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Position</label>
                    <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)', minWidth: '120px' }}>
                        <option value="ALL">All Positions</option>
                        <option value="TOP">Top Banner</option>
                        <option value="MID">Mid Content</option>
                        <option value="BOTTOM">Bottom Banner</option>
                    </select>
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setDisplayMode('OVERVIEW')} className={displayMode === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'OVERVIEW' ? 'var(--primary-glow)' : 'transparent', color: 'white' }}>
                        Overview
                    </button>
                    <button onClick={() => setDisplayMode('CALENDAR')} className={displayMode === 'CALENDAR' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'CALENDAR' ? 'var(--primary-glow)' : 'transparent', color: 'white' }}>
                        Calendar
                    </button>
                </div>
            </div>

            {displayMode === 'OVERVIEW' ? (
                <>
                    {/* Available Inventory Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Available Sends / Slots</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {availableLists.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)' }}>No E-sends inventory items found.</div>
                            ) : availableLists.map(item => (
                                <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: '4px solid var(--primary-glow)' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.2rem' }}>{item.name}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                                    </div>
                                    
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.available > 0 ? 'var(--success)' : 'var(--danger)', marginBottom: '0.2rem' }}>
                                        {item.available.toLocaleString()} <span style={{fontSize: '0.8rem', fontWeight: 400}}>Daily</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                        Available {item.unit}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem',marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                        <span>Total Limit: {item.totalCapacity.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending / Reserved Highlights */}
                    {reservedBookings.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--warning, #eab308)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>⚠️</span> Pending & Reserved E-Sends
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {reservedBookings.map(b => {
                                    const dates = b.emailDates ? (typeof b.emailDates === 'string' ? JSON.parse(b.emailDates) : b.emailDates) : [];
                                    const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                                    return (
                                        <div key={b.id} onClick={() => setSelectedBooking(b)} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--warning)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.25rem' }}>Awaiting Assets</div>
                                            <div style={{ fontWeight: 600 }}>{b.campaignName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{b.clientName}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span>{dates.length} Sends</span>
                                                <span>{details.emailPosition || 'Any Position'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Booked E-Sends List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Booked E-sends</h3>
                        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Campaign</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Newsletter</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sent Dates</th>
                                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {confirmedBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No confirmed e-sends found.
                                            </td>
                                        </tr>
                                    ) : (
                                        confirmedBookings.map((b) => {
                                            const dates = b.emailDates ? (typeof b.emailDates === 'string' ? JSON.parse(b.emailDates) : b.emailDates) : [];
                                            const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
                                            
                                            // Simulated Performance Data
                                            let sentVol = 0;
                                            let clicks = 0;
                                            const isPast = new Date(b.endDate).getTime() < new Date().getTime();
                                            if (isPast) {
                                                // Create stable simulated numbers based on their string
                                                sentVol = Math.abs(b.clientName.length * 12500 + dates.length * 5200);
                                                clicks = Math.floor(sentVol * 0.025); // ~2.5% CTR
                                            }

                                            return (
                                                <tr key={b.id} onClick={() => setSelectedBooking(b)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} className="hover-row">
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{b.clientName}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.campaignName}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div>{b.audioTargetId ? getTargetName(b.audioTargetId) : 'Run of Network'}</div>
                                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginTop: '0.25rem', display: 'inline-block' }}>
                                                            {details.emailPosition || (b.bookingType === 'ADS_IN_ESEND' ? 'Ad Slot' : 'Bespoke')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontSize: '0.85rem' }}>{dates.slice(0, 3).join(', ')}</div>
                                                        {dates.length > 3 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{dates.length - 3} more days</div>}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {isPast ? (
                                                            <>
                                                                <div style={{ fontWeight: 600, color: 'var(--success)' }}>{sentVol.toLocaleString()} Sends</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{clicks.toLocaleString()} Clicks / {(clicks/sentVol*100).toFixed(1)}% CTR</div>
                                                            </>
                                                        ) : (
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600 }}>Awaiting Delivery</div>
                                                        )}
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
