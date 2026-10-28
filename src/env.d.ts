interface ImportMetaEnv {
  readonly PUBLIC_NOINDEX?: string;
  readonly PUBLIC_BOOKING_ENDPOINT?: string;
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
