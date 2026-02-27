import prisma from './prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSunday, parseISO, format } from 'date-fns';

type ValidationResult = { valid: boolean; error?: string };

// Lists with 1/month limit
const MONTHLY_LIMIT_LISTS = [
    'Marketplace', 'Jobsearch', 'Magazines', 'Impact/Fundraising', 'E-appeal', 'United Prayer'
];

export async function validateBookingRules(
    department: string,
    bookingType: string,
    category: string,
    dateStrings: string[],
    emailLists: string[] = [] // Lists selected for this booking
): Promise<ValidationResult> {

    // Only apply these complex rules to BESPOKE_ESEND
    if (bookingType !== 'BESPOKE_ESEND' && bookingType !== 'ADS_IN_ESEND') {
        // We might want to apply category rules to all types later, 
        // but for now strictly following the e-send logic.
        // Actually, category conflicts should probably apply to any booking that uses specific dates.
    }

    // 1. Check Sunday Rule
    for (const dateStr of dateStrings) {
        if (isSunday(parseISO(dateStr))) {
            return { valid: false, error: `Bookings are not allowed on Sundays (${dateStr}).` };
        }
    }

    // 2. Check Exclusivity (Department Clash)
    if (bookingType === 'BESPOKE_ESEND') {
        for (const dateStr of dateStrings) {
            const conflictingBookings = await prisma.booking.findMany({
                where: {
                    bookingType: 'BESPOKE_ESEND',
                    emailDates: { contains: dateStr },
                    department: { not: department },
                    status: { in: ['CONFIRMED', 'RESERVED'] }
                }
            });

            if (conflictingBookings.length > 0) {
                const conflict = conflictingBookings[0];
                return {
                    valid: false,
                    error: `Date ${dateStr} is already booked by ${conflict.department}. Sales and Marketing/Fundraising cannot book the same day.`
                };
            }
        }
    }

    // 3. Check Weekly Limit for SALES (2 per week)
    if (department === 'SALES' && bookingType === 'BESPOKE_ESEND') {
        const weeksToCheck = new Set<string>();
        for (const d of dateStrings) weeksToCheck.add(startOfWeek(parseISO(d)).toISOString());

        for (const weekStartStr of Array.from(weeksToCheck)) {
            const weekStart = new Date(weekStartStr);
            const weekEnd = endOfWeek(weekStart);

            const salesBookings = await prisma.booking.findMany({
                where: {
                    department: 'SALES',
                    bookingType: 'BESPOKE_ESEND',
                    status: { in: ['CONFIRMED', 'RESERVED'] }
                }
            });

            let weeklyCount = 0;
            for (const b of salesBookings) {
                if (!b.emailDates) continue;
                const dates = JSON.parse(b.emailDates) as string[];
                for (const d of dates) {
                    const dateObj = parseISO(d);
                    if (dateObj >= weekStart && dateObj <= weekEnd) weeklyCount++;
                }
            }

            let requestCountInWeek = 0;
            for (const d of dateStrings) {
                const dateObj = parseISO(d);
                if (dateObj >= weekStart && dateObj <= weekEnd) requestCountInWeek++;
            }

            if (weeklyCount + requestCountInWeek > 2) {
                return {
                    valid: false,
                    error: `Sales limited to 2 E-sends per week. week of ${format(weekStart, 'MMM do')} already has ${weeklyCount}.`
                };
            }
        }
    }

    // 4. Monthly List Limits
    const constrainedLists = emailLists.filter(l => MONTHLY_LIMIT_LISTS.some(restricted => l.includes(restricted)));

    if (constrainedLists.length > 0) {
        for (const listName of constrainedLists) {
            const monthsToCheck = new Set<string>();
            for (const d of dateStrings) monthsToCheck.add(startOfMonth(parseISO(d)).toISOString());

            for (const monthStartStr of Array.from(monthsToCheck)) {
                const monthStart = new Date(monthStartStr);
                const monthEnd = endOfMonth(monthStart);

                const existing = await prisma.booking.findMany({
                    where: {
                        bookingType: 'BESPOKE_ESEND',
                        additionalDetails: { contains: listName },
                        status: { in: ['CONFIRMED', 'RESERVED'] }
                    }
                });

                for (const b of existing) {
                    if (!b.emailDates) continue;
                    const dates = JSON.parse(b.emailDates) as string[];
                    const intersectsMonth = dates.some(d => {
                        const time = parseISO(d).getTime();
                        return time >= monthStart.getTime() && time <= monthEnd.getTime();
                    });

                    if (intersectsMonth) {
                        return {
                            valid: false,
                            error: `List '${listName}' is limited to 1 send per month. Already booked in ${format(monthStart, 'MMM yyyy')}.`
                        };
                    }
                }

                let requestCountInMonth = 0;
                for (const d of dateStrings) {
                    const time = parseISO(d).getTime();
                    if (time >= monthStart.getTime() && time <= monthEnd.getTime()) requestCountInMonth++;
                }
                if (requestCountInMonth > 1) {
                    return { valid: false, error: `List '${listName}' is limited to 1 send per month. You selected ${requestCountInMonth} dates.` };
                }
            }
        }
    }

    // 5. Dynamic Category Conflict Rules
    const dynamicRules = await (prisma as any).bookingRule.findMany({
        where: { isActive: true, category: category }
    });

    for (const rule of dynamicRules) {
        const conflictCategories = JSON.parse(rule.conflictsWith) as string[];
        const allRelevantCategories = Array.from(new Set([category, ...conflictCategories]));

        for (const dateStr of dateStrings) {
            const conflicts = await prisma.booking.findMany({
                where: {
                    status: { in: ['CONFIRMED', 'RESERVED'] },
                    category: { in: allRelevantCategories },
                    emailDates: { contains: dateStr }
                }
            });

            if (conflicts.length >= rule.maxDaily) {
                return {
                    valid: false,
                    error: `Rule Conflict: "${rule.name}". Category ${category} is limited to ${rule.maxDaily} daily total including: ${conflictCategories.join(', ')}. Found ${conflicts.length} existing.`
                };
            }
        }
    }

    return { valid: true };
}
