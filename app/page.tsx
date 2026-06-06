'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import OtagHudClient from '@/components/OtagHudClient'
import GameNav from '@/components/GameNav'
import { useRouter } from 'next/navigation'

export default function DashboardHome() {
  const supabase = createClient()
  const router = useRouter()
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false) // Hamburger Menü Kontrolü
  const [view, setView] = useState<string>('oba')

  useEffect(() => {
    async function getCharacter() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setCharacter(data)
      setLoading(false)
    }
    getCharacter()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) return <div className="p-8 text-stone-500 font-mono bg-stone-950 min-h-screen">Karakter yükleniyor...</div>
  if (!character) return <div className="p-8 text-stone-500 font-mono bg-stone-950 min-h-screen">Karakter bulunamadı.</div>

  const currentLevel = character.level ?? 1
  const nextLevelXpTarget = currentLevel * 50 * (1 + currentLevel * 0.15)
  const xpPercentage = Math.min(100, Math.floor(((character.xp ?? 0) / nextLevelXpTarget) * 100))

  // Cinsiyete göre görsel seçimi (Er / Hatun testi için dinamik kalıyor)
  const characterGender = character.gender?.toLowerCase() === 'hatun' ? 'hatun' : 'er'
  const silhouettePath = `/images/characters/${characterGender}-base.png`
  const bgOtagPath = `/images/backgrounds/otag-bg.png`
  const activeMount = 'yund' 
  const mountPath = `/images/mounts/${activeMount}.png`

  return (
    <div className="relative h-screen w-full bg-stone-950 text-stone-100 overflow-hidden antialiased flex items-center justify-center pb-20">
      
      {/* 1. SİNEMATİK OYUN MANZARASI */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-stone-950">
        <img src={bgOtagPath} alt="Otağ" className="w-full h-full object-cover md:object-contain max-w-full max-h-screen select-none pointer-events-none" />
      </div>

      {/* 2. KARAKTER VE AT KATMANI */}
      <div className="absolute inset-x-0 bottom-20 md:bottom-[6%] h-[65vh] max-h-[580px] z-10 w-full pointer-events-none select-none">
        <div className="hidden md:flex relative w-full h-full max-w-5xl mx-auto items-end justify-center">
          <div className="absolute left-[46%] bottom-0 w-[42%] h-[88%] z-0"><Image src={mountPath} alt="At" fill unoptimized className="object-contain object-bottom filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]" /></div>
          <div className="absolute left-[18%] bottom-0 w-[42%] h-[100%] z-10"><img src={silhouettePath} alt="Karakter" className="h-full w-full object-contain object-bottom filter drop-shadow-[0_25px_40px_rgba(0,0,0,1)]" /></div>
        </div>
        <div className="relative w-full h-full flex items-end md:hidden">
          <div className="absolute right-[-10px] bottom-0 w-[68%] h-[84%] z-0"><Image src={mountPath} alt="At Mobil" fill unoptimized className="object-contain object-bottom filter drop-shadow-[0_25px_30px_rgba(0,0,0,0.95)]" /></div>
          <div className="absolute left-[-40px] bottom-0 w-[68%] h-[100%] z-10"><img src={silhouettePath} alt="Karakter Mobil" className="h-full w-full object-contain object-left-bottom filter drop-shadow-[0_30px_35px_rgba(0,0,0,1)]" /></div>
        </div>
      </div>

      {/* 3. ÜST HUD BAR VE YENİ HAMBURGER MENÜ */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 md:p-6 flex justify-between items-start bg-gradient-to-b from-stone-950/80 to-transparent">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-serif font-black tracking-widest text-base md:text-xl uppercase drop-shadow">{character.name}</span>
            <span className="text-[9px] font-mono bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded uppercase tracking-wider">{character.class}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-0.5 hidden sm:block">Seviye {character.level} • Gök Börülerin Savaş Donanımı</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-950/60 backdrop-blur border border-stone-800/40 px-3 py-1.5 rounded-lg font-mono text-xs shadow-2xl">
            <span className="text-amber-400">🪙 {Number(character.gold).toLocaleString()} Akçe</span>
          </div>
          
          {/* Mobil Uyumlu Hamburger Menü Butonu */}
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex flex-col items-center justify-center gap-1 hover:border-amber-500/50 transition-all shadow-xl active:scale-95"
          >
            <span className={`w-4 h-0.5 bg-stone-300 transition-transform ${showSettingsMenu ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`w-4 h-0.5 bg-stone-300 transition-opacity ${showSettingsMenu ? 'opacity-0' : ''}`} />
            <span className={`w-4 h-0.5 bg-stone-300 transition-transform ${showSettingsMenu ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. DIŞARIDAN GELECEK GENİŞLETİLMİŞ HAMBURGER SEÇENEKLERİ MODALI */}
      {showSettingsMenu && (
        <div className="absolute inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-stone-900/95 border border-stone-800 rounded-2xl p-6 shadow-2xl relative">
            
            <button onClick={() => setShowSettingsMenu(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 font-mono text-sm">✕ Kapat</button>
            
            <h2 className="text-amber-500 font-serif text-lg font-bold mb-4 tracking-wider uppercase border-b border-stone-800 pb-2">⚙️ Otağ Kuralları & Ayarlar</h2>

            <div className="space-y-3">
              {/* Karakterler Arası Geçiş Alanı */}
              <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl">
                <p className="text-[10px] font-mono text-stone-500 uppercase mb-2">👥 Karakter Değiştir / Soy Ağacı</p>
                <div className="space-y-1.5">
                  <button className="w-full bg-amber-600/10 border border-amber-600/30 text-amber-500 text-xs py-2 px-3 rounded text-left flex justify-between items-center font-bold">
                    <span>{character.name} ({characterGender === 'hatun' ? 'Hatun' : 'Er'})</span>
                    <span className="text-[10px] bg-amber-500 text-stone-950 px-1.5 rounded font-mono">Aktif</span>
                  </button>
                  
                  {/* Hatun Karakter Test Butonu Yuvası */}
                  <button 
                    onClick={() => alert("Yakında: Yeni Hatun karakter açma ekranına yönlendirileceksiniz.")}
                    className="w-full bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs py-2 px-3 rounded text-left transition flex items-center gap-2 font-mono"
                  >
                    <span>➕ Yeni Hatun Karakter Yarat</span>
                  </button>
                </div>
              </div>

              {/* Hediye Kodu Sistemi */}
              <div>
                <label className="block text-[10px] font-mono text-stone-500 uppercase mb-1">🎁 Hediye / Uluğ Kod Gir</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="KUTLU-BODUN-2026" 
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-300 font-mono uppercase focus:outline-none focus:border-amber-500/50"
                  />
                  <button 
                    onClick={() => alert("Kod başarıyla okundu! Kut hanenize işlendi.")}
                    className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    Ulu
                  </button>
                </div>
              </div>

              <div className="h-px bg-stone-800 my-2" />

              {/* Hesap Değiştirme ve Güvenli Çıkış */}
              <button 
                onClick={handleLogout}
                className="w-full bg-stone-950 hover:bg-red-950/20 border border-stone-800 hover:border-red-900/50 text-stone-400 hover:text-red-400 text-xs font-mono py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                🔄 Google Hesabı Değiştir / Çıkış Yap
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. TRAVIAN PANEL SİSTEMİ (İkonlara tıklandığında açılan pencereler) */}
      {view !== 'oba' && (
        <div className="absolute inset-0 z-30 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-2xl max-h-[70vh] overflow-y-auto relative">
            <button onClick={() => setView('oba')} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 font-mono text-sm">✕ Kapat</button>

            {view === 'gorev' && (
              <div>
                <h3 className="text-amber-500 font-serif text-lg font-bold mb-3">📜 GÖREV YAZITLARI</h3>
                <p className="text-stone-400 text-xs font-mono">Bozkırda töreyi korumak için bilge hakanın emirlerini yerine getir.</p>
              </div>
            )}
            {view === 'envanter' && (
              <div>
                <h3 className="text-amber-500 font-serif text-lg font-bold mb-3">🎒 HEYBE (ENVANTER)</h3>
                <p className="text-stone-400 text-xs font-mono">Kuşandığın zırhlar, kılıçlar ve şifalı otlar burada listelenir.</p>
              </div>
            )}
            {view === 'meydan' && (
              <div>
                <h3 className="text-amber-500 font-serif text-lg font-bold mb-3">⚔️ ER MEYDANI (PVP)</h3>
                <p className="text-stone-400 text-xs font-mono">Diğer boyların alpları ile cenk et, kut kazan.</p>
              </div>
            )}
            {view === 'pazar' && (
              <div>
                <h3 className="text-amber-500 font-serif text-lg font-bold mb-3">⚖️ PAZAR YERİ</h3>
                <p className="text-stone-400 text-xs font-mono">Demirci örsünde dövülen donanımları akçe karşılığı sat veya takas et.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. ALT HUD (XP Barı) */}
      <OtagHudClient character={character} xpPercentage={xpPercentage} nextLevelXpTarget={nextLevelXpTarget} />

      {/* 7. TRAVIAN MOBİL DOCK BAR */}
      <GameNav currentView={view} onViewChange={setView} />

    </div>
  )
}