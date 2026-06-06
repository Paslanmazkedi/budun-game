'use client'

interface GameNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function GameNav({ currentView, onViewChange }: GameNavProps) {
  // Rıhtım (Dock) Menü Elemanları
  const menuItems = [
    { id: 'gorev', icon: '📜', label: 'Görev' },
    { id: 'envanter', icon: '🎒', label: 'Heybe' },
    { id: 'oba', icon: '⛺', label: 'Oba' }, // Ortadaki Ana Merkez
    { id: 'meydan', icon: '⚔️', label: 'Er Meydanı' },
    { id: 'pazar', icon: '⚖️', label: 'Pazar' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-stone-950/95 backdrop-blur-md border-t border-stone-900 z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-150 relative group"
            >
              {/* İkon Alanı */}
              <span className={`text-2xl transition-transform duration-150 ${isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'opacity-60 group-hover:opacity-90'}`}>
                {item.id === 'oba' ? (
                  // Ortadaki ana ikon için özel büyük halka vurgusu
                  <span className={`flex items-center justify-center w-12 h-12 rounded-full border ${isActive ? 'bg-amber-600/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-stone-900 border-stone-800'}`}>
                    {item.icon}
                  </span>
                ) : (
                  item.icon
                )}
              </span>

              {/* İkon Altı Mini Etiket Text */}
              <span className={`text-[9px] font-mono mt-1 tracking-tighter ${isActive ? 'text-amber-500 font-bold' : 'text-stone-500'}`}>
                {item.label}
              </span>

              {/* Aktif Çizgisi */}
              {isActive && item.id !== 'oba' && (
                <span className="absolute bottom-1 w-2 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}