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

export function preloadCoreImages(): void {
  if (typeof window === 'undefined') return;
  const coreImages = [
    'cg_crisis_start.png',
    'cg_guzheng.png',
    'cg_moon_crisis.png',
    'cg_wandering_earth.png',
    'cg_dimensional_strike.png',
    'cg_droplet_attack.png',
    'cg_deterrence_established.png',
    'cg_deterrence_broken.png',
    'cg_gravitational_broadcast.png',
    'cg_bunker_world.png',
    'cg_galaxy_era.png',
    'cg_stardust_era.png',
    'ending_conquest.png',
    'ending_deterrence.png',
    'unified_luoji_1778921262534.png',
    'unified_beihai_1778921366897.png',
    'unified_wade_1778921437022.png',
    'unified_chengxin_1778921400346.png',
    'unified_tianming_1778921470963.png',
    'unified_linyun_1779691542667.png',
    'unified_sophon_1778921509458.png',
    'character_default.png'
  ];

  coreImages.forEach(img => {
    const url = getImageUrl(img);
    const imageObj = new Image();
    imageObj.src = url;
  });
}