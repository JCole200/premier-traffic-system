import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'premier-system-ultra-secret-key-2026'
);

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, JWT_SECRET, {
        algorithms: ['HS256'],
    });
    return payload;
}
