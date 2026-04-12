import Hero from "@/components/landing/Hero";
import Problems from "@/components/landing/Problems";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problems />
      <Features />
      <HowItWorks />
      <Benefits />
      <FAQ />
      <CTA />
    </>
  );
}
