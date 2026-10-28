// Minimaler Pipedrive-Client für die Formulare.
// API v2 für Personen, Organisationen und Deals; API v1 für Leads und Notizen (dort gibt es noch kein v2).
// Doku: https://developers.pipedrive.com/docs/api/v1

export interface PipedriveConfig {
  token: string;
  /** Firmen-Subdomain, z. B. "svs" für https://svs.pipedrive.com */
  domain: string;
  /** Nur für Tests: alternative Basis-URL (z. B. lokaler Mock-Server) */
  baseUrl?: string;
}

export class PipedriveError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function createPipedrive(config: PipedriveConfig) {
  const base = config.baseUrl ?? `https://${config.domain}.pipedrive.com`;

  async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'x-api-token': config.token, 'content-type': 'application/json', accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: string };
    if (!res.ok || json.success === false) {
      throw new PipedriveError(`Pipedrive ${method} ${path} → ${res.status} ${json.error ?? ''}`.trim(), res.status);
    }
    return json.data as T;
  }

  async function searchId(entity: 'persons' | 'organizations', field: 'email' | 'name', term: string): Promise<number | null> {
    if (term.length < 2) return null;
    const params = new URLSearchParams({ term, fields: field, exact_match: 'true', limit: '1' });
    const data = await call<{ items?: { item: { id: number } }[] }>('GET', `/api/v2/${entity}/search?${params}`);
    return data?.items?.[0]?.item.id ?? null;
  }

  return {
    /** Vorhandene Organisation (exakter Name) wiederverwenden, sonst anlegen. */
    async upsertOrganization(name: string, address?: string): Promise<number> {
      const existing = await searchId('organizations', 'name', name);
      if (existing) return existing;
      const org = await call<{ id: number }>('POST', '/api/v2/organizations', {
        name,
        ...(address ? { address: { value: address } } : {}),
      });
      return org.id;
    },

    /** Vorhandene Person (exakte E-Mail) wiederverwenden, sonst anlegen. */
    async upsertPerson(p: { name: string; email: string; phone?: string; orgId?: number; jobTitle?: string }): Promise<number> {
      const existing = await searchId('persons', 'email', p.email);
      if (existing) return existing;
      const person = await call<{ id: number }>('POST', '/api/v2/persons', {
        name: p.name,
        emails: [{ value: p.email, primary: true, label: 'work' }],
        ...(p.phone ? { phones: [{ value: p.phone, primary: true, label: 'work' }] } : {}),
        ...(p.orgId ? { org_id: p.orgId } : {}),
        ...(p.jobTitle ? { job_title: p.jobTitle } : {}),
      });
      return person.id;
    },

    async createDeal(d: { title: string; value?: number | null; personId: number; orgId?: number; pipelineId?: number; stageId?: number }): Promise<number> {
      const deal = await call<{ id: number }>('POST', '/api/v2/deals', {
        title: d.title,
        person_id: d.personId,
        ...(d.orgId ? { org_id: d.orgId } : {}),
        ...(d.value ? { value: d.value, currency: 'EUR' } : {}),
        ...(d.pipelineId ? { pipeline_id: d.pipelineId } : {}),
        ...(d.stageId ? { stage_id: d.stageId } : {}),
      });
      return deal.id;
    },

    async createLead(l: { title: string; personId: number; orgId?: number }): Promise<string> {
      const lead = await call<{ id: string }>('POST', '/api/v1/leads', {
        title: l.title,
        person_id: l.personId,
        ...(l.orgId ? { organization_id: l.orgId } : {}),
      });
      return lead.id;
    },

    async addNote(n: { content: string; dealId?: number; leadId?: string; personId?: number; orgId?: number }): Promise<void> {
      await call('POST', '/api/v1/notes', {
        content: n.content,
        ...(n.dealId ? { deal_id: n.dealId, pin_to_deal_flag: 1 } : {}),
        ...(n.leadId ? { lead_id: n.leadId, pin_to_lead_flag: 1 } : {}),
        ...(n.personId && !n.dealId && !n.leadId ? { person_id: n.personId } : {}),
        ...(n.orgId && !n.dealId && !n.leadId ? { org_id: n.orgId } : {}),
      });
    },
  };
}

/** Text für Pipedrive-Notizen (HTML erlaubt). Nutzereingaben werden maskiert. */
export function noteHtml(title: string, rows: [string, string | undefined][]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = rows
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `<b>${esc(k)}:</b> ${esc(String(v)).replace(/\n/g, '<br>')}`)
    .join('<br>');
  return `<p><b>${esc(title)}</b></p><p>${body}</p>`;
}
