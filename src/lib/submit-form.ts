// Browser-seitiges Absenden der Formulare an /api/… mit barrierefreier Statusmeldung.

export interface SubmitTexts {
  sending: string;
  invalid: string;
  notConfigured: string;
  failed: string;
  fieldInvalid: string;
  partial: string;
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
  let inFlight = false;
  let finished = false;
  const focusField = (el: HTMLInputElement) => {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'center' });
  };

  const clearFieldError = (el: HTMLInputElement) => {
    el.removeAttribute('aria-invalid');
    const id = el.dataset.errorId;
    if (id) {
      document.getElementById(id)?.remove();
      const describedBy = (el.getAttribute('aria-describedby') ?? '').split(' ').filter((value) => value && value !== id);
      if (describedBy.length) el.setAttribute('aria-describedby', describedBy.join(' '));
      else el.removeAttribute('aria-describedby');
      delete el.dataset.errorId;
    }
  };

  const markField = (el: HTMLInputElement) => {
    clearFieldError(el);
    const error = document.createElement('span');
    error.id = `${form.id || 'form'}-${el.name}-error`;
    error.className = 'field-error';
    error.textContent = el.validationMessage || options.texts.fieldInvalid;
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', [el.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    el.dataset.errorId = error.id;
    el.closest('label')?.append(error);
  };

  const show = (message: string, kind: 'info' | 'error') => {
    status.hidden = false;
    status.textContent = message;
    status.dataset.kind = kind;
    status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  };

  form.addEventListener('input', (event) => {
    const el = event.target as HTMLInputElement;
    if (el.hasAttribute('aria-invalid')) clearFieldError(el);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (inFlight || finished) return;
    // Eigene Prüfung statt Browser-Blase: Meldung im Statusfeld, Felder markiert, Fokus aufs erste.
    const invalid = (Array.from(form.elements) as HTMLInputElement[]).filter((el) => el.willValidate && !el.checkValidity());
    form.querySelectorAll<HTMLInputElement>('[aria-invalid]').forEach(clearFieldError);
    if (invalid.length) {
      invalid.forEach(markField);
      show(options.texts.invalid, 'error');
      focusField(invalid[0]);
      return;
    }
    inFlight = true;
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
        finished = true;
        status.hidden = true;
        options.onSuccess(result);
        return;
      }
      if (result.error === 'partial' && typeof result.number === 'string') {
        finished = true;
        show(options.texts.partial.replace('{number}', result.number), 'error');
        return;
      }
      const message =
        result.error === 'invalid' ? options.texts.invalid : result.error === 'not_configured' ? options.texts.notConfigured : options.texts.failed;
      show(message, 'error');
      // Fokus auf das erste vom Server bemängelte Feld
      const fields = result.fields as Record<string, string> | undefined;
      const invalidFields = Object.keys(fields ?? {}).flatMap((name) => {
        const el = form.querySelector<HTMLInputElement>(`[name="${CSS.escape(name)}"]`);
        return el ? [el] : [];
      });
      invalidFields.forEach(markField);
      if (invalidFields[0]) focusField(invalidFields[0]);
    } catch {
      show(options.texts.failed, 'error');
    } finally {
      inFlight = false;
      button.disabled = finished;
      button.removeAttribute('aria-busy');
    }
  });
}
