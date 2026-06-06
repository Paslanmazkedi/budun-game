import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// GameNav removed as inventory page now uses its own layout without bottom navigation

export default async function InventoryPage() {
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

  if (!character) return <div className="p-8 text-stone-600 font-mono bg-stone-950 min-h-screen">Karakter yükleniyor...</div>

  const currentLevel = character.level ?? 1
  const nextLevelXpTarget = currentLevel * 50 * (1 + currentLevel * 0.15)
  const xpPercentage = Math.min(100, Math.floor(((character.xp ?? 0) / nextLevelXpTarget) * 100))

  const characterGender = character.gender?.toLowerCase() === 'hatun' ? 'hatun' : 'er'
  const silhouettePath = `/images/characters/${characterGender}-base.png`

  const { data: inventoryItems } = await supabase
    .from('character_items')
    .select('id, item_templates(*)')
    .eq('character_id', character.id)

  const totalSlots = 24
  const filledSlots = inventoryItems ?? []
  const emptySlotsCount = Math.max(0, totalSlots - filledSlots.length)
  const emptySlotsArray = Array(emptySlotsCount).fill(null)

  const getRarityClass = (rarity: string) => {
    switch (rarity?.toUpperCase()) {
      case 'DESTANSI': return 'border-orange-700 bg-orange-950/20 text-orange-400 shadow-[0_0_15px_rgba(194,65,12,0.2)]'
      case 'NADİR': return 'border-cyan-700 bg-cyan-950/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
      case 'SIRADAN': default: return 'border-stone-800 bg-stone-900/40 text-stone-300'
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-stone-950 text-stone-200 antialiased">
  {/* GameNav removed; navigation handled by parent dashboard */}

      <div className="flex-1 flex flex-col min-w-0 border-l border-stone-900/60">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {/* Üst Başlık */}
          <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-serif font-black tracking-widest text-stone-300 bg-gradient-to-r from-stone-200 to-stone-500 bg-clip-text text-transparent">
                HEYBE & TEÇHİZAT
              </h1>
              <p className="text-[11px] text-stone-500 font-mono uppercase tracking-widest mt-1">Gök Börülerin Savaş Donanımı</p>
            </div>
            <div className="flex items-center gap-2 bg-stone-900/60 px-4 py-1.5 rounded border border-stone-850 text-sm font-mono text-amber-500/90 shadow-[inner_0_1px_3px_rgba(0,0,0,0.8)]">
              <span>🪙</span> <span className="font-bold text-stone-300">{Number(character.gold).toLocaleString()}</span> <span className="text-stone-500 text-xs">Altın</span>
            </div>
          </div>

          {/* İKİLİ PANEL (TEÇHİZAT ODASI & HEYBE) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* SOL PANEL: TEÇHİZAT ODASI - BOYUTU VE ALTLIK AYARLANDI */}
            <div className="xl:col-span-6 bg-gradient-to-b from-stone-900/30 to-stone-950/40 border border-stone-900/80 rounded-lg p-5 flex flex-col justify-between shadow-2xl min-h-[640px] relative overflow-hidden">
              
              <div className="absolute top-3 left-3 text-[10px] font-bold text-stone-500 font-mono uppercase tracking-widest bg-stone-950/80 px-2 py-0.5 rounded border border-stone-900/60 z-20">
                Techizat
              </div>
              
              {/* Karakter Silüeti - AYAKLARIN KESİLMEMESİ İÇİN ALTA HİZALANDI VE YÜKSEKLİK OPTİMİZE EDİLDİ */}
              <div className="absolute inset-x-0 top-4 bottom-32 flex items-center justify-center pointer-events-none z-0 px-4">
                <img 
                  src={silhouettePath} 
                  alt={characterGender} 
                  className="h-full max-h-[500px] object-contain object-bottom filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)] mix-blend-lighten"
                />
              </div>

              {/* ÜST KATMAN: SLOTLARIN DAĞILIMI */}
              <div className="w-full flex flex-col justify-between h-full min-h-[590px] z-10 relative">
                
                {/* 1. VE 2. KISIM: YAN SÜTUNLAR */}
                <div className="flex justify-between items-start w-full flex-1 pt-6">
                  
                  {/* [1. KISIM] SOL SÜTUN: SİLAH VE ZIRHLAR */}
                  <div className="flex flex-col gap-4 bg-stone-950/50 p-2.5 rounded-lg border border-stone-900/80 backdrop-blur-[2px] w-20 items-center">
                    <div className="text-[8px] font-black font-mono text-stone-600 tracking-wider mb-1 uppercase"></div>
                    
                    {/* Miğfer */}
                    <div className="w-14 h-14 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-amber-700 transition-all cursor-pointer group">
                      <span className="text-[9px] font-black font-mono text-stone-500 group-hover:text-amber-500">MİĞFER</span>
                    </div>
                    {/* Zırh */}
                    <div className="w-14 h-18 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-amber-700 transition-all cursor-pointer group">
                      <span className="text-[9px] font-black font-mono text-stone-500 group-hover:text-amber-500">ZIRH</span>
                    </div>
                    {/* Pusat (Ana El) */}
                    <div className="w-14 h-18 rounded-md border-2 border-stone-800 bg-stone-950/90 flex flex-col items-center justify-center hover:border-amber-600 transition-all cursor-pointer group">
                      <span className="text-amber-600 font-black text-[11px] font-mono">PUSAT</span>
                    </div>
                    {/* Yan El */}
                    <div className="w-14 h-18 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-amber-700 transition-all cursor-pointer group">
                      <span className="text-[9px] font-black font-mono text-stone-500 group-hover:text-amber-500">YAN EL</span>
                    </div>
                    {/* Çizme */}
                    <div className="w-14 h-14 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-amber-700 transition-all cursor-pointer group">
                      <span className="text-[9px] font-black font-mono text-stone-500 group-hover:text-amber-500">ÇİZME</span>
                    </div>
                  </div>

                  {/* [2. KISIM] SAĞ SÜTUN: TAKILAR VE TEÇHİZATLAR */}
                  <div className="flex flex-col gap-4 bg-stone-950/50 p-2.5 rounded-lg border border-stone-900/80 backdrop-blur-[2px] w-20 items-center">
                    <div className="text-[8px] font-black font-mono text-stone-600 tracking-wider mb-1 uppercase">TAKI</div>
                    
                    {/* Muska */}
                    <div className="w-12 h-12 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-cyan-700 transition-all cursor-pointer group">
                      <span className="text-[8px] font-bold font-mono text-stone-500 group-hover:text-cyan-500">MUSKA</span>
                    </div>
                    {/* Yüzük 1 */}
                    <div className="w-12 h-12 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-cyan-700 transition-all cursor-pointer group">
                      <span className="text-[8px] font-bold font-mono text-stone-500 group-hover:text-cyan-500">YÜZÜK I</span>
                    </div>
                    {/* Yüzük 2 */}
                    <div className="w-12 h-12 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-cyan-700 transition-all cursor-pointer group">
                      <span className="text-[8px] font-bold font-mono text-stone-500 group-hover:text-cyan-500">YÜZÜK II</span>
                    </div>
                    {/* Bileklik */}
                    <div className="w-12 h-12 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-cyan-700 transition-all cursor-pointer group">
                      <span className="text-[8px] font-bold font-mono text-stone-500 group-hover:text-cyan-500">BİLEKLİK</span>
                    </div>
                    {/* Kemer */}
                    <div className="w-12 h-12 rounded-md border border-stone-800 bg-stone-950/80 flex flex-col items-center justify-center hover:border-cyan-700 transition-all cursor-pointer group">
                      <span className="text-[8px] font-bold font-mono text-stone-500 group-hover:text-cyan-500">KEMER</span>
                    </div>
                  </div>

                </div>

                {/* [3. KISIM] ÖZEL KOSTÜM ODASI - ARTIK AYAKLARIN TAMAMEN ALTINDA KALACAK ŞEKİLDE AYRILDI */}
                <div className="w-full bg-stone-950/80 p-3 rounded-md border border-stone-900 shadow-xl backdrop-blur-[4px] mt-8">
                  <div className="text-[8px] font-black font-mono text-stone-500 tracking-widest mb-2 text-center uppercase">🛡️ PREMİUM / KOSTÜM ODASI</div>
                  <div className="flex justify-center gap-6 items-center">
                    {/* At / Binek */}
                    <div className="w-14 h-14 rounded-md border border-amber-950 bg-stone-900/40 flex flex-col items-center justify-center hover:border-amber-600 transition-all cursor-pointer group">
                      <span className="text-sm mb-0.5">🐎</span>
                      <span className="text-[8px] font-black font-mono text-stone-500 group-hover:text-amber-500">BİNEK</span>
                    </div>
                    {/* Pelerin */}
                    <div className="w-14 h-14 rounded-md border border-amber-950 bg-stone-900/40 flex flex-col items-center justify-center hover:border-amber-600 transition-all cursor-pointer group">
                      <span className="text-sm mb-0.5">🧣</span>
                      <span className="text-[8px] font-black font-mono text-stone-500 group-hover:text-amber-500">PELERİN</span>
                    </div>
                    {/* Kostüm */}
                    <div className="w-14 h-14 rounded-md border border-amber-950 bg-stone-900/40 flex flex-col items-center justify-center hover:border-amber-600 transition-all cursor-pointer group">
                      <span className="text-sm mb-0.5">🥋</span>
                      <span className="text-[8px] font-black font-mono text-stone-500 group-hover:text-amber-500">KOSTÜM</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SAĞ PANEL: HEYBE SLOTLARI (SOL PANEL UZADIĞI İÇİN BURAYI DA NİZAMİ BÜYÜTTÜM) */}
            <div className="xl:col-span-6 bg-stone-900/10 border border-stone-900 rounded-lg p-5 flex flex-col shadow-xl min-h-[640px]">
              <div className="flex justify-between items-center border-b border-stone-900 pb-3 mb-4">
                <h4 className="text-xs font-bold font-mono tracking-widest text-stone-400 uppercase flex items-center gap-2">
                  <span className="text-stone-600">⚔️</span> HEYBE BÖLMELERİ
                </h4>
                <span className="text-[10px] text-stone-400 font-mono bg-stone-900/80 px-2 py-0.5 rounded border border-stone-800">
                  {filledSlots.length} / {totalSlots} YUVA
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 flex-1 content-start">
                {filledSlots.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`aspect-square rounded-md border p-1 flex flex-col justify-between items-center text-center shadow-lg relative group hover:scale-105 hover:bg-stone-900/80 transition-all cursor-pointer border-stone-700/80 bg-stone-950/80 ${getRarityClass(item.item_templates.rarity)}`}
                  >
                    <span className="text-xl mt-1">{item.item_templates.slot === 'WEAPON' ? '🗡️' : '🛡️'}</span>
                    <div className="text-[9px] font-bold truncate w-full opacity-80 mb-0.5 font-mono tracking-tight">
                      {item.item_templates.name}
                    </div>
                  </div>
                ))}

                {emptySlotsArray.map((_, index) => (
                  <div 
                    key={`empty-${index}`} 
                    className="aspect-square rounded-md border border-stone-900/80 bg-stone-950/40 shadow-[inner_0_3px_6px_rgba(0,0,0,0.6)] hover:border-stone-800 transition-colors" 
                  />
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}