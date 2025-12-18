"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import HomePage from "@/components/home-page"
import MetaBuffedPage from "@/components/metabuffed-page"
import TruePlayPage from "@/components/trueplay-page"
import DevToolsPage from "@/components/devtools-page"
import GameGenPage from "@/components/gamegen-page"
import PreservationCorePage from "@/components/preservation-core-page"

export default function Page() {
  const [activeView, setActiveView] = useState("home")

  const handleNavigate = (view: string) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      <Navigation onNavigate={handleNavigate} />
      <HomePage active={activeView === "home"} onNavigate={handleNavigate} />
      <MetaBuffedPage active={activeView === "metabuffed"} />
      <TruePlayPage active={activeView === "trueplay"} />
      <DevToolsPage active={activeView === "devtools"} />
      <GameGenPage active={activeView === "gamegen"} />
      <PreservationCorePage active={activeView === "preservation-core"} />
      <footer>© 2025 Igraverse</footer>
    </>
  )
}
