'use server';

import prisma from '../prisma';
import { BookingRequest } from '../../types/inventory';
import { revalidatePath } from 'next/cache';

import { sendBookingEmail } from '../email';

// Fetch all bookings
export async function getBookings() {
    const bookings = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            audioTarget: true // Include relation for name displaying
        }
    });

    // Transform to our frontend type if needed, or stick to Prisma type
    // Prisma Dates are Date objects, frontend used strings. 
    // Let's serialize Dates to strings for Client Components.
    return bookings.map((b: any) => ({
        ...b,
        startDate: b.startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: b.endDate.toISOString().split('T')[0],
        emailDates: b.emailDates ? JSON.parse(b.emailDates) : undefined,
        additionalDetails: b.additionalDetails ? JSON.parse(b.additionalDetails) : undefined
    }));
}

// Create a booking
export async function createBooking(data: Omit<BookingRequest, 'id' | 'status'>) {
    const newBooking = await prisma.booking.create({
        // @ts-ignore
        data: {
            clientName: data.clientName,
            campaignName: data.campaignName, // We can use this for "Campaign Name" or reuse for Brand if needed
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            geoTarget: data.geoTarget,
            audioSpots: data.audioSpots || 0,
            audioTargetId: data.audioTargetId || null,
            displayImpressions: data.displayImpressions || 0,
            emailDates: data.emailDates ? JSON.stringify(data.emailDates) : null,

            // New fields
            contractNumber: data.contractNumber || null,
            bookerName: data.bookerName || null,
            bookingType: data.bookingType || null,
            additionalDetails: data.additionalDetails ? JSON.stringify(data.additionalDetails) : null,

            status: 'CONFIRMED'
        }
    });

    // Send Email Notification (Fire and Forget)
    // We cast to any or a compatible type to match BookingRequest expected by email helper
    // Since newBooking has Date objects and the helper might expect strings, let's just pass what we have
    // Actually our helper expects BookingRequest which has string dates. 
    // Let's quickly reformat for the email helper.
    const b = newBooking as any;
    const emailData: BookingRequest = {
        id: b.id,
        clientName: b.clientName,
        campaignName: b.campaignName,
        startDate: b.startDate.toISOString().split('T')[0],
        endDate: b.endDate.toISOString().split('T')[0],
        bookerName: b.bookerName || undefined,
        contractNumber: b.contractNumber || undefined,
        bookingType: b.bookingType || undefined,
        additionalDetails: b.additionalDetails ? JSON.parse(b.additionalDetails) : undefined,
        geoTarget: b.geoTarget as any, // Cast if enum mismatch
        status: b.status as any
    };

    // Don't await specifically if we don't want to block the UI, but usually good to await or run in background
    // Since this is a server action, awaiting ensures it is sent before response returns
    await sendBookingEmail(emailData);

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/campaigns');
    revalidatePath('/booking');
    revalidatePath('/availability');

    return newBooking;
}

// Update Booking
export async function updateBooking(id: string, data: Partial<BookingRequest>) {
    const updateData: any = { ...data };

    // Convert dates and JSON
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.emailDates) updateData.emailDates = JSON.stringify(data.emailDates);
    if (data.additionalDetails) updateData.additionalDetails = JSON.stringify(data.additionalDetails);

    // Remove immutable or unrelated fields if any (like id)
    delete updateData.id;

    await prisma.booking.update({
        where: { id },
        data: updateData
    });

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/campaigns');
    revalidatePath('/booking');
    revalidatePath('/availability');
}

// Delete Booking
export async function deleteBooking(id: string) {
    await prisma.booking.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/campaigns');
    revalidatePath('/booking');
    revalidatePath('/availability');
}

// Availability Check (Server Side)
export async function checkAvailability(type: string, start: string, end: string, targetId?: string) {
    // 1. Get Baseline
    let baseline = 0;
    if (targetId) {
        const item = await prisma.inventoryItem.findUnique({ where: { id: targetId } });
        baseline = item ? item.totalCapacity : 0;
    } else {
        // Aggregate
        const items = await prisma.inventoryItem.findMany({ where: { type } });
        baseline = items.reduce((acc: number, curr: { totalCapacity: number }) => acc + curr.totalCapacity, 0);
    }

    // 2. Get Bookings overlapping
    const bookings = await prisma.booking.findMany({
        where: {
            status: 'CONFIRMED',
            // Simple Overlap Logic: (StartA <= EndB) and (EndA >= StartB)
            startDate: { lte: new Date(end) },
            endDate: { gte: new Date(start) }
        }
    });

    // 3. Calculate usage
    const used = bookings.reduce((acc: number, curr: any) => {
        if (targetId) {
            if (curr.audioTargetId === targetId) return acc + curr.audioSpots;
            return acc;
        }

        if (type === 'AUDIO') return acc + curr.audioSpots;
        if (type === 'DISPLAY') return acc + curr.displayImpressions;

        // Email logic: count specific days
        // For MVP just counting dates array length roughly
        if (type === 'EMAIL' && curr.emailDates) {
            const dates = JSON.parse(curr.emailDates);
            return acc + dates.length;
        }

        return acc;
    }, 0);

    return baseline - used;
}
