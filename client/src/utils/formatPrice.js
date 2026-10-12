// utils/formatPrice.js
// 425 -> "₱425"

export function formatPrice(price) {
  return `₱${price.toLocaleString()}`;
}
