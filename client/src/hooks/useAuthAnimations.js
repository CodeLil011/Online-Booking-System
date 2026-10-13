// hooks/useAuthAnimations.js
// A SHORT, subtle entrance for the account pages (Login, Register, Forgot / Reset Password),
// made with GSAP. These are task pages, so everything is done in about 0.6 seconds
// and the form can be used right away (the animation never blocks typing).
//   - The photo panel with the logo fades in (only once, when the layout opens)
//   - The form card slides up and fades in, then its fields appear one quick step at a time
//     (again every time you switch page, e.g. Login -> Register)
//
// Usage in AuthLayout.jsx:  const layoutRef = useRef(null);  useAuthAnimations(layoutRef);

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLocation } from "react-router";

gsap.registerPlugin(useGSAP);
gsap.config({ nullTargetWarn: false }); // some pages have fewer parts; that's fine

export function useAuthAnimations(scopeRef) {
  const { pathname } = useLocation();

  // Photo panel: once, when the layout opens
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".auth-photo", { opacity: 0, duration: 0.6, ease: "power2.out" });
        gsap.from(".auth-photo .hero-title > *, .auth-photo-text", {
          y: 16,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.1,
        });
      });
    },
    { scope: scopeRef },
  );

  // Form card: every time the page (URL) changes
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(".auth-card", { y: 24, opacity: 0, duration: 0.45 })
          .from(".auth-card .form > *", { y: 12, opacity: 0, duration: 0.3, stagger: 0.05 }, "-=0.25");
      });
    },
    { scope: scopeRef, dependencies: [pathname], revertOnUpdate: true },
  );
}
