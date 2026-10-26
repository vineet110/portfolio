import { Navigation } from "./sections/Navigation"
import { Hero } from "./sections/Hero"
import { Marquee } from "./components/Marquee"
import { SelectedWork } from "./sections/SelectedWork"
import { Services } from "./sections/Services"
import { FinalCta } from "./sections/FinalCta"
import { Footer } from "./sections/Footer"
import { ChatWidget } from "./components/ChatWidget"
import { useEffect } from "react"
import { Stack } from "./sections/Stack"
import { Faq } from "./sections/Faq"
import { ScrollProgress } from "./components/ScrollProgress"
import { CustomCursor } from "./components/CustomCursor"
import { CommandPalette } from "./components/CommandPalette"
import { startSmoothScroll } from "./lib/scroll"

const marqueeItems = ["websites", "mobile apps", "ui/ux design", "we make websites and apps"]

function App() {
  useEffect(() => startSmoothScroll(), [])

  return (
    <div className="min-h-screen bg-bg">
      <ScrollProgress />
      <Navigation />
      <main>
        <Hero />
        <Marquee items={marqueeItems} />
        <SelectedWork />
        <Services />
        <Stack />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <ChatWidget />
      <CommandPalette />
      <CustomCursor />
    </div>
  )
}

export default App
