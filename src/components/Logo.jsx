export default function Logo({ tamanho = 40, texto = true }) {
  return (
    <span className="logo">
      <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" role="img" aria-label="Logótipo IG">
        <rect width="48" height="48" rx="11" fill="#14302A" />
        <text x="24" y="31" textAnchor="middle" fontFamily="Figtree, sans-serif" fontWeight="800" fontSize="22" fill="#fff">IG</text>
        <rect x="9" y="37" width="30" height="3" rx="1.5" fill="#E0A100" />
      </svg>
      {texto && <span className="logo-t"><b>Gestão Inteligente</b><small>IG</small></span>}
    </span>
  )
}
