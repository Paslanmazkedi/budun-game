'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const CLASSES = [
  { id: 'ALP', name: 'Alp', desc: 'Güçlü savaşçı', strength: 8, agility: 5, intelligence: 3 },
  { id: 'AVCI', name: 'Avcı', desc: 'Hızlı okçu', strength: 5, agility: 8, intelligence: 3 },
  { id: 'KAM', name: 'Kam', desc: 'Gizemli şaman', strength: 3, agility: 4, intelligence: 9 },
  { id: 'GOLGE', name: 'Gölge', desc: 'Sessiz suikastçı', strength: 5, agility: 7, intelligence: 4 },
]

export default function CreateCharacter() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [gender, setGender] = useState('ERKEK')
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name || !selectedClass) {
      setError('İsim ve sınıf seçimi zorunludur.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const cls = CLASSES.find(c => c.id === selectedClass)!

    const { error } = await supabase.from('characters').insert({
      name,
      gender,
      class: selectedClass,
      level: 1,
      xp: 0,
      gold: 100,
      strength: cls.strength,
      agility: cls.agility,
      intelligence: cls.intelligence,
      power_score: cls.strength + cls.agility + cls.intelligence,
      user_id: user.id,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/')
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Karakter Oluştur</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Karakter Adı</label>
        <input
          className="w-full border rounded p-2 bg-transparent"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Adını gir..."
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Cinsiyet</label>
        <select
          className="w-full border rounded p-2 bg-transparent"
          value={gender}
          onChange={e => setGender(e.target.value)}
        >
          <option value="ERKEK">Erkek</option>
          <option value="KADIN">Kadın</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Sınıf Seç</label>
        <div className="grid grid-cols-2 gap-3">
          {CLASSES.map(cls => (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`border rounded p-3 cursor-pointer ${
                selectedClass === cls.id ? 'border-yellow-400 bg-yellow-400/10' : ''
              }`}
            >
              <p className="font-bold">{cls.name}</p>
              <p className="text-sm opacity-70">{cls.desc}</p>
              <p className="text-xs mt-1">
                GÜÇ {cls.strength} | ÇEV {cls.agility} | ZEK {cls.intelligence}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-yellow-500 text-black font-bold py-3 rounded hover:bg-yellow-400 disabled:opacity-50"
      >
        {loading ? 'Oluşturuluyor...' : 'Karakter Oluştur'}
      </button>
    </main>
  )
}