'use server';

import prisma from '../prisma';

import { INVENTORY_BASELINES } from '../constants';

export async function getMonthlyAvailability(type: string, year: number, month: number, targetId?: string) {
    // 0. Auto-Seed if empty (Self-healing)
    const count = await prisma.inventoryItem.count();
    if (count === 0) {
        console.log('Database empty. Seeding default inventory...');
        console.log('Database empty. Seeding default inventory...');
        for (const item of INVENTORY_BASELINES) {
            await prisma.inventoryItem.create({ data: item });
        }
    }

    // 1. Determine Capacity
    let capacity = 0;
    if (targetId) {
        const item = await prisma.inventoryItem.findUnique({ where: { id: targetId } });
        capacity = item ? item.totalCapacity : 0;
    } else {
        const items = await prisma.inventoryItem.findMany({ where: { type } });
        capacity = items.reduce((acc: number, curr: { totalCapacity: number }) => acc + curr.totalCapacity, 0);
    }

    // 2. Fetch bookings for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const bookings = await prisma.booking.findMany({
        where: {
            status: 'CONFIRMED',
            OR: [
                {
                    startDate: { lte: endOfMonth },
                    endDate: { gte: startOfMonth }
                }
            ]
        }
    });

    // 3. Map to Days
    const days: Record<string, { used: number, available: number, capacity: number }> = {};
    const numDays = endOfMonth.getDate();

    for (let d = 1; d <= numDays; d++) {
        const currentDate = new Date(Date.UTC(year, month - 1, d));
        const currentParams = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getUTCDay(); // 0=Sun, 6=Sat

        let dailyUsed = 0;
        let dailyCapacity = capacity;

        // Apply Day-of-Week Logic for Ads in E-Sends
        if (type === 'ADS_IN_ESEND' && targetId) {
            if (targetId.includes('cty') || targetId.includes('wa')) {
                // Saturday only
                if (dayOfWeek !== 6) dailyCapacity = 0;
            } else if (targetId.includes('pg')) {
                // Friday only
                if (dayOfWeek !== 5) dailyCapacity = 0;
            } else if (targetId.includes('daily-content')) {
                // Mon-Fri
                if (dayOfWeek === 0 || dayOfWeek === 6) dailyCapacity = 0;
            }
            // Daily News, BSAK, Affiliate News are Mon-Sun (default capacity applies)
        }

        // Apply Logic for Bespoke E-Sends
        if (type === 'BESPOKE_ESEND' || type === 'EMAIL') { // 'EMAIL' is legacy/fallback type for Bespoke
            // 1. No Sundays
            if (dayOfWeek === 0) {
                dailyCapacity = 0;
            }

            // 2. Max 2 per week rule
            // We need to count how many Bespoke emails are already booked in this specific week (Mon-Sun)
            // Calculate start/end of this week
            const currentDayDate = new Date(Date.UTC(year, month - 1, d));
            const dayNum = currentDayDate.getUTCDay() || 7; // Make Sun=7
            const weekStart = new Date(currentDayDate);
            weekStart.setUTCDate(currentDayDate.getUTCDate() - dayNum + 1); // Monday
            const weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6); // Sunday

            const wStartStr = weekStart.toISOString().split('T')[0];
            const wEndStr = weekEnd.toISOString().split('T')[0];

            let weeklyUsedCount = 0;
            bookings.forEach(b => {
                if (b.bookingType === 'BESPOKE_ESEND' && b.emailDates) {
                    const dates = JSON.parse(b.emailDates);
                    // Check if any date in this booking falls in this week
                    for (const dateStr of dates) {
                        if (dateStr >= wStartStr && dateStr <= wEndStr) {
                            weeklyUsedCount++;
                        }
                    }
                }
            });

            if (weeklyUsedCount >= 2) {
                // formatting this to show '0 available' if cap is reached
                // Ideally if this specific day is ONE of the booked ones, it shows used=1, cap=1 (Red/Full)
                // If this day is free, but weekly limit reached, it shows used=0, available=0 (Red/Blocked)
                if (dailyUsed === 0) {
                    dailyCapacity = 0;
                }
            }
        }


        for (const b of bookings) {
            const bStart = b.startDate.toISOString().split('T')[0];
            const bEnd = b.endDate.toISOString().split('T')[0];

            // Check if this booking covers this day
            if (currentParams >= bStart && currentParams <= bEnd) {
                // Check Bespoke Email Usage
                if ((type === 'EMAIL' || type === 'BESPOKE_ESEND') && b.bookingType === 'BESPOKE_ESEND' && b.emailDates) {
                    const specificDates = JSON.parse(b.emailDates);
                    if (specificDates.includes(currentParams)) {
                        // Only count if it matches the generic availability or specific list?
                        // For now, simplify: if looking at global availability, count it.
                        // But usually we filter by targetId for specific lists.
                        // If targetId is provided, we only care if THIS booking used THIS list.
                        if (targetId && b.additionalDetails && (b.additionalDetails as any).emailLists) {
                            const lists = (b.additionalDetails as any).emailLists as string[];
                            // This is tricky because targetId map in constants doesn't exactly match string array in form.
                            // But for Bespoke we usually just look at dates.
                            // Let's assume for Bespoke we are looking at specific dates generally.
                            dailyUsed += 1;
                        }
                    }
                }

                // Check Ads in E-Send Usage
                else if (type === 'ADS_IN_ESEND' && b.bookingType === 'ADS_IN_ESEND' && b.emailDates) {
                    // Check if this booking matches the targetId we are looking at
                    // In booking form, we store "adsEmailType" which is a string label.
                    // We need to match that label to the targetId if possible, or reliance on filtering in step 2 (not done here yet). 
                    // Ideally, we should filter bookings by "resource" before counting.
                    // But since we fetch ALL bookings, we must check if THIS booking is for THIS target.

                    const details = b.additionalDetails as any;
                    const bookingTargetLabel = details?.adsEmailType; // e.g. "Voice of Hope"

                    // Simple Mapping check (Weakness: String matching)
                    // We need to ensure the booking actually saved the target ID or a consistent label.
                    // For now, let's count it if the date matches, assuming the caller filters bookings? 
                    // No, findMany gets all confirmed.

                    // Let's just check specific dates first.
                    const specificDates = JSON.parse(b.emailDates);
                    if (specificDates.includes(currentParams)) {
                        // Check if this booking is for the SAME target channel
                        // We need a way to know WHICH channel this booking used.
                        // Currently stored in 'additionalDetails.adsEmailType'.
                        // We need to match that to 'targetId'.

                        // If targetId is 'email-pg', booking label should be 'PG'.
                        // This suggests we need to standardize the storage of ID vs Label.
                        // For this iteration, I will assume we update BookingForm to store the ID!

                        if (bookingTargetLabel && targetId && targetId.includes(bookingTargetLabel.toLowerCase().replace(/ /g, '-'))) {
                            dailyUsed += 1;
                        } else if (!targetId) {
                            // Aggregate view?
                            dailyUsed += 1;
                        } else if (bookingTargetLabel === 'Voice of Hope' && targetId?.includes('bsak')) {
                            // Special case legacy mapping if needed, but let's try to fix input first.
                            dailyUsed += 1;
                        }

                        // Better approach: Check if additionalDetails.targetId exists (if we add it)
                        if (details?.targetId === targetId) {
                            dailyUsed += 1;
                        }
                    }
                }
            }
        }

        days[d] = {
            used: dailyUsed,
            available: Math.max(0, dailyCapacity - dailyUsed),
            capacity: dailyCapacity
        };
    }

    return days;
}
