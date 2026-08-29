// Signature element: a repeating scalloped-arch silhouette, referencing the
// arch shapes on a wedding card / mihrab, used as a quiet structural divider
// instead of a generic gradient rule.
export default function ArchMotif({ color = '#C9A24B', className = '', height = 14 }) {
  const arch = (key) => (
    <svg key={key} width="28" height={height} viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 14 C0 6.268 6.268 0 14 0 C21.732 0 28 6.268 28 14"
        stroke={color}
        strokeWidth="1.4"
      />
    </svg>
  )
  const count = 26
  return (
    <div className={`arch-row ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => arch(i))}
    </div>
  )
}
