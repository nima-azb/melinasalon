import { Hero } from "@/components/public/home/hero";
import { Services } from "@/components/public/home/services";
import { AIHairdresser } from "@/components/public/home/ai-hairdresser";
import { WhyMelina } from "@/components/public/home/why-melina";
import { Gallery } from "@/components/public/home/gallery";
import { Booking } from "@/components/public/home/booking";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <AIHairdresser />
      <WhyMelina />
      <Gallery />
      <Booking />
    </>
  );
}
