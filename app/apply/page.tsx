'use client';

import { useState } from 'react';

type FormValues = {
  playerName: string;
  minecraftUsername: string;
  discordUsername: string;
  discordId: string;
  serverMode: string;
  playerBio: string;
};

type Result = { id: string; credential: string };
const fields: Array<[keyof FormValues, string]> = [
  ['playerName', 'FULL / DISPLAY NAME'],
  ['minecraftUsername', 'MINECRAFT USERNAME'],
  ['discordUsername', 'DISCORD USERNAME'],
  ['discordId', 'DISCORD ID'],
  ['serverMode', 'SERVER MODE'],
  ['playerBio', 'PLAYER BIO'],
];

export default function Apply() {
  const [step, setStep] = useState<'details' | 'preview'>('details');
  const [values, setValues] = useState<FormValues>({ playerName: '', minecraftUsername: '', discordUsername: '', discordId: '', serverMode: 'Survival', playerBio: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextValues = Object.fromEntries(fields.map(([name]) => [name, String(form.get(name) || '')])) as FormValues;
    const nextPhoto = form.get('photo');
    if (!(nextPhoto instanceof File) || nextPhoto.size === 0) {
      setError('Choose a passport photo before continuing.');
      return;
    }
    setValues(nextValues);
    setPhoto(nextPhoto);
    setPhotoPreview(URL.createObjectURL(nextPhoto));
    setError('');
    setStep('preview');
  }

  async function submit() {
    if (!photo) return;
    setError('');
    const form = new FormData();
    Object.entries(values).forEach(([name, value]) => form.append(name, value));
    form.append('photo', photo);
    const response = await fetch('/api/applications', { method: 'POST', body: form });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Submission failed.');
      return;
    }
    setResult(body);
  }

  if (result) return <main className="shell form"><div className="panel success"><div className="eyebrow">APPLICATION SUBMITTED SUCCESSFULLY</div><h1>{result.id}</h1><p>Your application is waiting for administrator review.</p><p><strong>Access credential:</strong> {result.credential}</p><p className="muted">Save both values securely. Your passport preview becomes available after approval.</p><a className="btn" href="/application/status">CHECK APPLICATION STATUS</a></div></main>;

  if (step === 'preview') return <main className="shell form"><div className="eyebrow">03 CONFIRM APPLICATION</div><h1>Review your details.</h1><p className="muted">Check everything carefully before submitting.</p><div className="panel preview"><div className="preview-photo">{photoPreview && <img src={photoPreview} alt="Passport photo preview" />}</div><div className="preview-fields">{fields.map(([name, label]) => <div key={name}><span className="muted">{label}</span><strong>{values[name]}</strong></div>)}</div></div>{error && <p className="error">{error}</p>}<div className="actions"><button className="btn" type="button" onClick={() => setStep('details')}>EDIT DETAILS</button><button className="btn primary" type="button" onClick={submit}>CONFIRM AND SUBMIT</button></div></main>;

  return <main className="shell form"><div className="eyebrow">01 PLAYER DETAILS / 02 PHOTO / 03 REVIEW</div><h1>Claim your identity.</h1><p className="muted">Complete the form, then review it before submission.</p><form onSubmit={review} encType="multipart/form-data"><div className="fields"><div className="field"><label>FULL / DISPLAY NAME *</label><input name="playerName" defaultValue={values.playerName} required maxLength={80} /></div><div className="field"><label>MINECRAFT USERNAME *</label><input name="minecraftUsername" defaultValue={values.minecraftUsername} required pattern="[A-Za-z0-9_]{3,16}" /></div><div className="field"><label>DISCORD USERNAME *</label><input name="discordUsername" defaultValue={values.discordUsername} required maxLength={80} /></div><div className="field"><label>DISCORD ID *</label><input name="discordId" defaultValue={values.discordId} required pattern="[0-9]{17,20}" /></div><div className="field"><label>SERVER MODE *</label><select name="serverMode" defaultValue={values.serverMode}><option>Survival</option><option>Hardcore</option><option>Creative</option><option>Roleplay</option></select></div><div className="field full"><label>PLAYER BIO *</label><textarea name="playerBio" defaultValue={values.playerBio} required minLength={10} maxLength={600} /></div><div className="field full"><label>PASSPORT PHOTO (JPG, PNG, WEBP; MAX 5MB) *</label><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></div></div>{error && <p className="error">{error}</p>}<button className="btn primary" type="submit">PREVIEW APPLICATION</button></form></main>;
}
