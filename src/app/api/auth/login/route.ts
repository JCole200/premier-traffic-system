import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePasswords } from '@/lib/auth';
import { encrypt } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const session = await encrypt({ 
            id: user.id, 
            email: user.email, 
            role: user.role,
            expires 
        });

        const response = NextResponse.json({ success: true, user: { email: user.email, role: user.role } });
        
        // Use 'session' as the cookie name for better standard
        response.cookies.set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        // Also set 'admin_session' if admin for backward compatibility with old middleware during transition
        if (user.role === 'ADMIN') {
            response.cookies.set('admin_session', 'true', {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
