export function getAssetUrl(path: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${cleanPath}`;
}

export function getImageUrl(imageName: string): string {
  if (!imageName) return '';
  return getAssetUrl(`images/${imageName}`);
}