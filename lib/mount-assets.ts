/** Binek slug → görsel (public/images/mounts) */

export const MOUNT_IMAGES = {
  bozkir: '/images/mounts/yund.png',
  ahalTeke: '/images/mounts/ahalteke.png',
  tulpar: '/images/mounts/tulpar.png',
} as const

/** Heybe / market slot ikonları (tam sahne görselinden ayrı) */
export const MOUNT_ICON_IMAGES = {
  tulpar: '/images/mounts/tulparicon.png',
} as const

/** Slot ikonu ince ayar — scale, kaydırma, max boyut (mount-assets.ts) */
export type MountIconSlotStyle = {
  maxSize: string
  scale: string
  translateX: string
  translateY: string
  objectPosition: string
  objectFit: 'contain' | 'cover'
}

const DEFAULT_ICON_SLOT_STYLE: MountIconSlotStyle = {
  maxSize: '85%',
  scale: '1',
  translateX: '0%',
  translateY: '0%',
  objectPosition: 'center center',
  objectFit: 'contain',
}

const MOUNT_ICON_SLOT_STYLES: Record<
  string,
  Partial<Record<'slot' | 'bag' | 'tooltip', Partial<MountIconSlotStyle>>>
> = {
  [MOUNT_ICON_IMAGES.tulpar]: {
    slot: {
      maxSize: '100%',
      scale: '1.08',
      translateX: '2%',
      translateY: '-3%',
      objectPosition: '54% 47%',
      objectFit: 'cover',
    },
    bag: {
      maxSize: '100%',
      scale: '1.06',
      translateX: '2%',
      translateY: '-3%',
      objectPosition: '54% 47%',
      objectFit: 'cover',
    },
    tooltip: {
      maxSize: '100%',
      scale: '1.04',
      translateX: '1%',
      translateY: '-2%',
      objectPosition: '54% 47%',
      objectFit: 'cover',
    },
  },
}

export function resolveMountIconSlotStyle(
  imageUrl: string,
  size: 'slot' | 'bag' | 'tooltip'
): MountIconSlotStyle {
  const overrides = MOUNT_ICON_SLOT_STYLES[imageUrl]?.[size] ?? {}
  return { ...DEFAULT_ICON_SLOT_STYLE, ...overrides }
}

/** Slug → görsel; eski şablon slug'ları da desteklenir */
const MOUNT_SLUG_TO_IMAGE: Record<string, string> = {
  'mount-bozkir-at': MOUNT_IMAGES.bozkir,
  'mount-normal-steppe': MOUNT_IMAGES.bozkir,
  'at-normal': MOUNT_IMAGES.bozkir,
  'at-common': MOUNT_IMAGES.bozkir,
  'mount-common-horse': MOUNT_IMAGES.bozkir,

  'mount-ahal-teke': MOUNT_IMAGES.ahalTeke,
  'mount-rare-swift': MOUNT_IMAGES.ahalTeke,
  'at-rare': MOUNT_IMAGES.ahalTeke,

  'mount-tulpar': MOUNT_IMAGES.tulpar,
  'mount-unique-tulpar': MOUNT_IMAGES.tulpar,
  'at-unique': MOUNT_IMAGES.tulpar,
  'mount-high-war': MOUNT_IMAGES.tulpar,
  'at-high': MOUNT_IMAGES.tulpar,
  'legacy-mount-bozkir-a102': MOUNT_IMAGES.bozkir,
  'legacy-mount-ahal-a102': MOUNT_IMAGES.ahalTeke,
  'legacy-mount-tulpar-a102': MOUNT_IMAGES.tulpar,
  'legacy-mount-common-a101': MOUNT_IMAGES.bozkir,
  'legacy-mount-war-a101': MOUNT_IMAGES.tulpar,
}

/** Slug → slot ikon görseli */
const MOUNT_SLUG_TO_ICON: Record<string, string> = {
  'mount-tulpar': MOUNT_ICON_IMAGES.tulpar,
  'mount-unique-tulpar': MOUNT_ICON_IMAGES.tulpar,
  'at-unique': MOUNT_ICON_IMAGES.tulpar,
  'mount-high-war': MOUNT_ICON_IMAGES.tulpar,
  'at-high': MOUNT_ICON_IMAGES.tulpar,
  'legacy-mount-tulpar-a102': MOUNT_ICON_IMAGES.tulpar,
}

