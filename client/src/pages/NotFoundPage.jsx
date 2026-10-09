// pages/NotFoundPage.jsx
// Shown when the URL does not match any page.

import { Link } from "react-router";

function NotFoundPage() {
  return (
    <div className="page not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go back to the home page</Link>
    </div>
  );
}

export default NotFoundPage;
