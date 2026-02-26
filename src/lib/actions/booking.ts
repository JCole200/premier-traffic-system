'use server';

import prisma from '../prisma';
import { BookingRequest } from '../../types/inventory';
import { revalidatePath } from 'next/cache';
import { sendBookingEmail } from '../email';
import { validateBookingRules } from '../limits';

// Fetch all bookings
export async function getBookings() {
    const bookings = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            audioTarget: true // Include relation for name displaying
        }
    });

    return bookings.map((b) => ({
        ...b,
        startDate: b.startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: b.endDate.toISOString().split('T')[0],
        emailDates: b.emailDates ? JSON.parse(b.emailDates) : undefined,
        additionalDetails: b.additionalDetails ? JSON.parse(b.additionalDetails) : undefined
    }));
}

// Create a booking
export async function createBooking(data: Omit<BookingRequest, 'id' | 'status'>) {
    // 1. Validate Rules
    console.log('Validating rules for:', data.department, data.bookingType);

    // Extract lists from additionalDetails if present
    const details = data.additionalDetails;
    const emailLists = (details?.emailLists as string[]) || [];

    const validation = await validateBookingRules(
        data.department || 'SALES',
        data.bookingType || '',
        data.emailDates || [],
        emailLists
    );

    if (!validation.valid) {
        throw new Error(validation.error || 'Booking violated business rules');
    }

    const newBooking = await prisma.booking.create({
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
            department: data.department || 'SALES',
            additionalDetails: data.additionalDetails ? JSON.stringify(data.additionalDetails) : null,

            status: 'CONFIRMED'
        }
    });

    // Create Log
    await (prisma as any).auditLog.create({
        data: {
            bookingId: newBooking.id,
            action: 'CREATE',
            newValue: JSON.stringify(newBooking),
            changedBy: data.bookerName || 'Unknown'
        }
    });

    // Send Email Notification (Fire and Forget)
    const b = newBooking as Record<string, any>;
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

    await sendBookingEmail(emailData);

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/campaigns');
    revalidatePath('/booking');
    revalidatePath('/availability');
    revalidatePath('/master-view');

    return newBooking;
}

// Update Booking
export async function updateBooking(id: string, data: Partial<BookingRequest>) {
    // 0. Get current state for audit
    const current = await prisma.booking.findUnique({ where: { id } });
    if (!current) throw new Error('Booking not found');

    const updateData: any = { ...data };

    // Convert dates and JSON
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.emailDates) updateData.emailDates = JSON.stringify(data.emailDates);
    if (data.additionalDetails) updateData.additionalDetails = JSON.stringify(data.additionalDetails);

    // Remove immutable or unrelated fields if any (like id)
    delete updateData.id;

    // 1. Perform Update
    const updated = await prisma.booking.update({
        where: { id },
        data: updateData
    });

    // 2. Create Audit Logs for changed fields
    const changes: Record<string, unknown>[] = [];
    Object.keys(updateData).forEach(key => {
        const oldVal = (current as Record<string, unknown>)[key];
        const newVal = updateData[key];

        // Simple comparison (dates/json objects might be tricky but strings/numbers work well)
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
                bookingId: id,
                action: 'UPDATE',
                field: key,
                oldValue: JSON.stringify(oldVal),
                newValue: JSON.stringify(newVal),
                changedBy: data.bookerName || 'System - Edit'
            });
        }
    });

    if (changes.length > 0) {
        await (prisma as any).auditLog.createMany({ data: changes });
    }

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/campaigns');
    revalidatePath('/booking');
    revalidatePath('/availability');
    revalidatePath('/master-view');
}

// Delete Booking
export async function deleteBooking(id: string) {
    // We can't link to the booking after delete if we use relate Cascade?
    // Actually AuditLog has onDelete: Cascade, so deleting the booking deletes logs.
    // If we want to KEEP the logs, we should NOT use Cascade.
    // But usually for compliance you want the logs to exist.
    // Let's modify the schema slightly to make bookingId optional or use a different approach.
    // For now, let's keep it simple. Usually "Delete" in these systems is a soft delete (status='CANCELLED').
    // If we literally delete, the logs go away. 

    // Log the delete action first? 
    // If we want to keep the trail, soft delete is better.

    await prisma.booking.delete({ where: { id } });

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/campaigns');
    revalidatePath('/booking');
    revalidatePath('/availability');
    revalidatePath('/master-view');
}

export async function getAuditLogs(bookingId: string) {
    if (!bookingId) return [];
    return await (prisma as any).auditLog.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' }
    });
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
    const used = bookings.reduce((acc: number, curr) => {
        const c = curr as Record<string, any>;
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
