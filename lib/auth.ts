import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE = 'yugam_admin';
const PLAYER_COOKIE = 'yugam_player';
const maxAge = 60 * 60 * 8;
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const token = () => crypto.randomBytes(32).toString('hex');

export async function createAdminSession() {
  const raw = token();
  await db.adminSession.create({ data: { tokenHash: hash(raw), expiresAt: new Date(Date.now() + maxAge * 1000) } });
  (await cookies()).set(COOKIE, raw, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge, path: '/' });
}
export async function getAdminSession() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const session = await db.adminSession.findUnique({ where: { tokenHash: hash(raw) } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}
export async function clearAdminSession() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (raw) await db.adminSession.deleteMany({ where: { tokenHash: hash(raw) } });
  (await cookies()).delete(COOKIE);
}
export async function createPlayerSession(applicationId: number) {
  const raw = token();
  await db.playerSession.create({ data: { tokenHash: hash(raw), applicationId, expiresAt: new Date(Date.now() + maxAge * 1000) } });
  (await cookies()).set(PLAYER_COOKIE, raw, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge, path: '/' });
  return raw;
}
export async function getPlayerApplicationId() {
  const raw = (await cookies()).get(PLAYER_COOKIE)?.value;
  if (!raw) return null;
  const session = await db.playerSession.findUnique({ where: { tokenHash: hash(raw) } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.applicationId;
}
export { hash };
