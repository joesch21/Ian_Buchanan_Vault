export const runtime = 'edge';
export default async function handler() {
  return new Response('ok: edge runtime alive', { status: 200 });
}
