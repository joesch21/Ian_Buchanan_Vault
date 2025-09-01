export const config = { runtime: "edge" };
export default async function handler(req: Request) {
  return new Response(
    JSON.stringify(
      { ok: true, hint: "Edge runtime active, OG endpoints should work." },
      null,
      2
    ),
    { headers: { "content-type": "application/json" } }
  );
}
