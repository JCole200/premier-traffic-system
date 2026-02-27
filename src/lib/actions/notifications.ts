import prisma from '../prisma';
import { sendBookingEmail } from '../email'; // Reusing email logic if possible, or we could add specific templates

export async function cleanUpExpiredReservations() {
    console.log('Running cleanup for expired reservations...');
    const now = new Date();

    const expired = await prisma.booking.findMany({
        where: {
            status: 'RESERVED',
            expiresAt: { lt: now }
        }
    });

    for (const booking of expired) {
        console.log(`Cancelling expired reservation: ${booking.id} (${booking.clientName})`);
        await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CANCELLED' }
        });

        // Log it
        await (prisma as any).auditLog.create({
            data: {
                bookingId: booking.id,
                action: 'UPDATE',
                field: 'status',
                oldValue: 'RESERVED',
                newValue: 'CANCELLED',
                changedBy: 'System - Expiry Timer'
            }
        });
    }

    return expired.length;
}

export async function processAutomatedAlerts() {
    console.log('Processing automated alerts...');
    const now = new Date();
    const results = {
        endAlerts: 0,
        copyReminders: 0
    };

    // 1. Campaign End Alerts (7 days before end)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const endingSoon = await prisma.booking.findMany({
        where: {
            status: 'CONFIRMED',
            endDate: { lte: sevenDaysFromNow, gte: now },
            lastAlertSentAt: null // Only send once for now
        }
    });

    for (const booking of endingSoon) {
        console.log(`Sending campaign end alert for: ${booking.id}`);
        // In a real system, we'd send a specific "End Alert" email
        // For now, we'll mark it as sent
        await prisma.booking.update({
            where: { id: booking.id },
            data: { lastAlertSentAt: now }
        });
        results.endAlerts++;
    }

    // 2. Copy-Chasing Reminders
    // Logic: If booking starts in < 5 days and copyStatus is 'PENDING'
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(now.getDate() + 5);

    const needsCopy = await prisma.booking.findMany({
        where: {
            status: { in: ['CONFIRMED', 'RESERVED'] },
            startDate: { lte: fiveDaysFromNow, gte: now },
            additionalDetails: { contains: '"copyStatus":"PENDING"' }
        }
    });

    for (const booking of needsCopy) {
        // Only remind every 2 days
        const lastSent = booking.lastAlertSentAt;
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(now.getDate() - 2);

        if (!lastSent || lastSent < twoDaysAgo) {
            console.log(`Sending copy chasing reminder for: ${booking.id}`);
            // Logic to send email here...

            await prisma.booking.update({
                where: { id: booking.id },
                data: { lastAlertSentAt: now }
            });
            results.copyReminders++;
        }
    }

    return results;
}
