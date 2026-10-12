// utils/images.js
// Finds the photos in client/src/assets/ by file name.
// import.meta.glob (a Vite feature) imports EVERY file in the folder at once,
// so a missing photo doesn't crash the build: getImage() just returns null
// and the page shows a placeholder box instead. Add the file and it appears.

const files = import.meta.glob("../assets/*", { eager: true, import: "default" });

// getImage("hero.jpg") -> the image URL, or null if the file isn't there yet
export function getImage(fileName) {
  return files[`../assets/${fileName}`] || null;
}
