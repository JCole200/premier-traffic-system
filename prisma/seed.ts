import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const initialAdmins = [
    'sarah.williams@premier.org.uk',
    'judah.cole@premier.org.uk',
    'annette.clowes@premier.org.uk',
    'alex.cable@premier.org.uk'
];

async function main() {
    const password = await bcrypt.hash('Premier2026!', 10);

    for (const email of initialAdmins) {
        await prisma.user.upsert({
            where: { email },
            update: { role: 'ADMIN' },
            create: {
                email,
                name: email.split('@')[0],
                password,
                role: 'ADMIN',
            },
        });
        console.log(`Ensured admin user exists: ${email}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
