'use server';

import prisma from '../prisma';
import { revalidatePath } from 'next/cache';

export async function getInventoryItems() {
    return await prisma.inventoryItem.findMany();
}

export async function updateInventoryCapacity(id: string, newCapacity: number) {
    await prisma.inventoryItem.update({
        where: { id },
        data: { totalCapacity: newCapacity }
    });
    revalidatePath('/inventory');
    revalidatePath('/admin');
}
export async function blockDates(
    dates: string[],
    type: string,
    reason: string,
    targetId?: string,
    adsEmailType?: string
) {
    if (!dates || dates.length === 0) return;

    // We can create one "Blocking Booking" that covers all these dates?
    // Or one booking per contiguous range? 
    // Or just one booking with `emailDates` JSON array valid for "Bespoke" or "Ads".
    // Since availability logic for Email/Ads uses `emailDates` JSON, we can put all dates in one booking.
    // For Audio/Display, we usually use start/end. 'blockDates' implies specific days.
    // The request is about Bespoke/Ads in Esends. So JSON array is perfect.

    const sortedDates = dates.sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);

    await prisma.booking.create({
        data: {
            clientName: 'ADMIN_BLOCK', // Special indicator
            campaignName: reason || 'Blocked Dates',
            bookerName: 'Admin',
            status: 'CONFIRMED',
            isBlocked: true,
            bookingType: type,
            startDate: startDate, // Range covers all, individual dates in field below
            endDate: endDate,
            emailDates: JSON.stringify(dates),
            additionalDetails: JSON.stringify({
                reason,
                targetId,
                adsEmailType
            })
        }
    });

    revalidatePath('/admin');
    revalidatePath('/booking');
}
