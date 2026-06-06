'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function OtagHudClient({ character, xpPercentage, nextLevelXpTarget }: any) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* MENÜYÜ TETİKLEYEN ASİL SAĞ ÜST BUTON */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-amber-800/90 hover:bg-amber-700 text-stone-100 font-mono text-xs font-bold px-4 py-2.5 rounded border border-amber-900/40 shadow-xl tracking-widest uppercase transition-all backdrop-blur-sm"
        >
          {isOpen ? 'Otağı Seyret 👁️' : 'Oba Yönetimi 🏕️'}
        </button>
      </div>

      {/* HER AN ALTA SABİT SAKİN XP BAR BARBARI */}
      <div 
        className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 z-20 bg-stone-950/80 backdrop-blur border border-stone-900 p-3 rounded-xl shadow-2xl transition-all duration-300"
        style={{ opacity: isOpen ? 0.2 : 0.95 }}
      >
        <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-stone-400">
          <span>DENEYİM (XP)</span>
          <span>{character?.xp ?? 0} / {Math.floor(nextLevelXpTarget)}</span>
        </div>
        <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden p-0.5 border border-stone-800">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full" style={{ width: `${xpPercentage}%` }} />
        </div>
      </div>

      {/* SİNEMATİK SAĞ SEFER ODASI PANELİ */}
      <div className={`absolute inset-y-0 right-0 w-full md:w-[420px] bg-stone-950/95 border-l border-stone-900/80 z-30 shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-md transform transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6 pt-24 font-mono">
          
          {/* SEFER ODASI EYLEMLERİ */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-amber-500/80 tracking-widest uppercase block">静态 🗺️ SEFER ODASI EYLEMLERİ</span>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/quests" className="p-3 rounded-lg bg-stone-900/60 border border-stone-850 hover:border-amber-900/60 flex flex-col transition-colors group">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">📜</span>
                <span className="text-xs font-bold text-stone-200">Göreve Git</span>
              </Link>
              <Link href="/battle" className="p-3 rounded-lg bg-stone-900/60 border border-stone-850 hover:border-red-900/60 flex flex-col transition-colors group">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">⚔️</span>
                <span className="text-xs font-bold text-stone-200">Savaş Meydanı</span>
              </Link>
              <Link href="/market" className="p-3 rounded-lg bg-stone-900/60 border border-stone-850 hover:border-amber-600 flex flex-col transition-colors group">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">⚖️</span>
                <span className="text-xs font-bold text-stone-200">Pazar Yeri</span>
              </Link>
              <Link href="/inventory" className="p-3 rounded-lg bg-stone-900/60 border border-stone-850 hover:border-cyan-900/60 flex flex-col transition-colors group">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">🎒</span>
                <span className="text-xs font-bold text-stone-200">Heybe</span>
              </Link>
            </div>
          </div>

          {/* KUTLU NİTELİKLER */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-stone-500 tracking-widest uppercase block">📊 KUTLU NİTELİKLER</span>
            <div className="bg-stone-900/40 border border-stone-900 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-stone-950/40 rounded border border-stone-900/60">
                <span className="text-stone-400">Güç (STR)</span>
                <span className="font-bold text-red-400">{character?.strength ?? 10}</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950/40 rounded border border-stone-900/60">
                <span className="text-stone-400">Çeviklik (AGI)</span>
                <span className="font-bold text-emerald-400">{character?.agility ?? 10}</span>
              </div>
              <div className="flex justify-between p-2 bg-stone-950/40 rounded border border-stone-900/60">
                <span className="text-stone-400">Zeka (INT)</span>
                <span className="font-bold text-cyan-400">{character?.intelligence ?? 10}</span>
              </div>
              <div className="flex justify-between p-2 bg-amber-950/20 rounded border border-amber-900/30 font-bold text-amber-500 text-[11px] mt-2">
                <span>SAVAŞ KUDRETİ</span>
                <span>{character?.power_score ?? 120}</span>
              </div>
            </div>
          </div>

          {/* OBA DEVLETİ */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-stone-500 tracking-widest uppercase block">🏕️ OBA VE KLAN</span>
            <div className="bg-stone-900/40 border border-stone-900 rounded-xl p-3 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-stone-300">Ötüken Muhafızları</p>
                <p className="text-[9px] text-stone-600 font-serif italic mt-0.5">"Töre neyse o kılınır."</p>
              </div>
              <div className="text-right">
                <span className="text-stone-600 block text-[9px]">KUT ETKİSİ</span>
                <span className="text-amber-500 font-bold">1,450</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}