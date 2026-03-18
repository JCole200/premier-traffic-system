'use server';

import prisma from '../prisma';
import { revalidatePath } from 'next/cache';

export async function getESendArchives() {
    return await (prisma as any).eSendArchive.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createESendArchive(data: {
    title: string;
    copy: string;
    link: string;
    type: string;
}) {
    const entry = await (prisma as any).eSendArchive.create({ data });
    revalidatePath('/e-send-archive');
    return entry;
}

export async function deleteESendArchive(id: string) {
    await (prisma as any).eSendArchive.delete({ where: { id } });
    revalidatePath('/e-send-archive');
}
