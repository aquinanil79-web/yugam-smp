import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createPlayerSession } from '@/lib/auth';
export async function POST(request:Request){const {applicationId,credential}=await request.json();const app=await db.application.findUnique({where:{applicationId}});if(!app||typeof credential!=='string'||!(await bcrypt.compare(credential,app.accessHash)))return NextResponse.json({error:'Application ID or credential is invalid.'},{status:401});await createPlayerSession(app.id);return NextResponse.json({applicationId:app.applicationId,status:app.status,adminMessage:app.adminMessage});}
