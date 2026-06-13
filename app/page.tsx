import { AnnouncementBar } from "@/components/sections/AnnouncementBar";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { IndustryStrip } from "@/components/sections/IndustryStrip";
import { Problem } from "@/components/sections/Problem";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { ProductPreview } from "@/components/sections/ProductPreview";
import { Solution } from "@/components/sections/Solution";
import { CalendarCompare } from "@/components/sections/CalendarCompare";
import { WhoItsFor } from "@/components/sections/WhoItsFor";
import { SoloVsTeam } from "@/components/sections/SoloVsTeam";
import { MobileSection } from "@/components/sections/MobileSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Benefits } from "@/components/sections/Benefits";
import { Waitlist } from "@/components/sections/Waitlist";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <IndustryStrip />
        <Problem />
        <BeforeAfter />
        <ProductPreview />
        <Solution />
        <CalendarCompare />
        <WhoItsFor />
        <SoloVsTeam />
        <MobileSection />
        <HowItWorks />
        <Benefits />
        <Waitlist />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
