// utils/formatRef.js
// Short booking reference shown to people (like the last digits of a receipt number):
// the LAST 6 characters of the MongoDB id, in capitals.
//   "6aca7110be4a5b660eea7886" -> "#EA7886"

export const formatRef = (id) => `#${String(id).slice(-6).toUpperCase()}`;
