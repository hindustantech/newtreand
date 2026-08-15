export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function uniqueSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

export function makeUniqueSlug(name) {
  const base = slugify(name) || 'playlist';
  return `${base}-${uniqueSuffix()}`;
}