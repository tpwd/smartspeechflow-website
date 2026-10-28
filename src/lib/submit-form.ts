// Browser-seitiges Absenden der Formulare an /api/… mit barrierefreier Statusmeldung.

export interface SubmitTexts {
  sending: string;
  invalid: string;
  notConfigured: string;
  failed: string;
}

export interface SubmitResult {
  ok: boolean;
  [key: string]: unknown;
}

/** Formularfelder in ein JSON-Objekt übernehmen (Checkboxen als true/false, Zahlen bleiben Text). */
export function formToObject(form: HTMLFormElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const el of Array.from(form.elements) as HTMLInputElement[]) {
    if (!el.name || el.disabled) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
    else out[el.name] = el.value;
  }
  return out;
}

export function setupForm(
  form: HTMLFormElement,
  options: { endpoint: string; locale: string; texts: SubmitTexts; extra?: () => Record<string, unknown>; onSuccess: (result: SubmitResult) => void },
) {
  const startedAt = Date.now();
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  const show = (message: string, kind: 'info' | 'error') => {
    status.hidden = false;
    status.textContent = message;
    status.dataset.kind = kind;
    status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  };

  form.addEventListener('input', (event) => {
    const el = event.target as HTMLInputElement;
    if (el.hasAttribute('aria-invalid') && el.checkValidity()) el.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Eigene Prüfung statt Browser-Blase: Meldung im Statusfeld, Felder markiert, Fokus aufs erste.
    const invalid = (Array.from(form.elements) as HTMLInputElement[]).filter((el) => el.willValidate && !el.checkValidity());
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (invalid.length) {
      invalid.forEach((el) => el.setAttribute('aria-invalid', 'true'));
      show(options.texts.invalid, 'error');
      invalid[0].focus();
      return;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    show(options.texts.sending, 'info');
    try {
      const res = await fetch(options.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...formToObject(form), ...options.extra?.(), locale: options.locale, startedAt }),
      });
      const result = (await res.json().catch(() => ({ ok: false }))) as SubmitResult;
      if (res.ok && result.ok) {
        status.hidden = true;
        options.onSuccess(result);
        return;
      }
      const message =
        result.error === 'invalid' ? options.texts.invalid : result.error === 'not_configured' ? options.texts.notConfigured : options.texts.failed;
      show(message, 'error');
      // Fokus auf das erste vom Server bemängelte Feld
      const fields = result.fields as Record<string, string> | undefined;
      const first = fields ? form.querySelector<HTMLElement>(`[name="${Object.keys(fields)[0]}"]`) : null;
      if (first) {
        first.setAttribute('aria-invalid', 'true');
        first.focus();
      }
    } catch {
      show(options.texts.failed, 'error');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
}
