export function toSlug(name: string, city: string, state: string): string {
  return `${name} ${city} ${state}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}