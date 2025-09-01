// Force edge runtime at the file level (belt & suspenders)
export const config = { runtime: 'edge' };

import { ImageResponse } from '@vercel/og';

const fontDataPromise = fetch(
  new URL('./Inter-SemiBold.ttf', import.meta.url)
).then(res => res.arrayBuffer()).catch(() => null);

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Ian Buchanan Vault';
  const subtitle = searchParams.get('subtitle') || 'VaultPedia';

  const fontData = await fontDataPromise;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0b0c10',
          color: '#e6e6e6',
          padding: '60px'
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ marginTop: 18, fontSize: 28, color: '#d2b356' }}>
          {subtitle}
        </div>
        <div style={{ marginTop: 'auto', fontSize: 20, color: '#9aa3af' }}>
          buchanan-vault.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [{ name: 'Inter', data: fontData, weight: 600, style: 'normal' }]
        : []
    }
  );
}
