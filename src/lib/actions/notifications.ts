import prisma from '../prisma';
import { sendAlert } from '../email';
import { ALERT_SCHEDULES } from '../constants';

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
        
        await prisma.$transaction([
            prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'CANCELLED' }
            }),
            (prisma as any).auditLog.create({
                data: {
                    bookingId: booking.id,
                    action: 'UPDATE',
                    field: 'status',
                    oldValue: 'RESERVED',
                    newValue: 'CANCELLED',
                    changedBy: 'System - Expiry Timer'
                }
            })
        ]);
    }

    return expired.length;
}

export async function processAutomatedAlerts() {
    console.log('Processing automated alerts...');
    const now = new Date();
    const alertEmail = process.env.ALERT_EMAIL || 'cristina.turlacu@premier.org.uk';
    const results = {
        endAlerts: 0,
        copyReminders: 0
    };

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Fetch all active bookings that might need alerts
    const activeBookings = await prisma.booking.findMany({
        where: {
            status: 'CONFIRMED',
            OR: [
                { lastAlertSentAt: null },
                { lastAlertSentAt: { lt: oneDayAgo } }
            ]
        } as any
    });

    for (const booking of activeBookings) {
        const b = booking as any;
        const startDate = new Date(b.startDate);
        const endDate = new Date(b.endDate);

        const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / 86400000);
        const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);

        // --- COPY-CHASING REMINDERS ---
        const details = b.additionalDetails ? JSON.parse(b.additionalDetails) : {};
        const isCopyPending = !details.copyStatus || details.copyStatus === 'PENDING';

        if (isCopyPending && daysUntilStart > 0) {
            // Check if we hit a milestone
            const milestone = ALERT_SCHEDULES.COPY_CHASE_DAYS.find(d => daysUntilStart <= d);
            // We only send if we are at or below a milestone. 
            // The 24h check in the query ensures we don't spam.
            if (milestone !== undefined) {
                console.log(`Sending copy-chase alert for ${b.clientName} (${daysUntilStart}d until start)`);
                
                const html = `
                    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                        <h2 style="color:#f59e0b;border-bottom:2px solid #f59e0b;padding-bottom:0.5rem;">📋 Copy Required</h2>
                        <p>Campaign going live in <strong>${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}</strong> — copy not yet received.</p>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                            <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Client</strong></td><td style="padding:0.5rem 1rem;">${b.clientName}</td></tr>
                            <tr><td style="padding:0.5rem 1rem;"><strong>Campaign</strong></td><td style="padding:0.5rem 1rem;">${b.campaignName}</td></tr>
                            <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Start Date</strong></td><td style="padding:0.5rem 1rem;color:#f59e0b;"><strong>${startDate.toLocaleDateString('en-GB')}</strong></td></tr>
                            <tr><td style="padding:0.5rem 1rem;"><strong>Type</strong></td><td style="padding:0.5rem 1rem;">${b.bookingType || 'N/A'}</td></tr>
                        </table>
                        <p>Please chase the client for ad copy immediately.</p>
                        <p style="font-size:0.8rem;color:#999;">Premier Traffic System · Copy-Chase Reminder</p>
                    </div>`;

                await sendAlert(alertEmail, `📋 Copy Needed (${daysUntilStart}d): ${b.clientName}`, html);
                await (prisma as any).booking.update({ where: { id: b.id }, data: { lastAlertSentAt: now } });
                results.copyReminders++;
                continue; // Move to next booking to avoid sending two alerts for same booking in one run
            }
        }

        // --- CAMPAIGN END ALERTS ---
        if (daysUntilEnd > 0) {
            const milestone = ALERT_SCHEDULES.CAMPAIGN_END_DAYS.find(d => daysUntilEnd <= d);
            if (milestone !== undefined) {
                console.log(`Sending campaign-end alert for ${b.clientName} (${daysUntilEnd}d until end)`);

                const html = `
                    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                        <h2 style="color:#6366f1;border-bottom:2px solid #6366f1;padding-bottom:0.5rem;">⏰ Campaign Ending Soon</h2>
                        <p><strong>${b.clientName}</strong> — ${b.campaignName}</p>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                            <tr style="background:#f5f5f5;"><td style="padding:0.5rem 1rem;"><strong>End Date</strong></td><td style="padding:0.5rem 1rem;color:#ef4444;"><strong>${endDate.toLocaleDateString('en-GB')}</strong></td></tr>
                            <tr><td style="padding:0.5rem 1rem;"><strong>Days Remaining</strong></td><td style="padding:0.5rem 1rem;">${daysUntilEnd}</td></tr>
                            <tr style="background:#f5f5f5;"><td style="padding:0.5rem 1rem;"><strong>Type</strong></td><td style="padding:0.5rem 1rem;">${b.bookingType || 'N/A'}</td></tr>
                        </table>
                        <p>Please confirm delivery or discuss renewal.</p>
                        <p style="font-size:0.8rem;color:#999;">Premier Traffic System · End-Date Alert</p>
                    </div>`;

                await sendAlert(alertEmail, `⏰ ${daysUntilEnd}d Left: ${b.clientName}`, html);
                await (prisma as any).booking.update({ where: { id: b.id }, data: { lastAlertSentAt: now } });
                results.endAlerts++;
            }
        }
    }

    return results;
}
