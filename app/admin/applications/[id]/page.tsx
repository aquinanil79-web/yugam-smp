import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import ReviewActions from './ReviewActions';

export default async function Review({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) redirect('/admin/login');
  const { id } = await params;
  const app = await db.application.findUnique({ where: { applicationId: id }, include: { history: { orderBy: { createdAt: 'desc' } } } });
  if (!app) notFound();
  return <main className="shell"><a className="muted" href="/admin">← Dashboard</a><div className="panel" style={{ marginTop: 30 }}><div className="eyebrow">{app.applicationId} / REVIEW</div><h1>{app.playerName}</h1><p className="status">{app.status}</p><div className="grid"><div><p className="muted">MINECRAFT</p><p>{app.minecraftUsername}</p></div><div><p className="muted">DISCORD</p><p>{app.discordUsername}</p><p>{app.discordId}</p></div><div><p className="muted">MODE</p><p>{app.serverMode}</p></div></div><p>{app.playerBio}</p><ReviewActions applicationId={app.applicationId} /><h3>Review history</h3>{app.history.map(h => <p className="muted" key={h.id}>{h.createdAt.toLocaleString()} · {h.action} {h.message || ''}</p>)}</div></main>;
}
