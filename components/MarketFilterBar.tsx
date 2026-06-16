'use client'

import { useEffect, useRef, useState } from 'react'
import { MARKET_CATEGORIES } from '@/lib/market'
import {
  MARKET_RARITY_FILTERS,
  MARKET_SUBTYPES,
  SELECTABLE_MARKET_RARITIES,
  type MarketSubtypeId,
  type SelectableMarketCategory,
} from '@/lib/market-filters'
import { getRarityDef, type ItemRarityId } from '@/lib/item-rarity'

type MarketFilterBarProps = {
  search: string
  onSearchChange: (value: string) => void
  weaponFilter: MarketSubtypeId[] | null
  onWeaponFilterChange: (value: MarketSubtypeId[] | null) => void
  armorFilter: MarketSubtypeId[] | null
  onArmorFilterChange: (value: MarketSubtypeId[] | null) => void
  accessoryFilter: MarketSubtypeId[] | null
  onAccessoryFilterChange: (value: MarketSubtypeId[] | null) => void
  rarities: ItemRarityId[]
  onRaritiesChange: (rarities: ItemRarityId[]) => void
  layout?: 'bar' | 'sidebar'
}

const CATEGORY_META: Record<
  SelectableMarketCategory,
  { label: string; icon: string; allLabel: string }
> = {
  weapon: { label: 'Silah', icon: '🗡️', allLabel: 'Tüm silahlar' },
  armor: { label: 'Zırh', icon: '🛡️', allLabel: 'Tüm zırhlar' },
  accessory: { label: 'Takı', icon: '💍', allLabel: 'Tüm takılar' },
}

