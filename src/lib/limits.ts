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
    dateStrings: string[],
    emailLists: string[] = [] // Lists selected for this booking
): Promise<ValidationResult> {

    // Only apply these complex rules to BESPOKE_ESEND
    if (bookingType !== 'BESPOKE_ESEND') return { valid: true };

    // 1. Check Sunday Rule
    for (const dateStr of dateStrings) {
        if (isSunday(parseISO(dateStr))) {
            return { valid: false, error: `Bookings are not allowed on Sundays (${dateStr}).` };
        }
    }

    // 2. Check Exclusivity (Department Clash)
    // If I am SALES, I checks for MARKETING or FUNDRAISING on these dates.
    // If I am MARKETING, I checks for SALES.
    for (const dateStr of dateStrings) {
        const conflictingBookings = await prisma.booking.findMany({
            where: {
                bookingType: 'BESPOKE_ESEND',
                emailDates: { contains: dateStr }, // Simple string check for checking the JSON array
                department: { not: department }, // Conflict with OTHER departments
                status: 'CONFIRMED'
            }
        });

        // "when there is a marketing booking, there cannot be a sales booking (or viceversa)"
        // This implies strict exclusivity between departments for the same day?
        // Let's assume yes for now based on the prompt.
        if (conflictingBookings.length > 0) {
            const conflict = conflictingBookings[0];
            return {
                valid: false,
                error: `Date ${dateStr} is already booked by ${conflict.department}. Sales and Marketing/Fundraising cannot book the same day.`
            };
        }
    }

    // 3. Check Weekly Limit for SALES (2 per week)
    if (department === 'SALES') {
        // Group requested dates by week
        const weeksToCheck = new Set<string>();
        for (const d of dateStrings) weeksToCheck.add(startOfWeek(parseISO(d)).toISOString());

        for (const weekStartStr of Array.from(weeksToCheck)) {
            const weekStart = new Date(weekStartStr);
            const weekEnd = endOfWeek(weekStart);

            // Fetch existing booking COUNT for this week
            // Since dates are stored as JSON arrays, we have to be careful.
            // Ideally we'd normalize, but for now we fetch all Sales bookings in range and count availability.
            // This is "heavy" filtering in CPU but fine for small scale.

            const salesBookings = await prisma.booking.findMany({
                where: {
                    department: 'SALES',
                    bookingType: 'BESPOKE_ESEND',
                    // Optimization: Overlap date range check to potential candidates
                    // Note: 'startDate/endDate' might not perfectly align with 'emailDates' if it spans multiple, but usually they do.
                    // We'll filter strictly in JS.
                    status: 'CONFIRMED'
                }
            });

            // Count how many individual E-sends (days) are already booked in this week
            let weeklyCount = 0;
            for (const b of salesBookings) {
                if (!b.emailDates) continue;
                const dates = JSON.parse(b.emailDates) as string[];
                for (const d of dates) {
                    const dateObj = parseISO(d);
                    if (dateObj >= weekStart && dateObj <= weekEnd) {
                        weeklyCount++;
                    }
                }
            }

            // Add CURRENT request count for this week
            let requestCountInWeek = 0;
            for (const d of dateStrings) {
                const dateObj = parseISO(d);
                if (dateObj >= weekStart && dateObj <= weekEnd) {
                    requestCountInWeek++;
                }
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
    // "1 e-send per month for each of the following: Marketplace..."
    // This applies if the CURRENT booking uses one of these lists.
    const constrainedLists = emailLists.filter(l => MONTHLY_LIMIT_LISTS.some(restricted => l.includes(restricted)));

    if (constrainedLists.length > 0) {
        for (const listName of constrainedLists) {
            // Check monthly usage for THIS list
            const monthsToCheck = new Set<string>();
            for (const d of dateStrings) monthsToCheck.add(startOfMonth(parseISO(d)).toISOString());

            for (const monthStartStr of Array.from(monthsToCheck)) {
                const monthStart = new Date(monthStartStr);
                const monthEnd = endOfMonth(monthStart);

                // Find bookings using this list in this month
                // We rely on JSON string search for list name in `additionalDetails`.
                const existing = await prisma.booking.findMany({
                    where: {
                        bookingType: 'BESPOKE_ESEND',
                        additionalDetails: { contains: listName }, // Heuristic
                        status: 'CONFIRMED'
                    }
                });

                for (const b of existing) {
                    if (!b.emailDates) continue;
                    const dates = JSON.parse(b.emailDates) as string[];
                    // If any date in that booking falls in this month, it counts as "1 e-send per month" usage?
                    // Or is it 1 DATE per month? "1 e-send" usually means 1 blast.
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

                // Also check self-consistency (cannot book 2 dates for Restricted List in same request if they are same month)
                // If request has 2 dates in same month for restricted list, fail.
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

    return { valid: true };
}
