// hooks/useHomeAnimations.js
// All animations of the home page, made with GSAP (https://gsap.com):
//   1. Hero entrance  - POUND, the tagline box, FLATTERIE, then the buttons appear one by one
//   2. Scroll reveal  - section titles, photos, and groups of cards slide up as you scroll to them
//   3. Hero parallax  - the hero photo moves slower than the page, which gives a feeling of depth
//
// Usage in HomePage.jsx:  const pageRef = useRef(null);  useHomeAnimations(pageRef);
// Everything is found INSIDE pageRef only, so other pages are never affected.
// useGSAP() undoes all animations automatically when the page closes.

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Some elements are optional (e.g. the logo image vs. the text logo), so a missing
// element is normal here: don't print a warning for it.
gsap.config({ nullTargetWarn: false });

// Slides one element (or a group, one after another) up into view
// when it is 85% down the screen. Plays once.
const revealOnScroll = (targets, trigger, stagger = 0) =>
  gsap.from(targets, {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    stagger, // seconds between the items of a group
    scrollTrigger: { trigger, start: "top 85%" },
  });

export function useHomeAnimations(scopeRef) {
  useGSAP(
    () => {
      // People who turned off animations in their device settings get none
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ----- 1. Hero entrance: a timeline = animations that play one after another -----
        gsap
          .timeline({ defaults: { duration: 0.9, ease: "power3.out" } })
          .from(".hero-logo, .hero-title-main", { y: 50, opacity: 0, duration: 1.1 })
          .from(".hero-tagline", { scaleX: 0, opacity: 0 }, "-=0.5") // "-=0.5" = start 0.5s early
          .from(".hero-title-sub", { y: 20, opacity: 0 }, "-=0.5")
          .from(".hero-actions .btn", { y: 20, opacity: 0, stagger: 0.15 }, "-=0.4");

        // ----- 3. Hero parallax: the photo layer moves down while you scroll past the hero -----
        gsap.to(".hero-bg", {
          yPercent: 20,
          ease: "none", // constant, tied exactly to the scroll position
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true, // follows the scrollbar instead of playing by itself
          },
        });

        // ----- 2. Scroll reveal -----
        // Section titles (ABOUT US, MENU, BOOK A TABLE, VISIT US)
        gsap.utils.toArray(".section-title").forEach((title) => revealOnScroll(title, title));

        // Single blocks
        gsap.utils
          .toArray(".about-text, .side-photo, .marquee, .booking-form, .location-map")
          .forEach((block) => revealOnScroll(block, block));

        // Groups that appear one by one (stagger)
        [".highlights > *", ".menu-list > li", ".info-cards > *"].forEach((selector) => {
          const items = gsap.utils.toArray(selector);
          if (items.length > 0) revealOnScroll(items, items[0].parentElement, 0.12);
        });
      });
    },
    { scope: scopeRef },
  );
}
