// Restaurant details used across the app. Change them HERE and every page updates.

export const BRAND_MAIN = "POUND";
export const BRAND_SUB = "Flatterie";
export const RESTAURANT_NAME = "POUND x Flatterie";
export const TAGLINE = "Burgers • Pizza • Pasta";

// ----- About section -----
export const ABOUT_TEXT =
  "POUND x Flatterie serves hearty, made-to-order comfort food: smash burgers stacked high, " +
  "crisp flatbreads fresh from the oven, and big bowls of pasta. Come hungry, bring friends, " +
  "and stay a while.";

export const HIGHLIGHTS = [
  { title: "Burgers", text: "Juicy double patties, house sauce, soft toasted buns." },
  { title: "Flatbreads", text: "Thin, crisp, and loaded with toppings." },
  { title: "Comfort Food", text: "Pasta, loaded fries, and other favorites." },
];

// ----- Menu section -----
// image       = file name in client/src/assets/ (shown in the carousel and the pop-up)
// price       = null hides the price
// description = short line in the menu list
// details     = longer text in the pop-up when the dish is clicked
// ingredients = list in the pop-up ([] hides it)
export const MENU_ITEMS = [
  {
    name: "Double Backyard Cheeseburger",
    category: "Burgers",
    description: "Two beef patties, cheese, house sauce, tomato, onion, lettuce.",
    details:
      "Our signature burger: two smashed beef patties with melted cheese and our creamy " +
      "house sauce, stacked with fresh tomato, grilled onion, and crisp lettuce on a soft " +
      "toasted bun.",
    ingredients: ["2 beef patties", "Cheese", "House sauce", "Tomato", "Grilled onion", "Lettuce", "Toasted bun"],
    price: 425,
    image: "menu-1.jpg",
  },
  {
    name: "Pound Poutine",
    category: "Sides",
    description: "Fries topped with seasoned ground beef, melted cheese, and gravy.",
    details:
      "Thick-cut fries served hot in a cast-iron skillet, loaded with seasoned ground beef, " +
      "melted cheese, gravy, and a sprinkle of parsley. Great for sharing.",
    ingredients: ["Thick-cut fries", "Seasoned ground beef", "Melted cheese", "Gravy", "Parsley"],
    price: 295,
    image: "menu-2.jpg",
  },
  {
    name: "Spaghetti and Meatballs",
    category: "Pasta",
    description: "Brooklyn-style meatballs in tomato sauce over spaghetti.",
    details:
      "Brooklyn-style beef meatballs simmered in rich tomato sauce, served over spaghetti " +
      "and finished with grated cheese and fresh basil.",
    ingredients: ["Spaghetti", "Beef meatballs", "Tomato sauce", "Grated cheese", "Basil"],
    price: 345,
    image: "menu-3.jpg",
  },
  {
    name: "Good Ol' Fries",
    category: "Sides",
    description: "Crispy seasoned fries served with ketchup.",
    details:
      "Golden, crispy fries tossed in our house seasoning and served in a basket with a side " +
      "of ketchup. The classic partner for any burger.",
    ingredients: ["Potato fries", "House seasoning", "Ketchup"],
    price: 195,
    image: "menu-4.jpg",
  },
  {
    name: "Truffle Burger",
    category: "Burgers",
    description: "Beef patty, melted cheese, truffle mayo, and crispy fried onions.",
    details:
      "A juicy beef patty topped with melted white cheese, a generous pile of crispy fried " +
      "onions, and creamy truffle mayo on a soft toasted bun.",
    ingredients: ["Beef patty", "White cheese", "Crispy fried onions", "Truffle mayo", "Toasted bun"],
    price: 475,
    image: "menu-5.jpg",
  },
];

// ----- Location section -----
export const ADDRESS = "GXMJ+PPH, Ground floor, Main Mall, Mall of Asia (MOA, Pasay City, Metro Manila)";
export const PHONE = "+63 917 631 8950";
export const CONTACT_EMAIL = "poundmoa@gmail.com";
// Shown in the Visit Us section (booking time slots are set separately in server/config/businessRules.js)
export const OPENING_HOURS = "Daily, 10:00 AM – 10:00 PM";
// The same hours as numbers (24-hour clock), for the live "Open now / Closed" badge
export const OPEN_HOUR = 10; // 10:00 AM
export const CLOSE_HOUR = 22; // 10:00 PM
// What Google Maps searches for: the map in Visit Us and the "Get Directions" button
export const MAP_QUERY = "POUND x Flatterie, SM Mall of Asia, Pasay City";
