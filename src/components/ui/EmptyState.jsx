export default function EmptyState({ icon = '✧', title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-14 px-6">
      <div className="h-12 w-12 rounded-full bg-emerald-soft text-emerald-deep flex items-center justify-center text-xl">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-emerald-deep">{title}</h3>
      {description && <p className="text-sm text-ink/60 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
