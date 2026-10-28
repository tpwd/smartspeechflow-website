// Gemeinsame Antworten der Formular-Endpunkte (JSON).
export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/** Nur Anfragen von der eigenen Seite annehmen (Schutz gegen fremde Formulare, die hierher posten). */
export function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
}

export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) return null;
  const raw = await request.text();
  if (raw.length > 20000) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
