export default function Card({ children, className = '', as: Comp = 'div', ...props }) {
  const hasBg = className.includes('bg-')
  return (
    <Comp
      className={`${hasBg ? '' : 'bg-white'} border border-[#E7DCC6] rounded-2xl shadow-card ${className}`}
      {...props}
    >
      {children}
    </Comp>
  )
}
