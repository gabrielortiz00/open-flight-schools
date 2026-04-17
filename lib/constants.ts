export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CERT_OPTIONS = ["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP", "REC", "SPORT", "HELI"] as const;
export const VALID_CERTS = new Set<string>(CERT_OPTIONS);

export const SPECIALTY_OPTIONS = [
  { value: "mountain_flying",  label: "Mountain Flying" },
  { value: "upset_recovery",   label: "Upset Recovery (UPRT)" },
  { value: "aerobatics",       label: "Aerobatics" },
  { value: "seaplane",         label: "Seaplane" },
  { value: "tailwheel",        label: "Tailwheel" },
  { value: "ski_flying",       label: "Ski Flying" },
  { value: "night_vision",     label: "Night Vision Goggle" },
  { value: "fire_fighting",    label: "Fire Fighting" },
] as const;
export const VALID_SPECIALTIES = new Set<string>(SPECIALTY_OPTIONS.map((s) => s.value));

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;
export const VALID_STATES = new Set<string>(US_STATES);