const RARITY_OPTIONS = MARKET_RARITY_FILTERS.filter((r) => r.id !== 'all')

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function FilterMultiDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
  summaryAll,
  getLabel,
  getIcon,
  getOptionClass,
}: {
  label: string
  options: T[]
  selected: T[]
  onChange: (values: T[]) => void
  summaryAll: string
  getLabel: (id: T) => string
  getIcon?: (id: T) => string
  getOptionClass?: (id: T) => string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const allSelected = selected.length === 0 || selected.length === options.length
  const summary = allSelected ? summaryAll : selected.map((id) => getLabel(id)).join(', ')

  return (
    <div ref={rootRef} className="relative">
      <p className="text-[9px] font-mono text-stone-600 uppercase tracking-widest mb-1.5">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-stone-800 bg-stone-950/60 text-left text-[11px] font-mono text-stone-300 hover:border-stone-700 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate min-w-0">
          {allSelected ? (
            summary
          ) : getOptionClass ? (
            <span className="flex flex-wrap gap-x-1.5 gap-y-0.5">
              {selected.map((id) => (
                <span key={id} className={getOptionClass(id)}>{getLabel(id)}</span>
              ))}
            </span>
          ) : (
            summary
          )}
        </span>
        <span className="text-stone-500 shrink-0 text-[10px]" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-stone-700 bg-stone-950 shadow-xl overflow-hidden"
          role="listbox"
          aria-multiselectable="true"
        >
          <div className="flex gap-1 p-2 border-b border-stone-800">
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex-1 py-1.5 rounded-lg border border-stone-800 text-[9px] font-mono uppercase text-stone-400 hover:text-stone-200 hover:border-stone-600"
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => onChange([...options])}
              className="flex-1 py-1.5 rounded-lg border border-stone-800 text-[9px] font-mono uppercase text-stone-400 hover:text-stone-200 hover:border-stone-600"
            >
              Hepsini seç
            </button>
          </div>
          <ul className="max-h-52 overflow-y-auto game-scroll py-1">
            {options.map((id) => {
              const checked = selected.length === 0 || selected.includes(id)
              const optionClass = getOptionClass?.(id) ?? 'text-stone-300'
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => {
                      if (selected.length === 0) {
                        onChange(options.filter((o) => o !== id))
                        return
                      }
                      const next = toggleInList(selected, id)
                      if (next.length === options.length) onChange([])
                      else onChange(next)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-mono transition-colors ${
                      checked
                        ? 'bg-amber-950/30'
                        : 'hover:bg-stone-900/80'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[9px] ${
                        checked
                          ? 'border-amber-600/60 bg-amber-950/50 text-amber-400'
                          : 'border-stone-700 bg-stone-900'
                      }`}
                      aria-hidden
                    >
                      {checked ? '✓' : ''}
                    </span>
                    {getIcon?.(id) && <span className="shrink-0">{getIcon(id)}</span>}
                    <span className={`truncate ${checked ? optionClass : 'text-stone-400'}`}>
                      {getLabel(id)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function CategorySubtypeDropdown({
  category,
  selected,
  onChange,
}: {
  category: SelectableMarketCategory
  selected: MarketSubtypeId[] | null
  onChange: (value: MarketSubtypeId[] | null) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const meta = CATEGORY_META[category]
  const subtypes = MARKET_SUBTYPES[category]
  const optionIds = subtypes.map((s) => s.id)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const summary =
    selected === null
      ? 'Tümü'
      : selected.length === 0
        ? meta.allLabel
        : selected
            .map((id) => subtypes.find((s) => s.id === id)?.label ?? id)
            .join(', ')

  return (
    <div ref={rootRef} className="relative">
      <p className="text-[9px] font-mono text-stone-600 uppercase tracking-widest mb-1.5">
        {meta.label} filtresi
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-stone-800 bg-stone-950/60 text-left text-[11px] font-mono text-stone-300 hover:border-stone-700 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate flex items-center gap-1.5 min-w-0">
          <span className="shrink-0">{meta.icon}</span>
          <span className="truncate">{summary}</span>
        </span>
        <span className="text-stone-500 shrink-0 text-[10px]" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-stone-700 bg-stone-950 shadow-xl overflow-hidden"
          role="listbox"
          aria-multiselectable="true"
        >
          <div className="flex gap-1 p-2 border-b border-stone-800">
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className="flex-1 py-1.5 rounded-lg border border-stone-800 text-[9px] font-mono uppercase text-stone-400 hover:text-stone-200 hover:border-stone-600"
            >
              Filtre yok
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex-1 py-1.5 rounded-lg border border-stone-800 text-[9px] font-mono uppercase text-stone-400 hover:text-stone-200 hover:border-stone-600"
            >
              {meta.allLabel}
            </button>
          </div>
          <ul className="max-h-52 overflow-y-auto game-scroll py-1">
            {subtypes.map((sub) => {
              const checked =
                selected !== null &&
                (selected.length === 0 || selected.includes(sub.id))
              return (
                <li key={sub.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => {
                      if (selected === null) {
                        onChange([sub.id])
                        return
                      }
                      if (selected.length === 0) {
                        onChange(optionIds.filter((id) => id !== sub.id))
                        return
                      }
                      const next = toggleInList(selected, sub.id)
                      if (next.length === 0) onChange([])
                      else if (next.length === optionIds.length) onChange([])
                      else onChange(next)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-mono transition-colors ${
                      checked
                        ? 'bg-amber-950/30 text-amber-300'
                        : 'text-stone-400 hover:bg-stone-900/80 hover:text-stone-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[9px] ${
                        checked
                          ? 'border-amber-600/60 bg-amber-950/50 text-amber-400'
                          : 'border-stone-700 bg-stone-900'
                      }`}
                      aria-hidden
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <span className="shrink-0">{sub.emoji}</span>
                    <span className="truncate">{sub.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MarketFilterBar({
  search,
  onSearchChange,
  weaponFilter,
  onWeaponFilterChange,
  armorFilter,
  onArmorFilterChange,
  accessoryFilter,
  onAccessoryFilterChange,
  rarities,
  onRaritiesChange,
  layout = 'bar',
}: MarketFilterBarProps) {
  const sidebar = layout === 'sidebar'

  const hasActiveFilters =
    weaponFilter !== null ||
    armorFilter !== null ||
    accessoryFilter !== null ||
    rarities.length > 0 ||
    search.trim().length > 0

  function clearFilters() {
    onSearchChange('')
    onWeaponFilterChange(null)
    onArmorFilterChange(null)
    onAccessoryFilterChange(null)
    onRaritiesChange([])
  }

  return (
    <div
      className={`space-y-3 rounded-xl border border-stone-800/80 bg-stone-900/40 p-3 ${
        sidebar ? 'lg:flex-1 lg:min-h-0' : ''
      }`}
    >
      <div>
        <p className="text-[9px] font-mono text-stone-600 uppercase tracking-widest mb-1.5">Arama</p>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Eşya veya satıcı ara…"
          className="w-full bg-stone-950/60 border border-stone-800 rounded-xl px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700/50 font-mono"
        />
      </div>

      <CategorySubtypeDropdown
        category="weapon"
        selected={weaponFilter}
        onChange={onWeaponFilterChange}
      />
      <CategorySubtypeDropdown
        category="armor"
        selected={armorFilter}
        onChange={onArmorFilterChange}
      />
      <CategorySubtypeDropdown
        category="accessory"
        selected={accessoryFilter}
        onChange={onAccessoryFilterChange}
      />

      <FilterMultiDropdown<ItemRarityId>
        label="Nadirlik"
        options={SELECTABLE_MARKET_RARITIES}
        selected={rarities}
        onChange={onRaritiesChange}
        summaryAll="Tüm nadirlikler"
        getLabel={(id) => RARITY_OPTIONS.find((r) => r.id === id)?.label ?? id}
        getOptionClass={(id) => getRarityDef(id).textClass}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full py-2 rounded-xl border border-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-300 hover:border-stone-600 transition-colors"
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  )
}
