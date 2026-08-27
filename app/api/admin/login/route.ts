import { NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/auth';
export async function POST(request:Request){const {email}=await request.json();if(typeof email!=='string'||!process.env.ADMIN_EMAIL||email.trim().toLowerCase()!==process.env.ADMIN_EMAIL.trim().toLowerCase())return NextResponse.json({error:'Unauthorized'},{status:401});await createAdminSession();return NextResponse.json({ok:true});}
