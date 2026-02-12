import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const { username, password } = await request.json();

    if (username?.trim() === 'admin' && password?.trim() === 'admin123') {
        const response = NextResponse.json({ success: true });

        response.cookies.set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from 'strict' to 'lax' to allow navigation
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    }

    return NextResponse.json({ success: false }, { status: 401 });
}
