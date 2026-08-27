'use client';

export default function DownloadButton() {
  return <button className="btn primary" type="button" onClick={() => window.print()}>DOWNLOAD / PRINT PASSPORT</button>;
}