export function resolveMountIcon(slug: string | null | undefined): string | null {
  if (!slug) return null
  return MOUNT_SLUG_TO_ICON[slug] ?? null
}

function resolveMountImageBySlugHint(slug: string): string | null {
  const s = slug.toLowerCase()
  if (s.includes('tulpar') || s.includes('high-war') || s.includes('at-high')) {
    return MOUNT_IMAGES.tulpar
  }
  if (s.includes('ahal') || s.includes('teke') || s.includes('at-rare')) {
    return MOUNT_IMAGES.ahalTeke
  }
  if (
    s.includes('bozkir') ||
    s.includes('yund') ||
    s.includes('at-normal') ||
    s.includes('at-common') ||
    s.includes('common-horse')
  ) {
    return MOUNT_IMAGES.bozkir
  }
  if (s.startsWith('at-') || s.includes('legacy-mount') || s.includes('mount-')) {
    return MOUNT_IMAGES.bozkir
  }
  return null
}

export function resolveMountImage(slug: string | null | undefined): string | null {
  if (!slug) return null
  return MOUNT_SLUG_TO_IMAGE[slug] ?? resolveMountImageBySlugHint(slug)
}

export function resolveMountImageFromTemplate(
  template: { slug?: string | null } | null | undefined
): string | null {
  if (!template?.slug) return null
  return resolveMountImage(template.slug)
}

// ─── Künye (kimlik) ─────────────────────────────────────────────────────────

/**
 * Künye paneli — Travian tarzı yan yana yerleşim.
 * Değerleri KIMLIK_SCENE_BASE veya binek override'larından düzenleyin.
 */
export type MountKimlikLayout = {
  panelHeightMobile: string
  panelHeightDesktop: string
  sceneFillMobile: string
  sceneFillDesktop: string
  mountHeightMobile: string
  mountHeightDesktop: string
  charHeightMobile: string
  charHeightDesktop: string
  yMobile: string
  yDesktop: string
  overlapMobile: string
  overlapDesktop: string
}

export const KIMLIK_SCENE_BASE: MountKimlikLayout = {
  panelHeightMobile: '340px',
  panelHeightDesktop: '600px',
  sceneFillMobile: '100%',
  sceneFillDesktop: '88%',
  mountHeightMobile: '120%',
  mountHeightDesktop: '100%',
  charHeightMobile: '92%',
  charHeightDesktop: '90%',
  yMobile: '0%',
  yDesktop: '0%',
  overlapMobile: '22%',
  overlapDesktop: '20%',
}

const MOUNT_KIMLIK_OVERRIDES: Record<string, Partial<MountKimlikLayout>> = {
  [MOUNT_IMAGES.bozkir]: {
    overlapMobile: '24%',
    overlapDesktop: '22%',
  },
  [MOUNT_IMAGES.ahalTeke]: {
    overlapMobile: '24%',
    overlapDesktop: '22%',
  },
  [MOUNT_IMAGES.tulpar]: {
    overlapMobile: '26%',
    overlapDesktop: '18%',
    mountHeightMobile: '106%',
    mountHeightDesktop: '110%',
  },
}

export function resolveMountKimlikLayout(src: string): MountKimlikLayout {
  return { ...KIMLIK_SCENE_BASE, ...MOUNT_KIMLIK_OVERRIDES[src] }
}

export function mountKimlikStyleVars(layout: MountKimlikLayout): Record<string, string> {
  return {
    '--panel-h-m': layout.panelHeightMobile,
    '--panel-h-d': layout.panelHeightDesktop,
    '--scene-fill-m': layout.sceneFillMobile,
    '--scene-fill-d': layout.sceneFillDesktop,
    '--mount-h-m': layout.mountHeightMobile,
    '--mount-h-d': layout.mountHeightDesktop,
    '--char-h-m': layout.charHeightMobile,
    '--char-h-d': layout.charHeightDesktop,
    '--mount-ty-m': layout.yMobile,
    '--mount-ty-d': layout.yDesktop,
    '--overlap-m': layout.overlapMobile,
    '--overlap-d': layout.overlapDesktop,
  }
}

// ─── Oba (hero) ───────────────────────────────────────────────────────────────

