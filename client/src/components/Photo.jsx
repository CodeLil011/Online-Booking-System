// components/Photo.jsx
// Shows a photo from client/src/assets/, or a dashed placeholder box
// if that file hasn't been added yet.

import { getImage } from "../utils/images";

function Photo({ file, alt, className = "" }) {
  const src = getImage(file);

  if (!src) {
    return <div className={`placeholder ${className}`}>Photo coming soon ({file})</div>;
  }

  return <img src={src} alt={alt} className={`photo ${className}`} />;
}

export default Photo;
