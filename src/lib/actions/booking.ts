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
        additionalDetails: b.additionalDetails ? JSON.parse(b.additionalDetails) : undefined,
        // Serialize all Date objects for safe client component passing
        createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
        updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt,
        expiresAt: (b as any).expiresAt instanceof Date ? (b as any).expiresAt.toISOString() : (b as any).expiresAt ?? null,
        lastAlertSentAt: (b as any).lastAlertSentAt instanceof Date ? (b as any).lastAlertSentAt.toISOString() : (b as any).lastAlertSentAt ?? null,
    }));
}

// Create a booking
export async function createBooking(data: Omit<BookingRequest, 'id'>) {
    // 1. Validate Rules
    console.log('Validating rules for:', data.department, data.bookingType);

    // Extract lists from additionalDetails if present
    const details = data.additionalDetails;
    const emailLists = (details?.emailLists as string[]) || [];

    const validation = await validateBookingRules(
        data.department || 'SALES',
        data.bookingType || '',
        data.category || 'PAID',
        data.emailDates || [],
        emailLists,
        data.startDate,
        data.endDate
    );

    if (!validation.valid) {
        throw new Error(validation.error || 'Booking violated business rules');
    }

    const newBooking = await (prisma as any).booking.create({
        data: {
            clientName: data.clientName,
            campaignName: data.campaignName, // We can use this for "Campaign Name" or reuse for Brand if needed
            startDate: new Date(data.startDate),
            endDate: new Date(new Date(data.endDate).setHours(23, 59, 59, 999)),
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

            status: data.status || 'CONFIRMED',
            expiresAt: (data.status === 'RESERVED') ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null // 48 hour expiry for reservations
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

    // 1. Validate rules for update
    const details = data.additionalDetails || (current.additionalDetails ? JSON.parse(current.additionalDetails) : {});
    const emailLists = (details?.emailLists as string[]) || [];

    const validation = await validateBookingRules(
        data.department || current.department,
        data.bookingType || current.bookingType || '',
        data.category || current.category,
        data.emailDates || (current.emailDates ? JSON.parse(current.emailDates) : []),
        emailLists,
        data.startDate ? data.startDate : current.startDate.toISOString().split('T')[0],
        data.endDate ? data.endDate : current.endDate.toISOString().split('T')[0],
        id
    );

    if (!validation.valid) {
        throw new Error(validation.error || 'Update violated business rules');
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(new Date(data.endDate).setHours(23, 59, 59, 999));
    if (data.emailDates) updateData.emailDates = JSON.stringify(data.emailDates);
    if (data.additionalDetails) updateData.additionalDetails = JSON.stringify(data.additionalDetails);

    delete updateData.id;

    // 1. Perform Update
    const updated = await prisma.booking.update({
        where: { id },
        data: updateData
    });

    // 2. Event Hooks for Active Notifications
    const TRAFFIC_EMAIL = 'traffic@premier.org.uk';
    
    // Hook A: Cancellation
    if (data.status === 'CANCELLED' && current.status !== 'CANCELLED') {
        const html = `
            <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                <h2 style="color:#ef4444;border-bottom:2px solid #ef4444;padding-bottom:0.5rem;">⚠️ Campaign Cancelled</h2>
                <p>The campaign for <strong>${current.clientName}</strong> (${current.campaignName}) has been explicitly CANCELLED by ${data.bookerName || 'a user'}.</p>
                <p>Inventory has been returned to the global pool.</p>
            </div>`;
        import('../email').then((m) => m.sendAlert(TRAFFIC_EMAIL, `CANCELLED: ${current.clientName}`, html).catch(()=>null));
    }

    // Hook B: Date Changes
    if ((data.startDate && data.startDate !== current.startDate.toISOString().split('T')[0]) || 
        (data.endDate && data.endDate !== current.endDate.toISOString().split('T')[0])) {
        const html = `
            <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                <h2 style="color:#f59e0b;border-bottom:2px solid #f59e0b;padding-bottom:0.5rem;">🔄 Campaign Dates Shifted</h2>
                <p>The campaign dates for <strong>${current.clientName}</strong> (${current.campaignName}) were modified.</p>
                <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                    <tr><td style="padding:0.5rem 1rem;"><strong>OLD Start Date</strong></td><td style="padding:0.5rem 1rem;">${current.startDate.toISOString().split('T')[0]}</td></tr>
                    <tr style="background:#fef3c7;"><td style="padding:0.5rem 1rem;"><strong>NEW Start Date</strong></td><td style="padding:0.5rem 1rem;">${data.startDate || current.startDate.toISOString().split('T')[0]}</td></tr>
                    <tr><td style="padding:0.5rem 1rem;"><strong>OLD End Date</strong></td><td style="padding:0.5rem 1rem;">${current.endDate.toISOString().split('T')[0]}</td></tr>
                    <tr style="background:#fef3c7;"><td style="padding:0.5rem 1rem;"><strong>NEW End Date</strong></td><td style="padding:0.5rem 1rem;">${data.endDate || current.endDate.toISOString().split('T')[0]}</td></tr>
                </table>
            </div>`;
        import('../email').then((m) => m.sendAlert(TRAFFIC_EMAIL, `DATE SHIFT: ${current.clientName}`, html).catch(()=>null));
    }

    // 3. Create Audit Logs for changed fields
    const changes: Record<string, unknown>[] = [];
    Object.keys(updateData).forEach(key => {
        const oldVal = (current as Record<string, unknown>)[key];
        const newVal = updateData[key];

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
    const current = await prisma.booking.findUnique({ where: { id } });
    if (current) {
        const TRAFFIC_EMAIL = 'traffic@premier.org.uk';
        const html = `
            <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;">
                <h2 style="color:#ef4444;border-bottom:2px solid #ef4444;padding-bottom:0.5rem;">🔥 Campaign Deleted</h2>
                <p>The campaign for <strong>${current.clientName}</strong> (${current.campaignName}) was permanently deleted from the active system ledger.</p>
            </div>`;
        import('../email').then((m) => m.sendAlert(TRAFFIC_EMAIL, `DELETED: ${current.clientName}`, html).catch(()=>null));
    }

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
    const logs = await (prisma as any).auditLog.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' }
    });
    // Serialize Date objects so they can be safely passed to client components
    return logs.map((log: any) => ({
        ...log,
        createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt
    }));
}

// Fetch single booking
export async function getBookingById(id: string) {
    const b = await prisma.booking.findUnique({
        where: { id },
        include: { audioTarget: true }
    });
    if (!b) return null;

    return {
        ...b,
        startDate: b.startDate.toISOString().split('T')[0],
        endDate: b.endDate.toISOString().split('T')[0],
        emailDates: b.emailDates ? JSON.parse(b.emailDates) : undefined,
        additionalDetails: b.additionalDetails ? JSON.parse(b.additionalDetails) : undefined
    };
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
        const items = await (prisma as any).inventoryItem.findMany({ where: { type } });
        baseline = items.reduce((acc: number, curr: { totalCapacity: number }) => acc + curr.totalCapacity, 0);
    }

    // 2. Get Bookings overlapping
    const bookings = await prisma.booking.findMany({
        where: {
            status: { in: ['CONFIRMED', 'RESERVED'] }, // Reservations hold inventory
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
