import { cookies } from 'next/headers';

export async function isAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('admin_token');
  return auth?.value === process.env.ADMIN_PASSWORD;
}

export async function login(password: string) {
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return true;
  }
  return false;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}
