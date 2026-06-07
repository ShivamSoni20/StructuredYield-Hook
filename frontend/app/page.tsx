import { CTASection, HeroSection, HookPoints, HowItWorks, MechanismSection, StatsRow } from "@/components/LandingSections";
import { Nav } from "@/components/Nav";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-zinc-100">
      <Nav />
      <HeroSection />
      <StatsRow />
      <HowItWorks />
      <MechanismSection />
      <HookPoints />
      <CTASection />
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-zinc-600">
        StructuredYield · Built for UHI9 · Uniswap V4 Hook · June 2026
      </footer>
    </main>
  );
}
