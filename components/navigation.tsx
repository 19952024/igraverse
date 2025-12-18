"use client"

interface NavigationProps {
  onNavigate: (view: string) => void
}

export default function Navigation({ onNavigate }: NavigationProps) {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="brand">
          <div className="brand-badge"></div>
          <div>Igraverse</div>
        </div>
        <div className="links">
          <a onClick={() => onNavigate("home")}>Home</a>
          <a onClick={() => onNavigate("metabuffed")}>MetaBuffed</a>
          <a onClick={() => onNavigate("trueplay")}>TruePlay AI</a>
          <a onClick={() => onNavigate("devtools")}>Dev Tools</a>
          <a onClick={() => onNavigate("gamegen")}>Game Generation</a>
          <a onClick={() => onNavigate("preservation-core")}>Preservation Core</a>
        </div>
      </div>
    </nav>
  )
}
