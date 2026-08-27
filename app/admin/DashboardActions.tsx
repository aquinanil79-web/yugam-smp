'use client';

export default function DashboardActions({ applicationId, status }: { applicationId: string; status: string }) {
  const endpoint = `/api/admin/applications/${applicationId}`;
  function approve(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Approve ${applicationId}?`)) event.preventDefault();
  }
  function reject(event: React.FormEvent<HTMLFormElement>) {
    const reason = window.prompt('Enter the rejection reason:');
    if (!reason || reason.trim().length < 5) {
      event.preventDefault();
      if (reason !== null) window.alert('A rejection reason of at least 5 characters is required.');
      return;
    }
    const input = event.currentTarget.elements.namedItem('message') as HTMLInputElement;
    input.value = reason.trim();
    if (!window.confirm(`Reject ${applicationId}?`)) event.preventDefault();
  }
  return <div className="row-actions">
    <a className="btn compact" href={`/admin/applications/${applicationId}`}>REVIEW</a>
    {status !== 'APPROVED' && status !== 'REJECTED' && <>
      <form action={endpoint} method="post" onSubmit={approve}><input type="hidden" name="action" value="APPROVE" /><button className="btn compact primary" type="submit">APPROVE</button></form>
      <form action={endpoint} method="post" onSubmit={reject}><input type="hidden" name="action" value="REJECT" /><input type="hidden" name="message" /><button className="btn compact danger" type="submit">REJECT</button></form>
    </>}
  </div>;
}
