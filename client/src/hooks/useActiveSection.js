// hooks/useActiveSection.js
// "Scroll spy": tells the navbar which home page section you are looking at,
// so its link can be highlighted (e.g. MENU lights up while you're in the menu).
//
// How it works: every time the page scrolls, we measure how much of each section
// is visible on the screen (in pixels). The section that takes up the MOST of the
// screen is the active one. Exception: at the very bottom of the page, the last
// section (Visit Us) is active, because it is short.

import { useEffect, useState } from "react";

export function useActiveSection(sectionIds, enabled) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    // Not on the home page: no section is active
    if (!enabled) {
      setActiveId(null);
      return;
    }

    const updateActive = () => {
      let bestId = null;
      let bestVisible = 0;

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;

        // The part of the section between the top and bottom of the screen
        const box = section.getBoundingClientRect();
        const visible = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);

        if (visible > bestVisible) {
          bestVisible = visible;
          bestId = id;
        }
      });

      // At the very bottom of the page, the LAST section wins: it is short,
      // so it may never take up the most of the screen
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;
      if (atBottom) bestId = sectionIds[sectionIds.length - 1];

      setActiveId(bestId);
    };

    updateActive(); // check once right away
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    // Stop listening when leaving the page
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [sectionIds, enabled]);

  return activeId;
}
