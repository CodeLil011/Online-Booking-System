// components/PasswordInput.jsx
// A password field with an eye button that shows/hides the password.
// Use it exactly like a normal <input>: <PasswordInput id="password" value={...} ... />

import { useState } from "react";

// Open eye icon (password hidden -> click to show)
function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Crossed-out eye icon (password visible -> click to hide)
function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}

function PasswordInput(props) {
  const [visible, setVisible] = useState(false); // false = hidden (dots)

  return (
    <div className="password-input">
      {/* {...props} passes everything (id, value, onChange, ...) to the real input */}
      <input {...props} type={visible ? "text" : "password"} />

      {/* type="button" so clicking the eye does NOT submit the form */}
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

export default PasswordInput;
