import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Vercel Cron Job — runs daily at 08:00 UTC and 00:00 UTC
// Schedule configured in vercel.json

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendAlert(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('example.com')) {
        console.log('[MOCK ALERT]', subject);
        return;
    }
    await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Premier Traffic" <noreply@premier.org.uk>',
        to,
        subject,
        html,
    });
}

export async function GET(request: Request) {
    // Verify the request came from Vercel Cron (in production)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const alertEmail = process.env.ALERT_EMAIL || 'cristina.turlacu@premier.org.uk';
    let alertsSent = 0;

    try {
        // ── 1. EXPIRE STALE RESERVATIONS ────────────────────────────────────
        const expired = await prisma.booking.deleteMany({
            where: {
                status: 'RESERVED',
                expiresAt: { lt: now }
            } as any
        });
        console.log(`[CRON] Expired ${expired.count} stale reservation(s).`);

        // ── 2. CAMPAIGN END-DATE ALERTS (7 days warning) ─────────────────────
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const endingSoon = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                endDate: { gte: now, lte: sevenDaysFromNow },
                // Re-alert if lastAlertSentAt is null or older than 24h
                OR: [{ lastAlertSentAt: null }, { lastAlertSentAt: { lt: oneDayAgo } }]
            } as any
        });

        for (const booking of endingSoon) {
            const b = booking as any;
            const daysLeft = Math.ceil((new Date(b.endDate).getTime() - now.getTime()) / 86400000);

            const html = `
                <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                    <h2 style="color:#6366f1;border-bottom:2px solid #6366f1;padding-bottom:0.5rem;">⏰ Campaign Ending Soon</h2>
                    <p><strong>${b.clientName}</strong> — ${b.campaignName}</p>
                    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                        <tr style="background:#f5f5f5;"><td style="padding:0.5rem 1rem;"><strong>End Date</strong></td><td style="padding:0.5rem 1rem;color:#ef4444;"><strong>${new Date(b.endDate).toLocaleDateString('en-GB')}</strong></td></tr>
                        <tr><td style="padding:0.5rem 1rem;"><strong>Days Remaining</strong></td><td style="padding:0.5rem 1rem;">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</td></tr>
                        <tr style="background:#f5f5f5;"><td style="padding:0.5rem 1rem;"><strong>Type</strong></td><td style="padding:0.5rem 1rem;">${b.bookingType || 'N/A'}</td></tr>
                        <tr><td style="padding:0.5rem 1rem;"><strong>Contract</strong></td><td style="padding:0.5rem 1rem;">${b.contractNumber || 'N/A'}</td></tr>
                        <tr style="background:#f5f5f5;"><td style="padding:0.5rem 1rem;"><strong>Booked By</strong></td><td style="padding:0.5rem 1rem;">${b.bookerName || 'N/A'}</td></tr>
                    </table>
                    <p>Please confirm delivery, discuss renewal, or archive this campaign.</p>
                    <p style="font-size:0.8rem;color:#999;">Premier Traffic System · Automated End-Date Alert</p>
                </div>`;

            await sendAlert(alertEmail, `⏰ ${daysLeft}d Left: ${b.clientName} — ${b.campaignName}`, html);
            await (prisma as any).booking.update({ where: { id: b.id }, data: { lastAlertSentAt: now } });
            alertsSent++;
        }

        // ── 3. COPY-CHASING ALERTS (starting ≤14 days, copy PENDING) ────────
        const fourteenDays = new Date(now);
        fourteenDays.setDate(fourteenDays.getDate() + 14);

        const upcoming = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                startDate: { gte: now, lte: fourteenDays },
                OR: [{ lastAlertSentAt: null }, { lastAlertSentAt: { lt: oneDayAgo } }]
            } as any
        });

        const pendingCopy = upcoming.filter((b: any) => {
            try {
                const d = b.additionalDetails ? JSON.parse(b.additionalDetails) : {};
                return !d.copyStatus || d.copyStatus === 'PENDING';
            } catch { return true; }
        });

        for (const booking of pendingCopy) {
            const b = booking as any;
            const daysUntil = Math.ceil((new Date(b.startDate).getTime() - now.getTime()) / 86400000);

            const html = `
                <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                    <h2 style="color:#f59e0b;border-bottom:2px solid #f59e0b;padding-bottom:0.5rem;">📋 Copy Required</h2>
                    <p>Campaign going live in <strong>${daysUntil} day${daysUntil !== 1 ? 's' : ''}</strong> — copy/creative not yet received.</p>
                    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                        <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Client</strong></td><td style="padding:0.5rem 1rem;">${b.clientName}</td></tr>
                        <tr><td style="padding:0.5rem 1rem;"><strong>Campaign</strong></td><td style="padding:0.5rem 1rem;">${b.campaignName}</td></tr>
                        <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Start Date</strong></td><td style="padding:0.5rem 1rem;color:#f59e0b;"><strong>${new Date(b.startDate).toLocaleDateString('en-GB')}</strong></td></tr>
                        <tr><td style="padding:0.5rem 1rem;"><strong>Type</strong></td><td style="padding:0.5rem 1rem;">${b.bookingType || 'N/A'}</td></tr>
                        <tr style="background:#fffbeb;"><td style="padding:0.5rem 1rem;"><strong>Contract</strong></td><td style="padding:0.5rem 1rem;">${b.contractNumber || 'N/A'}</td></tr>
                    </table>
                    <p>Please chase the client or agency for ad copy/creative immediately.</p>
                    <p style="font-size:0.8rem;color:#999;">Premier Traffic System · Copy-Chase Reminder</p>
                </div>`;

            await sendAlert(alertEmail, `📋 Copy Needed (${daysUntil}d): ${b.clientName}`, html);
            await (prisma as any).booking.update({ where: { id: b.id }, data: { lastAlertSentAt: now } });
            alertsSent++;
        }

        return NextResponse.json({ success: true, expiredReservations: expired.count, alertsSent, timestamp: now.toISOString() });
    } catch (error) {
        console.error('[CRON] Error:', error);
        return NextResponse.json({ error: 'Cron job failed', detail: String(error) }, { status: 500 });
    }
}
