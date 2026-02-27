'use server';

import prisma from '../prisma';
import { revalidatePath } from 'next/cache';

export async function getBookingRules() {
    return await (prisma as any).bookingRule.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createBookingRule(data: {
    name: string;
    category: string;
    conflictsWith: string[];
    maxDaily: number;
}) {
    const rule = await (prisma as any).bookingRule.create({
        data: {
            name: data.name,
            category: data.category,
            conflictsWith: JSON.stringify(data.conflictsWith),
            maxDaily: data.maxDaily,
            isActive: true
        }
    });
    revalidatePath('/admin');
    return rule;
}

export async function updateBookingRule(id: string, data: any) {
    if (data.conflictsWith) data.conflictsWith = JSON.stringify(data.conflictsWith);

    const updated = await (prisma as any).bookingRule.update({
        where: { id },
        data
    });
    revalidatePath('/admin');
    return updated;
}

export async function deleteBookingRule(id: string) {
    await (prisma as any).bookingRule.delete({ where: { id } });
    revalidatePath('/admin');
}
