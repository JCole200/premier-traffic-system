'use server';

import prisma from '../prisma';
import { revalidatePath } from 'next/cache';

import { INVENTORY_BASELINES } from '../constants';

export async function getInventoryItems() {
    const count = await prisma.inventoryItem.count();

    if (count === 0) {
        // Auto-seed if empty
        console.log('Seeding initial inventory items...');
        await prisma.inventoryItem.createMany({
            data: INVENTORY_BASELINES,
            skipDuplicates: true
        });
    }

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

export async function createInventoryItem(data: { id: string; name: string; type: string; totalCapacity: number; unit: string }) {
    await prisma.inventoryItem.create({
        data
    });
    revalidatePath('/inventory');
    revalidatePath('/admin');
    revalidatePath('/availability');
}

export async function deleteInventoryItem(id: string) {
    // Ideally we should check for relationships/bookings first, but for now we force delete or let it fail if foreign keys exist
    // Prisma might throw if Bookings refer to this ID.
    // For now, simple delete.
    try {
        await prisma.inventoryItem.delete({
            where: { id }
        });
        revalidatePath('/inventory');
        revalidatePath('/admin');
        revalidatePath('/availability');
    } catch (e) {
        console.error("Failed to delete inventory item:", e);
        throw new Error("Could not delete item. It may be in use by existing bookings.");
    }
}

export async function updateInventoryItem(id: string, data: { name?: string; type?: string; totalCapacity?: number; unit?: string }) {
    await prisma.inventoryItem.update({
        where: { id },
        data
    });
    revalidatePath('/inventory');
    revalidatePath('/admin');
    revalidatePath('/availability');
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
        // @ts-ignore
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
