export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'performetrix-ai-audit',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
