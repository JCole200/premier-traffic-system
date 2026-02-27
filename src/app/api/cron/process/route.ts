import { NextRequest, NextResponse } from 'next/server';
import { cleanUpExpiredReservations, processAutomatedAlerts } from '../../../../lib/actions/notifications';

// This endpoint should be protected (e.g., by Vercel Cron Secret)
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const expiredCount = await cleanUpExpiredReservations();
        const alertResults = await processAutomatedAlerts();

        return NextResponse.json({
            success: true,
            expiredReservationsCancelled: expiredCount,
            alertsSent: alertResults
        });
    } catch (error: any) {
        console.error('Cron process failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
