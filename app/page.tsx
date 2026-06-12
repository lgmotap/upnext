import { AnnouncementBar } from "@/components/sections/AnnouncementBar";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { IndustryStrip } from "@/components/sections/IndustryStrip";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Problem } from "@/components/sections/Problem";
import { Solution } from "@/components/sections/Solution";
import { CalendarCompare } from "@/components/sections/CalendarCompare";
import { WhoItsFor } from "@/components/sections/WhoItsFor";
import { ProductPreview } from "@/components/sections/ProductPreview";
import { Benefits } from "@/components/sections/Benefits";
import { SoloVsTeam } from "@/components/sections/SoloVsTeam";
import { MobileSection } from "@/components/sections/MobileSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
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
        <BeforeAfter />
        <Problem />
        <Solution />
        <CalendarCompare />
        <WhoItsFor />
        <ProductPreview />
        <Benefits />
        <SoloVsTeam />
        <MobileSection />
        <HowItWorks />
        <Waitlist />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
