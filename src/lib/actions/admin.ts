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
