
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { INVENTORY_BASELINES } from '../../../lib/constants';

export async function GET() {
    try {
        console.log('Seeding database via API...');

        const results = [];

        for (const item of INVENTORY_BASELINES) {
            const result = await prisma.inventoryItem.upsert({
                where: { id: item.id },
                update: {
                    totalCapacity: item.totalCapacity
                },
                create: {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    totalCapacity: item.totalCapacity,
                    unit: item.unit
                }
            });
            results.push(result);
        }

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            count: results.length,
            items: results
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
