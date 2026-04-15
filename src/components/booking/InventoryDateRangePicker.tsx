'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isBefore, startOfDay } from 'date-fns';

interface Props {
    bookingType: string;
    targetId: string;
    inventoryItems: any[];
    bookings: any[];
    selectedStartDate: string | null;
    selectedEndDate: string | null;
    onDateSelect: (start: string, end: string) => void;
}

export default function InventoryDateRangePicker({ 
    bookingType, 
    targetId, 
    inventoryItems, 
    bookings, 
    selectedStartDate, 
    selectedEndDate,
    onDateSelect 
}: Props) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [selectionStep, setSelectionStep] = useState<0 | 1>(0); // 0 = picking start, 1 = picking end
    const [tempStart, setTempStart] = useState<string | null>(selectedStartDate);

    // Filter relevant inventory limit
    const targetItem = useMemo(() => {
        return inventoryItems.find(i => i.id === targetId);
    }, [inventoryItems, targetId]);

    // Precalculate daily utilization for active month
    const dailyCapacities = useMemo(() => {
        if (!targetItem) return new Map();
        
        const days = eachDayOfInterval({ start: currentMonth, end: endOfMonth(currentMonth) });
        const caps = new Map<string, { available: number, pctUsed: number }>();

        // Find bookings mapping to this target
        const relevantBookings = bookings.filter(b => 
            b.bookingType === bookingType && 
            (b.audioTargetId === targetId || !b.audioTargetId) &&
            b.status !== 'CANCELLED'
        );

        days.forEach(day => {
            const dayTime = day.getTime();
            let bookedVolume = 0;

            relevantBookings.forEach(b => {
                const bStart = startOfDay(new Date(b.startDate)).getTime();
                const bEnd = startOfDay(new Date(b.endDate)).getTime();
                
                if (dayTime >= bStart && dayTime <= bEnd) {
                    // For single-pool logic over a range, exact daily distribution is tricky if they booked 50k over a month.
                    // For a visual calendar, we usually estimate daily utilization: (total / days).
                    // Or if TotalCapacity represents the overall pool, we just check total overlap.
                    // Let's assume if it overlaps, it consumes a portion or we just do simple count.
                    // Actually, if it's Audio/Display stream, total capacity is often per month or indefinite global pool.
                    // The prompt asked for "shows sold out inventory in red, green available".
                    // Let's simulate daily pressure by mapping daily active campaigns.
                    bookedVolume += (b.audioSpots || b.displayImpressions || 0) / (Math.max(1, (bEnd - bStart)/86400000));
                }
            });

            // Very rough estimate of daily max if total is monthly (e.g. 200,000 / 30 = ~6600 a day)
            const dailyMax = targetItem.totalCapacity / 30;
            const pctUsed = dailyMax > 0 ? (bookedVolume / dailyMax) * 100 : 0;
            const available = Math.max(0, dailyMax - bookedVolume);

            caps.set(format(day, 'yyyy-MM-dd'), { available, pctUsed });
        });

        return caps;
    }, [currentMonth, targetItem, bookings, bookingType, targetId]);

    const handleDayClick = (dayStr: string) => {
        if (selectionStep === 0) {
            setTempStart(dayStr);
            setSelectionStep(1);
            onDateSelect(dayStr, dayStr); // Temporary instant feedback
        } else {
            // Picking end date
            const s = new Date(tempStart!).getTime();
            const e = new Date(dayStr).getTime();
            
            if (e < s) {
                // If they clicked before start, restart selection
                setTempStart(dayStr);
                setSelectionStep(1);
                onDateSelect(dayStr, dayStr);
            } else {
                onDateSelect(tempStart!, dayStr);
                setSelectionStep(0); // Reset for next time they click
            }
        }
    };

    // Calendar UI Building
    const renderCalendar = () => {
        const days = eachDayOfInterval({ start: currentMonth, end: endOfMonth(currentMonth) });
        const startOffset = getDay(days[0]); // 0 = Sunday
        const blanks = Array.from({ length: startOffset === 0 ? 6 : startOffset - 1 }); // Force Monday start

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{d}</div>
                ))}
                
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}

                {days.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const cap = dailyCapacities.get(dayStr) || { available: 0, pctUsed: 0 };
                    const isPast = isBefore(day, startOfDay(new Date()));
                    
                    let bg = 'rgba(255,255,255,0.05)';
                    let border = '1px solid transparent';
                    
                    if (!isPast && targetItem) {
                        if (cap.pctUsed >= 95) bg = 'rgba(239, 68, 68, 0.2)'; // RED - Sold Out
                        else if (cap.pctUsed >= 75) bg = 'rgba(249, 115, 22, 0.2)'; // ORANGE - Nearing
                        else bg = 'rgba(34, 197, 94, 0.1)'; // GREEN - Available
                    }

                    // Selection highlighting
                    const isStart = dayStr === selectedStartDate;
                    const isEnd = dayStr === selectedEndDate;
                    const ds = selectedStartDate ? new Date(selectedStartDate).getTime() : 0;
                    const de = selectedEndDate ? new Date(selectedEndDate).getTime() : 0;
                    const dt = day.getTime();
                    
                    const isBetween = ds && de && dt > ds && dt < de;

                    if (isStart || isEnd) border = '2px solid var(--accent-cyan)';
                    if (isBetween) bg = 'rgba(6, 182, 212, 0.3)'; // Highlight selection range

                    return (
                        <div 
                            key={dayStr}
                            onClick={() => !isPast && handleDayClick(dayStr)}
                            style={{
                                padding: '0.5rem 0',
                                borderRadius: '6px',
                                background: bg,
                                border: border,
                                cursor: isPast ? 'not-allowed' : 'pointer',
                                opacity: isPast ? 0.3 : 1,
                                fontSize: '0.9rem',
                                transition: 'all 0.1s'
                            }}
                            title={`Available: ${(cap.available || 0).toFixed(0)} / Used: ${(cap.pctUsed || 0).toFixed(1)}%`}
                        >
                            {format(day, 'd')}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>◀</button>
                <div style={{ fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy')}</div>
                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>▶</button>
            </div>
            
            {renderCalendar()}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '10px', height: '10px', background: 'rgba(34, 197, 94, 0.5)', borderRadius: '50%' }}></span> Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '10px', height: '10px', background: 'rgba(249, 115, 22, 0.5)', borderRadius: '50%' }}></span> Nearing Capacity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '10px', height: '10px', background: 'rgba(239, 68, 68, 0.5)', borderRadius: '50%' }}></span> Sold Out</div>
            </div>
        </div>
    );
}
