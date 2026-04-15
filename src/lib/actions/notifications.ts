import prisma from '../prisma';
import { sendAlert } from '../email';
import { ALERT_SCHEDULES } from '../constants';

const TRAFFIC_EMAIL = 'traffic@premier.org.uk'; // Generic central routing inbox

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
        
        // Notify Traffic of the auto-cancellation
        const html = `
            <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                <h2 style="color:#ef4444;border-bottom:2px solid #ef4444;padding-bottom:0.5rem;">❌ Reservation Auto-Cancelled</h2>
                <p>The 48-hour reservation window for <strong>${booking.clientName}</strong> (${booking.campaignName}) has expired. The inventory has been released back into the global pool.</p>
            </div>`;
        await sendAlert(TRAFFIC_EMAIL, `Reservation Expired: ¹${booking.clientName}`, html).catch(()=>null);
    }

    return expired.length;
}

export async function processAutomatedAlerts() {
    console.log('Processing advanced automated alerts (Copy / EOC / Low Inventory)...');
    const now = new Date();
    const results = {
        copyReminders: 0,
        endOfCampaignReports: 0,
        lowInventoryWarnings: 0
    };

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Fetch active/recent bookings
    const activeBookings = await prisma.booking.findMany({
        where: {
            status: { in: ['CONFIRMED', 'RESERVED'] },
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
        const daysSinceEnd = Math.ceil((now.getTime() - endDate.getTime()) / 86400000);

        // --- A: COPY-CHASING & PRE-LAUNCH REMINDERS ---
        const details = b.additionalDetails ? (typeof b.additionalDetails === 'string' ? JSON.parse(b.additionalDetails) : b.additionalDetails) : {};
        const isCopyPending = !details.copyStatus || details.copyStatus === 'PENDING';

        if (isCopyPending && daysUntilStart > 0 && daysUntilStart <= 7) {
            // Check milestones (e.g., 7 days, 3 days, 1 day)
            if (daysUntilStart === 7 || daysUntilStart === 3 || daysUntilStart === 1) {
                console.log(`Sending copy-chase alert for ${b.clientName} (${daysUntilStart}d until start)`);
                const html = `
                    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                        <h2 style="color:#f59e0b;border-bottom:2px solid #f59e0b;padding-bottom:0.5rem;">📋 Copy Required / Missing Creative</h2>
                        <p>Campaign going live in <strong>${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}</strong> — Creative assets are still marked as pending/missing.</p>
                        <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                            <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Client</strong></td><td style="padding:0.5rem 1rem;">${b.clientName}</td></tr>
                            <tr><td style="padding:0.5rem 1rem;"><strong>Campaign</strong></td><td style="padding:0.5rem 1rem;">${b.campaignName}</td></tr>
                            <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Start Date</strong></td><td style="padding:0.5rem 1rem;color:#f59e0b;"><strong>${startDate.toLocaleDateString('en-GB')}</strong></td></tr>
                            <tr><td style="padding:0.5rem 1rem;"><strong>Sales Exec</strong></td><td style="padding:0.5rem 1rem;">${b.bookerName || 'Unknown'}</td></tr>
                        </table>
                    </div>`;

                await sendAlert(TRAFFIC_EMAIL, `📋 Copy Needed (${daysUntilStart}d): ${b.clientName}`, html).catch(()=>null);
                await (prisma as any).booking.update({ where: { id: b.id }, data: { lastAlertSentAt: now } });
                results.copyReminders++;
                continue; 
            }
        }

        // --- B: END OF CAMPAIGN REPORTS ---
        if (daysSinceEnd === 1) {
            // Campaign ended yesterday. Fire End of Campaign report!
            console.log(`Sending End of Campaign Report for ${b.clientName}`);
            
            const html = `
                <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                    <h2 style="color:#10b981;border-bottom:2px solid #10b981;padding-bottom:0.5rem;">📊 End of Campaign Report</h2>
                    <p>The campaign for <strong>${b.clientName}</strong> concluded yesterday.</p>
                    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                        <tr style="background:#f0fdf4;"><td style="padding:0.5rem 1rem;"><strong>Campaign</strong></td><td style="padding:0.5rem 1rem;">${b.campaignName}</td></tr>
                        <tr><td style="padding:0.5rem 1rem;"><strong>Flight Dates</strong></td><td style="padding:0.5rem 1rem;">${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}</td></tr>
                        <tr style="background:#f0fdf4;"><td style="padding:0.5rem 1rem;"><strong>Booked Volume</strong></td><td style="padding:0.5rem 1rem;">${b.audioSpots || b.displayImpressions || 'Sent'}</td></tr>
                    </table>
                    <p style="font-size:0.8rem;color:#999;">Please refer to the Traffic System Archive for final delivery stats.</p>
                </div>`;

            await sendAlert(TRAFFIC_EMAIL, `📊 EOC Report: ${b.clientName}`, html).catch(()=>null);
            
            // Mark it COMPLETED so we don't alert again
            await (prisma as any).booking.update({ where: { id: b.id }, data: { status: 'COMPLETED', lastAlertSentAt: now } });
            results.endOfCampaignReports++;
            continue;
        }
    }

    // --- C: LOW INVENTORY ALERTING (>90% utilization globally for next 30 days) ---
    // For MVP we can just query the Audio and Display tables roughly.
    const audioTargets = await prisma.inventoryItem.findMany({ where: { type: 'AUDIO' } });
    if (audioTargets.length > 0) {
        // Evaluate future 30 days 
        const futureDate = new Date(now.getTime() + 30 * 86400000);
        const upcomingAudioBookings = await prisma.booking.findMany({
            where: {
                bookingType: 'AUDIO',
                status: 'CONFIRMED',
                endDate: { gte: now },
                startDate: { lte: futureDate }
            }
        });
        
        let totalBooked = 0;
        upcomingAudioBookings.forEach(b => totalBooked += (b.audioSpots || 0));
        
        // Let's assume global capacity is roughly sum of item limits * 30 days 
        let globalCap = 0;
        audioTargets.forEach(a => globalCap += a.totalCapacity * 30);
        
        if (globalCap > 0) {
            const usage = (totalBooked / globalCap) * 100;
            if (usage > 90) {
                console.log(`Low inventory warning! audio usage at ${usage}%`);
                const html = `
                    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                        <h2 style="color:#ef4444;border-bottom:2px solid #ef4444;padding-bottom:0.5rem;">⚠️ Low Inventory Warning</h2>
                        <p>The network is projecting severe capacity constraints (over 90% utilization) for the upcoming 30 day period on <strong>AUDIO</strong> streams.</p>
                        <p>Total Booked: ${totalBooked.toLocaleString()} / Network Cap: ${globalCap.toLocaleString()}</p>
                    </div>`;
                await sendAlert(TRAFFIC_EMAIL, `⚠️ NETWORK WARNING: Low Audio Inventory (>90%)`, html).catch(()=>null);
                results.lowInventoryWarnings++;
            }
        }
    }

    return results;
}
