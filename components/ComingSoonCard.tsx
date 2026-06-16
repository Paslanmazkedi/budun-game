import Link from 'next/link'

export default function ComingSoonCard({
  icon,
  title,
  description,
  backHref = '/',
  backLabel = 'Otağa dön',
}: {
  icon: string
  title: string
  description: string
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-8 md:p-10 text-center space-y-4 animate-slide-up">
      <p className="text-5xl">{icon}</p>
      <h2 className="text-lg font-serif text-stone-200 font-bold">{title}</h2>
      <p className="text-sm text-stone-500 font-mono max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      <Link
        href={backHref}
        className="inline-block text-xs font-mono text-amber-500 hover:text-amber-400 border border-amber-900/30 px-4 py-2 rounded-xl transition mt-2"
      >
        ← {backLabel}
      </Link>
    </div>
  )
}
