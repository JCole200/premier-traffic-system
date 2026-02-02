import prisma from '../src/lib/prisma';
import { INVENTORY_BASELINES } from '../src/lib/constants';

async function main() {
    console.log('Seeding database...');

    for (const item of INVENTORY_BASELINES) {
        await prisma.inventoryItem.upsert({
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
    }

    console.log('Database seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
