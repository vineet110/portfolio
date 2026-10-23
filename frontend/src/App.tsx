import { Navigation } from "./sections/Navigation"
import { Hero } from "./sections/Hero"
import { Marquee } from "./components/Marquee"
import { SelectedWork } from "./sections/SelectedWork"
import { Services } from "./sections/Services"
import { Process } from "./sections/Process"
import { FinalCta } from "./sections/FinalCta"
import { Footer } from "./sections/Footer"
import { ChatWidget } from "./components/ChatWidget"

const marqueeItems = ["websites", "mobile apps", "ui/ux design", "we make websites and apps"]

function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main>
        <Hero />
        <Marquee items={marqueeItems} />
        <SelectedWork />
        <Services />
        <Process />
        <FinalCta />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default App
