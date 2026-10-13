// components/MenuCarousel.jsx
// Menu carousel that moves CONSTANTLY, like a conveyor belt (no stops).
// - Pauses while the mouse is over it, so a dish is easy to click
// - Clicking a card calls onSelect(item), so the page can show that dish's details
//
// How the endless loop works:
//   The cards are placed TWICE in a row: [copy 1][copy 2].
//   A CSS animation slides the whole row to the left by exactly half its width
//   (= one copy), then starts again from the beginning. At that moment copy 2 is
//   exactly where copy 1 started, so the restart can't be seen: it looks endless.
//   The movement itself is pure CSS (see .marquee-track in index.css).

import Photo from "./Photo";
import { formatPrice } from "../utils/formatPrice";

// Speed: how many seconds ONE card takes to move past.
// Smaller = faster. The whole loop takes (number of dishes × this) seconds.
const SECONDS_PER_DISH = 6;

function MenuCarousel({ items, onSelect }) {
  if (items.length === 0) return null;

  // The row: the menu twice
  const row = [...items, ...items];

  return (
    <div className="marquee">
      <div className="marquee-viewport">
        <div
          className="marquee-track"
          style={{ "--loop-seconds": `${items.length * SECONDS_PER_DISH}s` }}
        >
          {row.map((item, i) => {
            // Only copy 1 is read out by screen readers and reachable with Tab
            const isCopy = i >= items.length;
            return (
              <button
                key={i}
                type="button"
                className="dish-card"
                onClick={() => onSelect(item)}
                aria-label={`View details: ${item.name}`}
                aria-hidden={isCopy ? true : undefined}
                tabIndex={isCopy ? -1 : undefined}
              >
                <Photo file={item.image} alt={item.name} className="dish-card-photo" />
                <span className="dish-card-info">
                  <span className="dish-card-category">{item.category}</span>
                  <span className="dish-card-name">{item.name}</span>
                  {item.price !== null && (
                    <span className="menu-price">{formatPrice(item.price)}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="carousel-hint muted">Click a dish for details · hover to pause</p>
    </div>
  );
}

export default MenuCarousel;
