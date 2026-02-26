'use client';

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import EditBookingModal from '../calendar/EditBookingModal';
import InventoryCard from './InventoryCard';

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

interface MasterViewDashboardProps {
    initialBookings: any[];
    inventoryItems: any[];
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: any;
    style: { backgroundColor: string };
}

export default function MasterViewDashboard({ initialBookings, inventoryItems }: MasterViewDashboardProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [displayMode, setDisplayMode] = useState<'CALENDAR' | 'YEAR' | 'REPORT'>('CALENDAR');
    const [searchQuery, setSearchQuery] = useState('');

    // Stats Calculation
    const stats = useMemo(() => {
        const now = new Date();
        let totalBooked = 0;
        let totalDelivered = 0;
        let totalCapacity = 0;

        // Filter bookings by type if not ALL
        const filteredBookings = filterType === 'ALL'
            ? initialBookings
            : initialBookings.filter(b => b.bookingType === filterType || (filterType === 'EMAIL' && (b.bookingType === 'BESPOKE_ESEND' || b.bookingType === 'ADS_IN_ESEND')));

        // Filter inventory by type
        const filteredItems = filterType === 'ALL'
            ? inventoryItems
            : inventoryItems.filter(i => i.type === filterType);

        totalCapacity = filteredItems.reduce((acc, i) => acc + i.totalCapacity, 0);

        filteredBookings.forEach(b => {
            const bookedAmount = (b.audioSpots || 0) + (b.displayImpressions || 0) + (b.emailDates ? (Array.isArray(JSON.parse(b.emailDates)) ? JSON.parse(b.emailDates).length : 0) : 0);
            totalBooked += bookedAmount;

            // Simple delivery simulation
            const start = new Date(b.startDate);
            const end = new Date(b.endDate);
            if (now > end) {
                totalDelivered += bookedAmount;
            } else if (now > start) {
                const totalDuration = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const delivered = (elapsed / totalDuration) * bookedAmount;
                totalDelivered += Math.floor(delivered);
            }
        });

        const totalAvailable = totalCapacity - totalBooked;

        return {
            booked: totalBooked,
            delivered: totalDelivered,
            available: totalAvailable,
            bookedPct: totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0,
            deliveredPct: totalBooked > 0 ? (totalDelivered / totalBooked) * 100 : 0,
            availablePct: totalCapacity > 0 ? (totalAvailable / totalCapacity) * 100 : 0,
        };
    }, [initialBookings, inventoryItems, filterType]);

    // Calendar Events
    const events = useMemo<CalendarEvent[]>(() => {
        let filtered = initialBookings;

        if (filterType !== 'ALL') {
            filtered = filtered.filter(b => {
                if (b.bookingType) {
                    if (filterType === 'AUDIO') return b.bookingType === 'AUDIO';
                    if (filterType === 'DISPLAY') return b.bookingType === 'DISPLAY';
                    if (filterType === 'EMAIL') return b.bookingType === 'BESPOKE_ESEND' || b.bookingType === 'ADS_IN_ESEND';
                }
                return true;
            });
        }

        if (filterCategory !== 'ALL') {
            filtered = filtered.filter(b => b.category === filterCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.clientName?.toLowerCase().includes(q) ||
                b.campaignName?.toLowerCase().includes(q) ||
                b.contractNumber?.toLowerCase().includes(q)
            );
        }

        return filtered.map(b => {
            let color = 'var(--primary)';
            if (b.category === 'GIFT') color = 'var(--accent-cyan)';
            if (b.category === 'FILLER') color = 'var(--text-dim)';
            if (b.category === 'INTERNAL') color = 'var(--accent-pink)';

            return {
                id: b.id,
                title: `${b.clientName} - ${b.campaignName} (${b.category || 'PAID'})`,
                start: new Date(b.startDate),
                end: new Date(b.endDate),
                resource: b,
                style: { backgroundColor: color }
            };
        });
    }, [initialBookings, filterType, filterCategory, searchQuery]);

    const eventPropGetter = (event: CalendarEvent) => ({
        style: {
            backgroundColor: event.style.backgroundColor,
            borderRadius: '6px',
            opacity: 0.9,
            color: 'white',
            border: 'none',
            display: 'block',
            padding: '2px 5px',
            fontSize: '0.8rem'
        }
    });

    const months = eachMonthOfInterval({
        start: startOfYear(date),
        end: endOfYear(date)
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Stats Overview */}
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <InventoryCard
                    title="Total Booked"
                    metric={stats.booked.toLocaleString()}
                    subtext="Confirmed Inventory"
                    percentage={stats.bookedPct}
                    color="var(--primary)"
                />
                <InventoryCard
                    title="Available Inventory"
                    metric={stats.available.toLocaleString()}
                    subtext="Real-time Availability"
                    percentage={stats.availablePct}
                    color="var(--success)"
                />
                <InventoryCard
                    title="Delivered So Far"
                    metric={stats.delivered.toLocaleString()}
                    subtext="Simulated Fulfillment"
                    percentage={stats.deliveredPct}
                    color="var(--accent-cyan)"
                />
            </div>

            {/* Controls */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setDisplayMode('CALENDAR')}
                        className={displayMode === 'CALENDAR' ? 'btn-primary' : ''}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'CALENDAR' ? 'var(--primary)' : 'transparent' }}
                    >Calendar</button>
                    <button
                        onClick={() => setDisplayMode('YEAR')}
                        className={displayMode === 'YEAR' ? 'btn-primary' : ''}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'YEAR' ? 'var(--primary)' : 'transparent' }}
                    >Year</button>
                    <button
                        onClick={() => setDisplayMode('REPORT')}
                        className={displayMode === 'REPORT' ? 'btn-primary' : ''}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: displayMode === 'REPORT' ? 'var(--primary)' : 'transparent' }}
                    >Daily Allocation</button>
                </div>

                <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }}></div>

                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="ALL">All Products</option>
                    <option value="AUDIO">Streaming & Podcast</option>
                    <option value="DISPLAY">Digital Display</option>
                    <option value="EMAIL">E-sends</option>
                </select>

                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="ALL">All Categories</option>
                    <option value="PAID">Paid</option>
                    <option value="GIFT">Gifting</option>
                    <option value="FILLER">Filler</option>
                    <option value="INTERNAL">Internal</option>
                </select>

                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-subtle)',
                            width: '200px',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>

                <div style={{ flex: 1 }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn-icon-circle" onClick={() => {
                        if (displayMode === 'CALENDAR') setDate(subMonths(date, 1));
                        else setDate(new Date(date.getFullYear() - 1, 0, 1));
                    }}>←</button>
                    <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
                        {displayMode === 'CALENDAR' ? format(date, 'MMMM yyyy') : date.getFullYear()}
                    </span>
                    <button className="btn-icon-circle" onClick={() => {
                        if (displayMode === 'CALENDAR') setDate(addMonths(date, 1));
                        else setDate(new Date(date.getFullYear() + 1, 0, 1));
                    }}>→</button>
                </div>
                <button
                    onClick={() => setDate(new Date('2020-01-01'))} // Symbolic for "All Time"
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', fontSize: '0.8rem' }}
                >Show All Dates</button>
            </div>

            {/* Main Content Area */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '1.5rem', minHeight: '600px' }}>
                {displayMode === 'CALENDAR' && (
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
                        toolbar={false}
                    />
                )}

                {displayMode === 'YEAR' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {months.map(m => {
                            const monthBookings = events.filter(e => isSameMonth(e.start, m));

                            return (
                                <div key={m.getTime()} className="glass-panel" style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    border: isSameMonth(new Date(), m) ? '1px solid var(--primary)' : '1px solid var(--border-subtle)'
                                }}>
                                    <h4 style={{ marginBottom: '1rem', color: isSameMonth(new Date(), m) ? 'var(--primary)' : 'inherit' }}>
                                        {format(m, 'MMMM')}
                                    </h4>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                        {monthBookings.length}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bookings</div>

                                    <div style={{ marginTop: '1.5rem', position: 'relative', height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px', justifyContent: 'center' }}>
                                        {/* Simple mini-bar chart for categories */}
                                        {['PAID', 'GIFT', 'FILLER', 'INTERNAL'].map(cat => {
                                            const catCount = monthBookings.filter(e => e.resource.category === cat).length;
                                            const height = Math.max(4, (catCount / 10) * 40);
                                            let color = 'var(--primary)';
                                            if (cat === 'GIFT') color = 'var(--accent-cyan)';
                                            if (cat === 'FILLER') color = 'var(--text-dim)';
                                            if (cat === 'INTERNAL') color = 'var(--accent-pink)';

                                            return (
                                                <div key={cat} style={{ width: '12px', height: `${height}px`, background: color, borderRadius: '2px' }} title={`${cat}: ${catCount}`}></div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {displayMode === 'REPORT' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem' }}>Daily Resource Allocation (Real-time)</h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Showing average distribution for {format(date, 'MMMM yyyy')}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {inventoryItems.filter(i => filterType === 'ALL' || i.type === filterType).map(item => {
                                const dailyCap = Math.floor(item.totalCapacity / 30);
                                const itemBookings = initialBookings.filter(b => b.audioTargetId === item.id || (item.type === 'DISPLAY' && b.bookingType === 'DISPLAY') || (item.type === 'EMAIL' && (b.bookingType === 'BESPOKE_ESEND' || b.bookingType === 'ADS_IN_ESEND')));
                                const totalItemBooked = itemBookings.reduce((acc, b) => acc + (b.audioSpots || b.displayImpressions || (b.emailDates ? JSON.parse(b.emailDates).length : 0)), 0);
                                const avgBooked = Math.floor(totalItemBooked / 30);
                                const usedPct = Math.min(100, (avgBooked / dailyCap) * 100);

                                return (
                                    <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                                            <span style={{ fontSize: '0.8rem', color: usedPct > 80 ? 'var(--danger)' : 'var(--success)' }}>
                                                {usedPct.toFixed(0)}% Sold
                                            </span>
                                        </div>

                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                                            <div style={{ width: `${usedPct}%`, height: '100%', background: usedPct > 80 ? 'var(--danger)' : 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)' }}>Daily Capacity</div>
                                                <div style={{ fontWeight: 600 }}>{dailyCap.toLocaleString()}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'var(--text-muted)' }}>Daily Available</div>
                                                <div style={{ fontWeight: 600 }}>{Math.max(0, dailyCap - avgBooked).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {
                selectedBooking && (
                    <EditBookingModal
                        booking={selectedBooking}
                        onClose={() => setSelectedBooking(null)}
                    />
                )
            }
        </div >
    );
}
