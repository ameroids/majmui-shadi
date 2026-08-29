const styles = {
  Draft: 'bg-ivory-line text-ink/70',
  Ready: 'bg-gold-light text-emerald-deep',
  'WhatsApp Opened': 'bg-emerald-soft text-emerald-deep',
  Sent: 'bg-emerald-deep text-ivory',
  'Not Invited': 'bg-ivory-line text-ink/60',
  default: 'bg-ivory-line text-ink/70',
}

export default function Badge({ children, tone }) {
  const style = styles[tone] || styles.default
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {children}
    </span>
  )
}
