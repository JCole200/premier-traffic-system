import { NextResponse } from 'next/server';
import { cleanUpExpiredReservations, processAutomatedAlerts } from '@/lib/actions/notifications';

// Vercel Cron Job — runs daily at 00:00 UTC and 08:00 UTC
// Schedule configured in vercel.json

export async function GET(request: Request) {
    // Verify the request came from Vercel Cron (in production)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    try {
        // 1. Expire stale reservations
        const expiredCount = await cleanUpExpiredReservations();
        console.log(`[CRON] Expired ${expiredCount} stale reservation(s).`);

        // 2. Process automated alerts (End-date & Copy-chase)
        const alertResults = await processAutomatedAlerts();
        console.log(`[CRON] Alerts sent: End-Date=${alertResults.endAlerts}, Copy-Chase=${alertResults.copyReminders}`);

        return NextResponse.json({ 
            success: true, 
            expiredReservations: expiredCount, 
            alertsSent: alertResults.endAlerts + alertResults.copyReminders,
            detail: alertResults,
            timestamp: now.toISOString() 
        });
    } catch (error) {
        console.error('[CRON] Error:', error);
        return NextResponse.json({ error: 'Cron job failed', detail: String(error) }, { status: 500 });
    }
}
