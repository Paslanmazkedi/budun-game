'use client'

import { useEffect } from 'react'

export type ContextMenuState = {
  x: number
  y: number
  itemId: string
  isEquipped: boolean
} | null

type ItemContextMenuProps = {
  menu: ContextMenuState
  onClose: () => void
  onEquip: () => void
  onUnequip: () => void
  onDismantle?: () => void
  canEquip: boolean
  canDismantle?: boolean
}

export default function ItemContextMenu({
  menu,
  onClose,
  onEquip,
  onUnequip,
  onDismantle,
  canEquip,
  canDismantle = false,
}: ItemContextMenuProps) {
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu, onClose])

  if (!menu) return null

  const style = {
    left: Math.min(menu.x, window.innerWidth - 200),
    top: Math.min(menu.y, window.innerHeight - 220),
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden />
      <div
        className="fixed z-[70] min-w-[168px] py-1 rounded-xl border border-stone-700 bg-stone-950 shadow-2xl animate-slide-up"
        style={style}
        role="menu"
      >
        {menu.isEquipped ? (
          <MenuBtn onClick={onUnequip}>Çıkar</MenuBtn>
        ) : (
          <>
            {canEquip && <MenuBtn onClick={onEquip}>Kuşan</MenuBtn>}
            {canDismantle && onDismantle && (
              <MenuBtn onClick={onDismantle} className="text-orange-300 hover:text-orange-200">
                Parçala
              </MenuBtn>
            )}
          </>
        )}
        <MenuBtn onClick={onClose} muted>İptal</MenuBtn>
      </div>
    </>
  )
}

function MenuBtn({
  children,
  onClick,
  muted,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  muted?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-xs font-mono transition ${
        muted
          ? 'text-stone-600 hover:text-stone-400'
          : `text-stone-200 hover:bg-stone-800 hover:text-amber-300 ${className}`
      }`}
    >
      {children}
    </button>
  )
}
