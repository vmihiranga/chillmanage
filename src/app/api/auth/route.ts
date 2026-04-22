import { NextRequest, NextResponse } from 'next/server';
import { login, logout, isAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await isAdmin();
  return NextResponse.json({ isAdmin: admin });
}

export async function POST(request: NextRequest) {
  try {
    const { password, action } = await request.json();

    if (action === 'logout') {
      await logout();
      return NextResponse.json({ success: true });
    }

    const success = await login(password);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
