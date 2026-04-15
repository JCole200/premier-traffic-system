'use server';

import prisma from '../prisma';
import { hashPassword } from '../auth';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        }
    });
}

export async function createUser(data: any) {
    const { email, password, name, role } = data;
    
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: role || 'USER',
        }
    });
    
    revalidatePath('/admin/users');
    return user;
}

export async function updateUser(id: string, data: any) {
    const updateData: any = { ...data };
    
    if (data.password) {
        updateData.password = await hashPassword(data.password);
    }
    
    const user = await prisma.user.update({
        where: { id },
        data: updateData
    });
    
    revalidatePath('/admin/users');
    return user;
}

export async function deleteUser(id: string) {
    // Prevent deleting self if needed, but the UI should handle that or the admin logic
    await prisma.user.delete({
        where: { id }
    });
    
    revalidatePath('/admin/users');
}
