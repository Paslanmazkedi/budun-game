import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Image from 'next/image'
import OtagHudClient from '@/components/OtagHudClient'

export default async function DashboardHome() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .single()

  if (!character) {
    return <div className="p-8 text-stone-500 font-mono bg-stone-950 min-h-screen">Karakter yükleniyor...</div>
  }

  const currentLevel = character.level ?? 1
  const nextLevelXpTarget = currentLevel * 50 * (1 + currentLevel * 0.15)
  const xpPercentage = Math.min(100, Math.floor(((character.xp ?? 0) / nextLevelXpTarget) * 100))

  const characterGender = character.gender?.toLowerCase() === 'hatun' ? 'hatun' : 'er'
  const silhouettePath = `/images/characters/${characterGender}-base.png`
  const bgOtagPath = `/images/backgrounds/otag-bg.png`
  
  // DİNAMİK BİNEK SİSTEMİ
  const activeMount = 'yund' 
  const mountPath = `/images/mounts/${activeMount}.png`

  return (
    <div className="relative h-screen w-full bg-stone-950 text-stone-100 overflow-hidden antialiased flex items-center justify-center">
      
      {/* 1. SİNEMATİK ARKA PLAN KATMANI */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-stone-950">
        <img 
          src={bgOtagPath} 
          alt="İlhanlı Otağı Bozkır" 
          className="w-full h-full object-cover md:object-contain max-w-full max-h-screen select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-stone-950/15 pointer-events-none" />
      </div>

      {/* 2. KAHRAMAN VE SAVAŞ ATI ORTAK KAPSAYICISI */}
      {/* h-[65vh] ile karakterlerin ayak tabanlarını HUD ve alt barların tam üst sınırına sıfırladık */}
      <div className="absolute inset-x-0 bottom-0 md:bottom-[4%] h-[65vh] max-h-[580px] z-10 w-full pointer-events-none select-none">
        
        {/* ========================================================================= */}
        {/* PC SÜRÜMÜ (Masaüstü Nizamı) */}
        {/* ========================================================================= */}
        <div className="hidden md:flex relative w-full h-full max-w-5xl mx-auto items-end justify-center">
          
          {/* PC AT KATMANI - Duman'ın Hemen Sağ Arkasında Heybetli Duran Alp Atı */}
          {/* left-[48%] vererek atı tam ortaya, Duman'ın dirseğinin arkasına çektik */}
          <div className="absolute left-[46%] bottom-0 w-[42%] h-[88%] z-0">
            <Image 
              src={mountPath} 
              alt="Bozkır Atı PC"
              fill
              unoptimized
              className="object-contain object-bottom filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
            />
          </div>

          {/* PC KAHRAMAN KATMANI - Merkezlenmiş İri Cüsseli Savaşçı */}
          <div className="absolute left-[18%] bottom-0 w-[42%] h-[100%] z-10">
            <img 
              src={silhouettePath} 
              alt={character.name} 
              className="h-full w-full object-contain object-bottom filter drop-shadow-[0_25px_40px_rgba(0,0,0,1)]"
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MOBİL SÜRÜMÜ (Telefon Nizamı) */}
        {/* ========================================================================= */}
        <div className="relative w-full h-full flex items-end md:hidden">
          
          {/* MOBİL AT KATMANI - Ne kaçıyor ne büyüyor, tam Duman'ın omuz hizasında */}
          {/* right-[-10px] ile kenara çok az pay bıraktık, w-[68%] ile ekrandan taşmasını önledik */}
          <div className="absolute right-[-10px] bottom-0 w-[68%] h-[84%] z-0">
            <Image 
              src={mountPath} 
              alt="Bozkır Atı Mobil"
              fill
              unoptimized
              className="object-contain object-bottom filter drop-shadow-[0_25px_30px_rgba(0,0,0,0.95)] opacity-95"
            />
          </div>

          {/* MOBİL KAHRAMAN KATMANI - Heybetli Önde Duran Savaşçı */}
          {/* left-[-40px] ile sola yanaştırdık ki sağdaki ata muazzam bir sahne alanı kalsın */}
          <div className="absolute left-[-40px] bottom-0 w-[68%] h-[100%] z-10">
            <img 
              src={silhouettePath} 
              alt={character.name} 
              className="h-full w-full object-contain object-left-bottom filter drop-shadow-[0_30px_35px_rgba(0,0,0,1)]"
            />
          </div>

        </div>

      </div>

      {/* 3. SABİT ÜST OYUN BARI */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-stone-950/70 to-transparent backdrop-blur-[0.5px]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-serif font-black tracking-widest text-base md:text-xl uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {character.name}
            </span>
            <span className="text-[9px] md:text-[10px] font-mono bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
              {character.class}
            </span>
          </div>
          <p className="text-[10px] text-stone-200 font-mono uppercase tracking-widest mt-0.5 hidden sm:block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Seviye {character.level} • Gök Börülerin Savaş Donanımı
          </p>
        </div>

        <div className="bg-stone-950/40 backdrop-blur-md border border-stone-800/40 px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-mono text-xs md:text-sm shadow-2xl flex items-center gap-2">
          <span className="text-amber-400 drop-shadow">🪙 {Number(character.gold).toLocaleString()}</span>
          <span className="text-stone-300 text-[10px] md:text-xs">Akçe</span>
        </div>
      </div>

      {/* 4. İNTERAKTİF HUD KATMANI */}
      <OtagHudClient 
        character={character} 
        xpPercentage={xpPercentage} 
        nextLevelXpTarget={nextLevelXpTarget} 
      />

    </div>
  )
}