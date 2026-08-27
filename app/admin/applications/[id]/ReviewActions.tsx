'use client';
import { useState } from 'react';

export default function ReviewActions({ applicationId }: { applicationId: string }) {
  const [message, setMessage] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    const action = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (action?.value === 'REJECT') {
      if (message.trim().length < 5) {
        event.preventDefault();
        window.alert('Enter a rejection reason before rejecting this application.');
        return;
      }
      if (!window.confirm('Reject this application? This action will be recorded in the audit history.')) {
        event.preventDefault();
      }
    }
  }
  return <form action={`/api/admin/applications/${applicationId}`} method="post" onSubmit={submit}>
    <input name="message" value={message} onChange={event => setMessage(event.target.value)} placeholder="Reason or instructions (required for reject/change)" />
    <div className="actions">
      <button className="btn" name="action" value="UNDER_REVIEW">MARK UNDER REVIEW</button>
      <button className="btn primary" name="action" value="APPROVE">APPROVE</button>
      <button className="btn" name="action" value="NEEDS_CHANGES">REQUEST CHANGES</button>
      <button className="btn danger" name="action" value="REJECT">REJECT APPLICATION</button>
    </div>
  </form>;
}
