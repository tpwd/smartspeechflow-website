// Prüfung der Formulardaten (serverseitig). Preise werden hier aus den Stammdaten berechnet –
// Werte aus dem Browser werden nie übernommen.
import { z } from 'astro/zod';
import { locales } from '../i18n/config';
import { plans, promotion, promotionActive, type PlanId } from '../data/site';

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);

const identityFields = {
  salutation: z.enum(['frau', 'herr', 'neutral']).optional(),
  firstName: required(80).optional(),
  lastName: required(120).optional(),
  // Übergang für bereits geöffnete Seiten: nur vollständige alte Payloads akzeptieren.
  name: required(201).optional(),
};
type IdentityInput = { salutation?: 'frau' | 'herr' | 'neutral'; firstName?: string; lastName?: string; name?: string };
function validateIdentity(input: IdentityInput, ctx: z.RefinementCtx) {
  const structured = input.salutation !== undefined || input.firstName !== undefined || input.lastName !== undefined;
  if (structured) {
    for (const key of ['salutation', 'firstName', 'lastName'] as const) {
      if (input[key] === undefined) ctx.addIssue({ code: 'custom', path: [key], message: 'Required' });
    }
  } else if (!input.name) {
    for (const key of ['salutation', 'firstName', 'lastName']) ctx.addIssue({ code: 'custom', path: [key], message: 'Required' });
  }
}
function normalizeIdentity<T extends IdentityInput>(input: T) {
  return { ...input, name: input.firstName !== undefined && input.lastName !== undefined ? `${input.firstName} ${input.lastName}` : input.name! };
}

export const bookingSchema = z.object({
  locale: z.enum(locales),
  // Unterstützung beim Selbstbetrieb ist eine unverbindliche Kontaktanfrage.
  option: z.enum(['shared', 'dedicated']),
  term: z.enum(['prepaid', 'monthly']),
  organisation: required(200),
  ...identityFields,
  role: text(120).optional().default(''),
  email: z.email().max(200),
  phone: text(60).optional().default(''),
  street: required(200),
  zip: required(10).regex(/^\d{5}$/),
  city: required(120),
  start: text(20).optional().default(''),
  message: text(4000).optional().default(''),
  consentPrivacy: z.literal(true),
  // Schätzung aus dem Ersparnisrechner (nur zur Information im CRM)
  estimate: z
    .object({ hours: z.number().min(0).max(100000), period: z.enum(['month', 'year']), rate: z.number().min(1).max(1000) })
    .optional(),
  // Spamschutz: verstecktes Feld muss leer bleiben, Formular muss mindestens 3 s offen gewesen sein
  website: z.string().max(500).optional().default(''),
  startedAt: z.number().optional(),
}).superRefine(validateIdentity).transform(normalizeIdentity);

export const contactSchema = z.object({
  locale: z.enum(locales),
  ...identityFields,
  organisation: text(200).optional().default(''),
  email: z.email().max(200),
  category: z.enum(['demo', 'call', 'booking', 'municipal', 'tech', 'selfhosted', 'other']),
  message: required(4000),
  consent: z.literal(true),
  website: z.string().max(500).optional().default(''),
  startedAt: z.number().optional(),
}).superRefine(validateIdentity).transform(normalizeIdentity);

export type BookingInput = z.infer<typeof bookingSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export function looksLikeBot(input: { startedAt?: number }, now = Date.now()): boolean {
  return typeof input.startedAt === 'number' && now - input.startedAt < 3000;
}

export interface BookingPrice {
  monthlyNet: number | null;
  promo: boolean;
  /** Netto-Betrag, der dem Deal als Wert mitgegeben wird (erstes Vertragsjahr). */
  firstYearNet: number | null;
}

export function bookingPrice(option: PlanId, term: 'prepaid' | 'monthly', now = new Date()): BookingPrice {
  const plan = plans.find((p) => p.id === option)!;
  const promo = plan.promo && promotionActive(now) && (!promotion.requiresPrepaid || term === 'prepaid');
  if (plan.monthlyNet === null) return { monthlyNet: null, promo: false, firstYearNet: null };
  return { monthlyNet: plan.monthlyNet, promo, firstYearNet: plan.monthlyNet * (12 - (promo ? promotion.freeMonths : 0)) };
}

/** Kurze, maschinenlesbare Fehlerliste für das Formular: Feldname → Fehlercode */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.code;
  }
  return out;
}
