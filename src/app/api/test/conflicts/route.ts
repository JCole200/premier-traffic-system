import { NextResponse } from 'next/server';
import { createBooking, updateBooking } from '@/lib/actions/booking';
import { createBookingRule, deleteBookingRule, getBookingRules } from '@/lib/actions/rules';
import prisma from '@/lib/prisma';

export async function GET() {
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Blocked' }, { status: 403 });

    const logs: string[] = [];
    let ruleId = '';

    try {
        const testDate = '2027-04-01';

        // 1. Cleanup old test data
        await prisma.booking.deleteMany({
            where: {
                OR: [
                    { startDate: new Date(`${testDate}T00:00:00Z`) },
                    { campaignName: { startsWith: 'TEST' } }
                ]
            }
        });
        
        const rules = await getBookingRules();
        for (const r of rules) {
            if (r.name.includes('TEST')) await deleteBookingRule(r.id);
        }

        const rule = await createBookingRule({
            name: 'TEST RULE: PAID+GIFT CONFLICT',
            category: 'PAID',
            conflictsWith: ['GIFT'],
            maxDaily: 1,
            bookingType: 'ANY'
        });
        ruleId = rule.id;
        logs.push(`Rule created: ${rule.name}`);

        // 2. Create first booking (PAID)
        const b1 = await createBooking({
            clientName: 'PAID CLIENT',
            campaignName: 'TEST 1',
            startDate: testDate,
            endDate: testDate,
            category: 'PAID',
            status: 'CONFIRMED',
            bookingType: 'AUDIO',
            geoTarget: 'GLOBAL',
            bookerName: 'Tester'
        });
        logs.push(`Booking 1 (PAID) created: ${b1.id}`);

        // 3. Try to create second booking (GIFT) - SHOULD FAIL
        try {
            await createBooking({
                clientName: 'GIFT CLIENT',
                campaignName: 'TEST 2',
                startDate: testDate,
                endDate: testDate,
                category: 'GIFT',
                status: 'CONFIRMED',
                bookingType: 'DISPLAY',
                geoTarget: 'GLOBAL',
                bookerName: 'Tester'
            });
            logs.push('❌ ERROR: Booking 2 (GIFT) was created but should have been blocked!');
        } catch (e: any) {
            logs.push(`✅ SUCCESS: Booking 2 blocked as expected: ${e.message}`);
        }

        // 4. Try updating a different booking to trigger conflict - SHOULD FAIL
        const b3 = await createBooking({
            clientName: 'INTERNAL CLIENT',
            campaignName: 'TEST 3',
            startDate: '2027-04-02',
            endDate: '2027-04-02',
            category: 'INTERNAL',
            status: 'CONFIRMED',
            bookingType: 'DISPLAY',
            geoTarget: 'GLOBAL',
            bookerName: 'Tester'
        });
        logs.push(`Booking 3 (INTERNAL) created on different date: ${b3.id}`);

        try {
            await updateBooking(b3.id, {
                startDate: testDate,
                endDate: testDate,
                category: 'GIFT'
            });
            logs.push('❌ ERROR: Booking 3 update was allowed but should have been blocked!');
        } catch (e: any) {
            logs.push(`✅ SUCCESS: Booking 3 update blocked: ${e.message}`);
        }

        return NextResponse.json({ success: true, logs });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, logs });
    } finally {
        // Cleanup if possible?
    }
}
