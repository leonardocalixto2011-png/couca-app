import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { Pricing } from "@/components/sections/Pricing";
import { CoucaClub } from "@/components/sections/CoucaClub";
import { Gallery } from "@/components/sections/Gallery";
import { Testimonials } from "@/components/sections/Testimonials";
import { InstagramBridge } from "@/components/sections/InstagramBridge";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <PromoBanner />
      <Pricing />
      <CoucaClub />
      <Gallery />
      <Testimonials />
      <InstagramBridge />
    </>
  );
}
