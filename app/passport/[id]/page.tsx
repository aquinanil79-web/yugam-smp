import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getPlayerApplicationId } from '@/lib/auth';
import DownloadButton from './DownloadButton';

export default async function Passport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const passport = await db.passport.findUnique({ where: { passportId: id }, include: { application: true } });
  if (!passport) notFound();
  if ((await getPlayerApplicationId()) !== passport.applicationId) redirect('/application/status');

  return <main className="shell form"><div className="passport-wrap"><div className="passport-card"><div className="passport-photo">{passport.application.photoKey ? <img src={passport.application.photoKey} alt="Passport photo" /> : <span>PHOTO</span>}</div><div className="eyebrow">YUGAM SMP / PLAYER PASSPORT</div><h1>{passport.application.playerName}</h1><p className="status">{passport.status === 'VALID' ? '✓ VERIFIED' : 'REVOKED'}</p><p>Passport ID: {passport.passportId}</p><p>Passport number: {passport.passportNumber}</p><p>Minecraft: {passport.application.minecraftUsername}</p><p>Mode: {passport.application.serverMode}</p></div><div className="actions passport-actions"><DownloadButton /><a className="btn" href={`/verify/${passport.passportId}`}>PUBLIC VERIFICATION</a></div></div></main>;
}
