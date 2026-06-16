'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ClanEmblemModal from '@/components/clan/ClanEmblemModal'
import { getClanMemberCap, type ClanRow } from '@/lib/clans'

type ClanHeaderCardProps = {
  clan: ClanRow
  memberCount: number
  canEdit: boolean
  busy: boolean
  onSaveProfile: (data: { description: string; motto: string; emblem: string }) => void
}

export default function ClanHeaderCard({
  clan,
  memberCount,
  canEdit,
  busy,
  onSaveProfile,
}: ClanHeaderCardProps) {
  const [emblemModalOpen, setEmblemModalOpen] = useState(false)
  const [motto, setMotto] = useState(clan.motto ?? '')
  const [description, setDescription] = useState(clan.description ?? '')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setMotto(clan.motto ?? '')
    setDescription(clan.description ?? '')
  }, [clan.motto, clan.description])

  function saveText() {
    onSaveProfile({ description, motto, emblem: clan.emblem })
  }

  function saveEmblem(emblem: string) {
    onSaveProfile({
      description: clan.description ?? '',
      motto: clan.motto ?? '',
      emblem,
    })
    setEmblemModalOpen(false)
  }

  return (
    <>
      <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4">
        <div className="flex items-start gap-3">
          {/* Sol: totem */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-2xl border-2 bg-stone-950/90 shadow-lg ${
                canEdit ? 'border-amber-600/60' : 'border-stone-700'
              }`}
            >
              <span className="text-4xl leading-none">{clan.emblem}</span>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEmblemModalOpen(true)}
                className="w-full px-2 py-1.5 rounded-lg border border-amber-600 bg-amber-950/40 text-amber-300 text-[10px] font-mono font-bold hover:bg-amber-900/50 active:scale-95 transition"
              >
                ✎ Simge Değiştir
              </button>
            )}
          </div>

          {/* Orta: ad + meta */}
          <div className="min-w-0 shrink-0">
            <h2 className="font-serif font-bold text-stone-100 text-lg leading-tight">{clan.name}</h2>
            <p className="text-[10px] font-mono text-stone-500 mt-1">
              Seviye {clan.level}
            </p>
            <p className="text-[10px] font-mono text-stone-500">
              {memberCount}/{getClanMemberCap(clan.level)} üye
            </p>
          </div>

          {/* Sağ: töre + açıklama */}
          <div className="flex-1 min-w-0 pl-1">
            {canEdit ? (
              <div className="space-y-2">
                <input
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  onBlur={saveText}
                  disabled={busy}
                  placeholder="Töre sözü…"
                  maxLength={80}
                  className="w-full bg-stone-950/60 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-[11px] italic text-amber-200/90 placeholder:text-stone-600 focus:border-amber-700/50 focus:outline-none"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveText}
                  disabled={busy}
                  placeholder="Kısa boy açıklaması…"
                  maxLength={120}
                  rows={2}
                  className="w-full bg-stone-950/60 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-400 placeholder:text-stone-600 resize-none focus:border-amber-700/50 focus:outline-none leading-snug"
                />
              </div>
            ) : (
              <div className="text-right space-y-1">
                {clan.motto ? (
                  <p className="text-[11px] text-amber-200/80 italic leading-snug">{clan.motto}</p>
                ) : (
                  <p className="text-[10px] font-mono text-stone-700 italic">—</p>
                )}
                {clan.description ? (
                  <p className="text-[11px] text-stone-400 leading-snug">{clan.description}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {mounted &&
        emblemModalOpen &&
        createPortal(
          <ClanEmblemModal
            key={`${clan.id}-${clan.emblem}`}
            clanLevel={clan.level}
            currentEmblem={clan.emblem}
            busy={busy}
            onClose={() => setEmblemModalOpen(false)}
            onSave={saveEmblem}
          />,
          document.body
        )}
    </>
  )
}
