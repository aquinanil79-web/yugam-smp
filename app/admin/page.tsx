import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import DashboardActions from './DashboardActions';

export default async function Admin() {
  if (!(await getAdminSession())) redirect('/admin/login');
  const apps = await db.application.findMany({ orderBy: { submittedAt: 'desc' }, take: 100 });
  const counts = await db.application.groupBy({ by: ['status'], _count: true });
  const count = (status: string) => counts.find(item => item.status === status)?._count || 0;
  return <main className="shell"><nav className="nav"><div><div className="eyebrow">YUGAM SMP</div><h2>Verification Control Center</h2></div><form action="/api/admin/logout" method="post"><button className="btn">LOG OUT</button></form></nav><section className="grid" style={{ margin: '30px 0' }}>{[['TOTAL', apps.length], ['PENDING', count('PENDING')], ['UNDER REVIEW', count('UNDER_REVIEW')], ['APPROVED', count('APPROVED')], ['REJECTED', count('REJECTED')], ['NEEDS CHANGES', count('NEEDS_CHANGES')]].map(([label, value]) => <div className="panel" key={label as string}><div className="eyebrow">{label}</div><h2>{value as number}</h2></div>)}</section><div className="panel"><table className="table"><thead><tr><th>APPLICATION</th><th>PLAYER</th><th>SUBMITTED</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{apps.map(app => <tr key={app.id}><td><a href={`/admin/applications/${app.applicationId}`}>{app.applicationId}</a></td><td>{app.minecraftUsername}</td><td className="muted">{app.submittedAt.toLocaleDateString()}</td><td className="status">{app.status.replace('_', ' ')}</td><td><DashboardActions applicationId={app.applicationId} status={app.status} /></td></tr>)}</tbody></table></div></main>;
}
