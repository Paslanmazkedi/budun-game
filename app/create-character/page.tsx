"use client"
import { useState, useMemo } from "react"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const GENDERS = {
  ERKEK: {
    label: "Erkek",
    base: "er-base",
    heads: ["er-head-1", "er-head-2", "er-head-3"],
  },
  KADIN: {
    label: "Hatun",
    base: "hatun-base",
    heads: ["hatun-head-1", "hatun-head-2"],
  },
}

// Simple stat generator – in a real app this would be more complex
const generateStats = (gender: keyof typeof GENDERS) => {
  const base = gender === "ERKEK" ? 8 : 6
  return {
    strength: base + Math.floor(Math.random() * 5),
    agility: base + Math.floor(Math.random() * 5),
    intelligence: base + Math.floor(Math.random() * 5),
  }
}

export default function CreateCharacterPage() {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const [gender, setGender] = useState<keyof typeof GENDERS>("ERKEK")
  const [headIndex, setHeadIndex] = useState(0)
  const [name, setName] = useState("")

  const headStyle = GENDERS[gender].heads[headIndex]
  const stats = useMemo(() => generateStats(gender), [gender])

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const cycleHead = (direction: -1 | 1) => {
    const options = GENDERS[gender].heads
    setHeadIndex((i) => {
      const next = i + direction
      if (next < 0) return options.length - 1
      if (next >= options.length) return 0
      return next
    })
  }

  // -----------------------------------------------------------------------
  // Layout – three columns
  // -----------------------------------------------------------------------
  return (
    <div className="flex h-screen bg-stone-950 text-stone-100 font-sans">
      {/* --------------------------------------------------------------- */}
      {/* Left Column – Preview */}
      {/* --------------------------------------------------------------- */}
      <div className="w-1/3 flex items-center justify-center relative bg-stone-900">
        {/* Base body */}
        <img
          src={`/images/characters/${GENDERS[gender].base}.png`}
          alt="body"
          className="absolute w-[250px] h-[250px] object-contain"
        />
        {/* Head overlay */}
        <img
          src={`/images/characters/${headStyle}.png`}
          alt="head"
          className="absolute w-[250px] h-[250px] object-contain"
        />
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Middle Column – Controls */}
      {/* --------------------------------------------------------------- */}
      <div className="w-1/3 p-8 space-y-6">
        <h1 className="text-3xl font-serif text-amber-500 mb-4">
          Kutlu Soy Seçimi
        </h1>

        {/* Gender selector */}
        <div className="flex items-center gap-4 mb-4">
          {Object.entries(GENDERS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => {
                setGender(key as keyof typeof GENDERS)
                setHeadIndex(0)
              }}
              className={`px-4 py-2 border rounded ${gender === key ? "border-amber-500" : "border-stone-700"}`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Head style selector with arrows */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => cycleHead(-1)}
            className="p-2 bg-stone-800 rounded hover:bg-stone-700"
          >
            &lt;
          </button>
          <img
            src={`/images/characters/${headStyle}.png`}
            alt="head preview"
            className="w-24 h-24 object-contain"
          />
          <button
            onClick={() => cycleHead(1)}
            className="p-2 bg-stone-800 rounded hover:bg-stone-700"
          >
            &gt;
          </button>
        </div>

        {/* Name input */}
        <input
          type="text"
          placeholder="Karakter ismi..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-stone-900 border border-stone-700 rounded"
        />
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Right Column – Character Report */}
      {/* --------------------------------------------------------------- */}
      <div className="w-1/3 p-8 space-y-4 bg-stone-900">
        <h2 className="text-2xl font-bold text-amber-400 mb-2">
          {name || "İsimsiz"} – {GENDERS[gender].label}
        </h2>
        {/* Stat bars */}
        {(
          [
            { label: "Güç", value: stats.strength },
            { label: "Çeviklik", value: stats.agility },
            { label: "Zeka", value: stats.intelligence },
          ] as const
        ).map((s) => (
          <div key={s.label} className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
            <div className="w-full bg-stone-800 h-4 rounded">
              <div
                className="h-4 bg-amber-500 rounded"
                style={{ width: `${(s.value / 15) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {/* Historical description */}
        <p className="mt-4 text-sm text-stone-300">
          {gender === "ERKEK"
            ? "Cesur bir savaşçı, tarih boyunca dağların gölgesinde yetişmiş."
            : "Bilge bir hatun, eski efsanelerde adı geçen bir kahraman."}
        </p>
      </div>
    </div>
  )
}