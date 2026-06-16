import { Suspense } from 'react'
import CharacterSelectScreen from '@/components/CharacterSelectScreen'

export default function CharactersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-stone-500 font-mono flex items-center justify-center">
          Bozkır hazırlanıyor...
        </div>
      }
    >
      <CharacterSelectScreen />
    </Suspense>
  )
}
