'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import { characterBaseImage, normalizeGender } from '@/lib/game-assets'
import {
  KIMLIK_SCENE_BASE,
  resolveMountImage,
  mountKimlikStyleVars,
  resolveMountKimlikLayout,
  resolveObaLayout,
  resolveInventoryLayout,
  inventorySceneStyleVars,
  type ObaSceneSide,
} from '@/lib/mount-assets'

type CharacterWithMountProps = {
  gender: string
  characterName: string
  mountSlug?: string | null
  className?: string
  /** inventory = heybe (yalnız karakter), hero = oba, kimlik = künye kartı */
  variant?: 'inventory' | 'hero' | 'kimlik'
}

function obaMountStyle(side: ObaSceneSide): CSSProperties {
  const style: CSSProperties = {
    bottom: 0,
    width: side.mountWidth,
    height: side.mountHeight,
    transform: `translate(${side.mountTranslateX}, ${side.mountTranslateY})`,
  }
  if (side.mountLeft) style.left = side.mountLeft
  if (side.mountRight) style.right = side.mountRight
  return style
}

function obaCharStyle(side: ObaSceneSide): CSSProperties {
  return {
    left: side.charLeft,
    bottom: 0,
    width: side.charWidth,
    height: side.charHeight,
    transform: `translate(${side.charTranslateX}, ${side.charTranslateY})`,
  }
}

export default function CharacterWithMount({
  gender,
  characterName,
  mountSlug,
  className = '',
  variant = 'inventory',
}: CharacterWithMountProps) {
  const g = normalizeGender(gender)
  const charSrc = characterBaseImage(g)
  const mountSrc = variant === 'inventory' ? null : resolveMountImage(mountSlug)

  if (variant === 'inventory') {
    const layout = resolveInventoryLayout()
    const sceneVars = inventorySceneStyleVars(layout)
    return (
      <div
        className={`inventory-scene relative w-full flex items-end justify-center ${className}`}
        style={sceneVars as CSSProperties}
      >
        <img
          src={charSrc}
          alt={characterName}
          className="inventory-char block object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
        />
      </div>
    )
  }

  if (variant === 'kimlik') {
    const layout = mountSrc ? resolveMountKimlikLayout(mountSrc) : KIMLIK_SCENE_BASE
    const sceneVars = mountKimlikStyleVars(layout)

    return (
      <div
        className={`kimlik-scene relative w-full overflow-hidden ${className}`}
        style={sceneVars as CSSProperties}
      >
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="kimlik-scene-fill relative flex items-end justify-center w-full max-w-[520px] mx-auto mount-kimlik-overlap">
            <div className="kimlik-char relative z-10 shrink-0 flex items-end">
              <img
                src={charSrc}
                alt={characterName}
                className="block h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_25px_40px_rgba(0,0,0,1)]"
              />
            </div>
            {mountSrc ? (
              <div className="kimlik-mount-wrap relative z-0 shrink-0 flex items-end mount-kimlik-y">
                <img
                  src={mountSrc}
                  alt=""
                  className="block h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'hero' && mountSrc) {
    const layout = resolveObaLayout(mountSrc)
    const desktop = layout.desktop
    const mobile = layout.mobile

    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="hidden md:block relative w-full h-full max-w-6xl mx-auto">
          <div
            className="absolute z-0 pointer-events-none"
            style={obaMountStyle(desktop)}
          >
            <Image
              src={mountSrc}
              alt=""
              fill
              unoptimized
              className="object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
            />
          </div>
          <div
            className="absolute z-10 pointer-events-none"
            style={obaCharStyle(desktop)}
          >
            <img
              src={charSrc}
              alt={characterName}
              className="h-full w-full object-contain object-bottom drop-shadow-[0_25px_40px_rgba(0,0,0,1)]"
            />
          </div>
        </div>
        <div className="relative w-full h-full md:hidden">
          <div
            className="absolute z-0 pointer-events-none"
            style={obaMountStyle(mobile)}
          >
            <Image
              src={mountSrc}
              alt=""
              fill
              unoptimized
              className="object-contain object-bottom drop-shadow-[0_25px_30px_rgba(0,0,0,0.95)]"
            />
          </div>
          <div
            className="absolute z-10 pointer-events-none"
            style={obaCharStyle(mobile)}
          >
            <img
              src={charSrc}
              alt={characterName}
              className="h-full w-full object-contain object-left-bottom drop-shadow-[0_30px_35px_rgba(0,0,0,1)]"
            />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <img
        src={charSrc}
        alt={characterName}
        className={`h-full w-full object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] ${className}`}
      />
    )
  }

  return (
    <img
      src={charSrc}
      alt={characterName}
      className={`max-h-[280px] sm:max-h-[320px] w-full object-contain object-bottom mx-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] ${className}`}
    />
  )
}
