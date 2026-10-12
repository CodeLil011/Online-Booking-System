// components/MenuCarousel.jsx
// Card carousel for the Menu section: one dish card in the center, in full focus,
// with the previous and next cards peeking in (cut off) at the left and right edges.
// It moves by itself: shows a dish, then slides to the next one, forever.
// - Pauses while the mouse is over it, so a dish is easy to click
// - Clicking a card calls onSelect(item), so the page can show that dish's details
//
// How the endless loop works:
//   The cards are placed THREE times in a row: [copy 1][copy 2][copy 3].
//   We start at the first card of copy 2 and slide one card to the right each time.
//   When we reach copy 3, its cards look exactly like copy 2's, so right after the
//   slide we jump back by one full copy with the animation switched off.
//   The jump can't be seen, so the row seems to go on forever.

import { useEffect, useState } from "react";
import Photo from "./Photo";
import { formatPrice } from "../utils/formatPrice";

const SECONDS_PER_DISH = 3; // how long each dish stays in the center
const SLIDE_MS = 700; // how long one slide takes (same as the transition in index.css)

function MenuCarousel({ items, onSelect }) {
  const count = items.length;
  // Position in the long row (0 .. 3 × count - 1). Starts at the first card of copy 2.
  const [index, setIndex] = useState(count);
  const [paused, setPaused] = useState(false);
  const [jumping, setJumping] = useState(false); // true = animations off for the invisible jump

  // Every few seconds, slide to the next dish (unless paused)
  useEffect(() => {
    if (paused || jumping || count < 2) return;
    const timer = setTimeout(() => setIndex(index + 1), SECONDS_PER_DISH * 1000);
    return () => clearTimeout(timer);
  }, [index, paused, jumping, count]);

  // Reached copy 3: once the slide has finished, jump back one full copy (invisible)
  useEffect(() => {
    if (index < count * 2) return;
    const timer = setTimeout(() => {
      setJumping(true);
      setIndex(index - count);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, count]);

  // After the jump has been drawn, switch the animations back on
  useEffect(() => {
    if (!jumping) return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setJumping(false)),
    );
    return () => cancelAnimationFrame(frame);
  }, [jumping]);

  if (count === 0) return null;

  // The long row: the menu three times
  const row = [...items, ...items, ...items];

  return (
    <div
      className="card-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="card-carousel-viewport">
        <div
          className={jumping ? "card-track jumping" : "card-track"}
          style={{ "--index": index }}
        >
          {row.map((item, i) => {
            // Only copy 2 is read out by screen readers and reachable with Tab
            const isCopy = i < count || i >= count * 2;
            return (
              <button
                key={i}
                type="button"
                className={i === index ? "dish-card active" : "dish-card"}
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
