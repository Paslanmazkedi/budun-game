'use client'

import { useState } from 'react'
import LogoutButton from '@/components/LogoutButton'

type Character = {
  name: string
  class: string
  level: number
  xp: number
  gold: number
}

export default function GameNav({ 
  character, 
  nextLevelXpTarget, 
  xpPercentage 
}: { 
  character: Character | null
  nextLevelXpTarget: number
  xpPercentage: number 
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const menuItems = [
    { href: '/', label: 'Otağ (Karakter)', icon: '⛺' },
    { href: '/quests', label: 'Bozkır (Görevler)', icon: '🏹' },
    { href: '/inventory', label: 'Heybe (Envanter)', icon: '💼' },
  ]

  return (
    <>
      {/* ─── MOBİL ÜST BAR (Sadece Ekran Küçükken Görünür - Hamburger Burada) ─── */}
      <div className="md:hidden w-full bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <button 
          onClick={toggleMenu} 
          className="text-stone-200 text-2xl p-2 hover:bg-stone-800 rounded-lg transition-all font-mono"
        >
          {isOpen ? '✕' : '☰'}
        </button>
        <h1 className="text-xl font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-200 bg-clip-text text-transparent">
          BUDUN
        </h1>
        <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold px-2 py-1 rounded font-mono">
          🪙 {character ? Number(character.gold).toLocaleString() : 0}
        </div>
      </div>

      {/* ─── SOL NAVİGASYON PANELİ (Mobilde Açılır Çekmece, Masaüstünde Sabit Sol Sütun) ─── */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 bg-stone-950 border-r border-stone-900/80 flex flex-col justify-between p-6 shadow-2xl z-50 transition-transform duration-300 h-screen
        md:sticky md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Bölümü */}
          <div className="mb-8 border-b border-stone-900 pb-4 text-center relative">
            <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-200 bg-clip-text text-transparent">
              BUDUN
            </h1>
            <p className="text-xs text-stone-600 font-mono tracking-wider mt-1">ONLINE / ALFA V1</p>
            
            {/* Mobilde Kapatma Butonu */}
            <button onClick={toggleMenu} className="md:hidden absolute top-0 right-0 text-stone-500 hover:text-stone-200 text-sm font-mono p-1">
              ✕
            </button>
          </div>

          {/* Menü Linkleri */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <a 
                key={item.href}
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border-l-2 border-transparent hover:border-amber-500 font-medium rounded-r-lg transition-all text-sm"
              >
                <span className="text-base">{item.icon}</span> {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Alt Kısım: Çıkış Yap Butonu */}
        <div className="border-t border-stone-900 pt-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobilde Arka Karartma Perdesi */}
      {isOpen && (
        <div 
          onClick={toggleMenu} 
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40"
        />
      )}
    </>
  )
}