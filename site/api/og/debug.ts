import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'OG Debug';
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0c10',
          color: '#e6e6e6',
          fontSize: 60
        }}
      >
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

