'use server';

import prisma from '../prisma';

export async function getMonthlyAvailability(type: string, year: number, month: number, targetId?: string) {
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
        const currentParams = new Date(Date.UTC(year, month - 1, d)).toISOString().split('T')[0];

        let dailyUsed = 0;

        // This is imperfect for Audio/Display as they are "Flight Based" not "Daily Based" strictly.
        // But for Email it works if we parse the specific dates.

        for (const b of bookings) {
            const bStart = b.startDate.toISOString().split('T')[0];
            const bEnd = b.endDate.toISOString().split('T')[0];

            // Check if this booking covers this day
            if (currentParams >= bStart && currentParams <= bEnd) {
                if (type === 'EMAIL' && b.emailDates) {
                    const specificDates = JSON.parse(b.emailDates);
                    if (specificDates.includes(currentParams)) {
                        dailyUsed += 1;
                    }
                } else if (type !== 'EMAIL') {
                    // For audio/display, we "Pace" the usage? Or just dump the whole bucket?
                    // Usually capacity is MONTHLY. Visualization per day is tricky.
                    // Let's just say "If booked in this month, show as 'Active'"
                    // This is a complex logic that exceeds a quick prototype.
                    // For now: Only effective for Email.
                }
            }
        }

        days[d] = {
            used: dailyUsed,
            available: capacity - dailyUsed,
            capacity: capacity
        };
    }

    return days;
}