/** Tek breakpoint için Oba sahne yerleşimi — left veya right kullanın */
export type ObaSceneSide = {
  charLeft: string
  charWidth: string
  charHeight: string
  charTranslateX: string
  charTranslateY: string
  /** mountLeft doluysa mountRight boş bırakılabilir */
  mountLeft: string
  mountRight: string
  mountWidth: string
  mountHeight: string
  mountTranslateX: string
  mountTranslateY: string
}

export type ObaSceneLayout = {
  mobile: ObaSceneSide
  desktop: ObaSceneSide
}

const OBA_DESKTOP_DEFAULT: ObaSceneSide = {
  charLeft: '18%',
  charWidth: '48%',
  charHeight: '100%',
  charTranslateX: '0%',
  charTranslateY: '0%',
  mountLeft: '46%',
  mountRight: '',
  mountWidth: '54%',
  mountHeight: '96%',
  mountTranslateX: '0%',
  mountTranslateY: '0%',
}

const OBA_MOBILE_DEFAULT: ObaSceneSide = {
  charLeft: '-2%',
  charWidth: '72%',
  charHeight: '100%',
  charTranslateX: '0%',
  charTranslateY: '0%',
  mountLeft: '',
  mountRight: '-4%',
  mountWidth: '78%',
  mountHeight: '92%',
  mountTranslateX: '0%',
  mountTranslateY: '0%',
}

export const OBA_SCENE_BASE: ObaSceneLayout = {
  mobile: OBA_MOBILE_DEFAULT,
  desktop: OBA_DESKTOP_DEFAULT,
}

const MOUNT_OBA_OVERRIDES: Record<
  string,
  { mobile?: Partial<ObaSceneSide>; desktop?: Partial<ObaSceneSide> }
> = {
  [MOUNT_IMAGES.tulpar]: {
    mobile: { mountHeight: '94%', mountRight: '-2%' },
    desktop: { mountLeft: '44%', mountWidth: '56%', mountHeight: '98%' },
  },
}

export function resolveObaLayout(mountSrc: string): ObaSceneLayout {
  const overrides = MOUNT_OBA_OVERRIDES[mountSrc]
  return {
    mobile: { ...OBA_MOBILE_DEFAULT, ...overrides?.mobile },
    desktop: { ...OBA_DESKTOP_DEFAULT, ...overrides?.desktop },
  }
}

// ─── Heybe (inventory) — yalnız karakter ────────────────────────────────────

/**
 * Heybe teçhizat alanı — karakter boyutu ve manuel konum.
 * translateX / translateY ile elle kaydırma yapabilirsiniz.
 */
export type InventorySceneLayout = {
  panelMinHeightMobile: string
  panelMinHeightDesktop: string
  charHeightMobile: string
  charHeightDesktop: string
  charMaxWidthMobile: string
  charMaxWidthDesktop: string
  charTranslateXMobile: string
  charTranslateXDesktop: string
  charTranslateYMobile: string
  charTranslateYDesktop: string
}

export const INVENTORY_SCENE_BASE: InventorySceneLayout = {
  panelMinHeightMobile: '200px',
  panelMinHeightDesktop: '240px',
  charHeightMobile: '100%',
  charHeightDesktop: '100%',
  charMaxWidthMobile: '100%',
  charMaxWidthDesktop: '100%',
  charTranslateXMobile: '0%',
  charTranslateXDesktop: '0%',
  charTranslateYMobile: '0%',
  charTranslateYDesktop: '0%',
}

export function resolveInventoryLayout(): InventorySceneLayout {
  return INVENTORY_SCENE_BASE
}

export function inventorySceneStyleVars(layout: InventorySceneLayout): Record<string, string> {
  return {
    '--inv-min-h-m': layout.panelMinHeightMobile,
    '--inv-min-h-d': layout.panelMinHeightDesktop,
    '--inv-char-h-m': layout.charHeightMobile,
    '--inv-char-h-d': layout.charHeightDesktop,
    '--inv-char-max-w-m': layout.charMaxWidthMobile,
    '--inv-char-max-w-d': layout.charMaxWidthDesktop,
    '--inv-char-tx-m': layout.charTranslateXMobile,
    '--inv-char-tx-d': layout.charTranslateXDesktop,
    '--inv-char-ty-m': layout.charTranslateYMobile,
    '--inv-char-ty-d': layout.charTranslateYDesktop,
  }
}
