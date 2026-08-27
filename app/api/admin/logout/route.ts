import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth';
export async function POST(){await clearAdminSession();return NextResponse.redirect(new URL('/admin/login',process.env.APP_BASE_URL||'http://localhost:3000'));}
