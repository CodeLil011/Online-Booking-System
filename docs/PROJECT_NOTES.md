# Project Notes: Restaurant Management and Online Booking System

Study notes for the group. Updated after every completed step.

**Progress:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 (Website frame) ✅ Steps 8–10 · Phase 4 (Authentication) ✅ Steps 11–15 · Phase 5 (User Management) ✅ Steps 16–17 · Phase 6 (Restaurant Booking) ✅ Steps 18–20 · Phase 7 (Staff/Admin Management) ✅ Steps 21–24 · Phase 8 (Archive) ✅ Steps 25–26 · Phase 9 (MongoDB) ✅ Steps 27–31 · Phase 10 (Visual polish) ✅ Steps 9, 32–42 · Phase 11 (Realistic data): Step 43 waiting for `npm run seed` · **Next:** Phase 11 (realistic data: 10+ users, 20+ completed bookings) and demo preparation · Project is on GitHub (`CodeLil011/Online-Booking-System`)

---

## Contents

1. [Project Overview](#1-project-overview)
2. [Business Rules](#2-business-rules)
3. [Current Folder Structure](#3-current-folder-structure)
4. [How a Request Travels Through the Backend](#4-how-a-request-travels-through-the-backend)
5. [Step-by-Step Log](#5-step-by-step-log)
6. [API Reference](#6-api-reference)
7. [HTTP Status Codes We Use](#7-http-status-codes-we-use)
8. [Errors We Hit and How We Fixed Them](#8-errors-we-hit-and-how-we-fixed-them)
9. [Possible Instructor Questions](#9-possible-instructor-questions)
10. [Glossary](#10-glossary)

---

## 1. Project Overview

### What the system does
A web application for one restaurant that handles:
- **Online reservations**: customers book a table for a date and time; staff confirm it; the customer dines; staff mark it completed.
- **Restaurant management**: staff manage tables (capacity, location, availability) and monitor reservations.
- **Accounts and users**: registration, login, profiles, password recovery; an admin manages all accounts and roles.
- **Archive**: finished records (completed/cancelled reservations, inactive users) move out of the active lists but can still be searched, viewed, and restored.

### Technology stack (MERN)
| Letter | Technology | Role in our project |
|---|---|---|
| **M** | MongoDB | Database (Phase 9; temporary JavaScript arrays for now) |
| **E** | Express.js | Backend framework: receives requests, sends responses |
| **R** | React (with Vite) | Frontend: the pages users see |
| **N** | Node.js | Runs the backend JavaScript |

### Target client (sample/reference only)
**Pound**: the restaurant name used as the sample/reference client to define roles, rules, and workflow. (This is a practice/mock project, separate from the group's actual capstone.)

> We say "sample/reference client". We do **not** claim the restaurant approved, partnered with, or uses the system. The site footer states that it is a student project and not affiliated with the restaurant.

The name is stored in one place in the frontend (`client/src/config.js`), so it can be changed easily.

### User roles
| Role | Who | Can | Cannot |
|---|---|---|---|
| **ADMIN** | Owner / manager | Everything: manage users and roles, tables, all reservations, archive and restore | Delete their own admin account |
| **STAFF** | Front desk / host / service crew | View, confirm, reject, edit, and complete reservations; manage table availability; view customer info; archive reservations | Manage users or roles; restore archived users |
| **CUSTOMER** | Diners | Register, log in, edit profile, check availability, book, view and cancel **own** reservations | See other customers' data; use staff/admin pages |

Planned demo accounts: **1 Admin + 3 Staff + 6 Customers = 10 users**.

> Roles take effect in **Phase 4 (Authentication)**. Until then, every endpoint is open.

### Design decisions (from the group's frontend draft)
| Topic | Decision | Why |
|---|---|---|
| Customer site | **One scrolling page**: Home → About → Menu → Book Now → Location | Matches the Canva draft |
| Branches | **One location only** | Multi-branch management is out of scope |
| Time slots | **5 two-hour seatings** (kept after discussion) | Simple, correct conflict check |
| Table choice | **System auto-assigns** the smallest free table that fits; staff can change it | Better table use; customers don't need the floor plan |
| Booking | **Login required**; name/email/phone pre-filled | Needed for "My Reservations" and cancelling |
| Seating preference | Written in **Special Requests** (e.g., "window seat") | Customer can still state a preference |
| Food menu | **View-only** menu section (no ordering/cart/payment) | Realistic; ordering is out of scope |
| Login page | **One login for all roles**; Register creates Customers only; Staff accounts are created by the Admin | Security |
| Dashboard | Same style as the draft (black, brown accents, left sidebar) | Not in the draft, designed to match |

### Major modules
1. Account Management: register, login, logout, profile, password recovery
2. User Management: admin CRUD, roles, active/inactive status
3. Table Management
4. Reservation (core transaction): booking, availability, conflict prevention, statuses
5. Staff/Admin Dashboard
6. Archive: archive, view, search/filter, restore

### Overall workflow
```
Customer registers / logs in
      ↓
Checks availability (date + time + guests) → picks a free table
      ↓
Submits reservation ──────────────────→ PENDING
      ↓
Staff reviews ──── rejects ───────────→ CANCELLED
      ↓ confirms
CONFIRMED ──── customer cancels ──────→ CANCELLED
      ↓ customer dines
Staff marks ──────────────────────────→ COMPLETED
      ↓
Admin/Staff archives (completed/cancelled only) → ARCHIVE → view / search / restore
```

---

## 2. Business Rules

All of these live in `server/config/businessRules.js`, so they are easy to find and change.

### Seatings (time slots)
Each seating lasts **2 hours**, so slots never overlap.

| Seating | Time |
|---|---|
| Lunch 1 | 11:00 – 13:00 |
| Lunch 2 | 13:00 – 15:00 |
| Afternoon | 15:00 – 17:00 |
| Dinner 1 | 17:00 – 19:00 |
| Dinner 2 | 19:00 – 21:00 |

> We first planned hourly slots, but a 7:00 PM party would still be eating when an 8:00 PM party arrived at the same table. Two-hour seatings fix this and keep the conflict rule simple.

### Booking rules
| Rule | Value |
|---|---|
| Party size | 1 to 10 guests |
| Booking window | Today up to **30 days** ahead |
| Past dates | Not allowed |
| Today | Only time slots that have not passed yet |
| Table must fit the party | `guests ≤ table capacity` |
| Table must be in service | Table `status` must be `"available"` |
| New reservation status | Always **Pending** (the customer cannot choose it) |

### The conflict rule
> **A table can have only ONE active reservation (Pending or Confirmed) per date + time slot.**
> Cancelled reservations release the table. Completed ones are in the past.

### Status workflow
| From | Can change to | Who |
|---|---|---|
| Pending | Confirmed, Cancelled (= rejected) | Staff/Admin |
| Pending | Cancelled | Customer (own booking) |
| Confirmed | Completed, Cancelled | Staff/Admin |
| Confirmed | Cancelled | Customer (own booking) |
| Cancelled | nothing (final) | — |
| Completed | nothing (final) | — |

Written in code as:
```javascript
const ALLOWED_STATUS_CHANGES = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Completed", "Cancelled"],
  Cancelled: [],
  Completed: [],
};
```

### Time rules for status changes
- Cannot **confirm** a reservation whose schedule has already passed.
- Cannot **complete** a reservation before its scheduled time.
- A customer cannot **cancel** after the schedule has started.

### Editing rules
- Only **Pending/Confirmed** reservations that have **not started** can be edited.
- Only **Staff/Admin** edit; customers cancel and rebook.
- Status cannot be changed through edit (it has its own endpoint).
- The edited result must pass the same validation and conflict check as a new booking.

### Table rules
- Table numbers are unique.
- Capacity is 1 to 20.
- Tables are **never deleted**; they are set to `"unavailable"` instead, because deleting a table would break the history of reservations that used it.

---

## 3. Current Folder Structure

```
resto-reservation-system/
├── .gitignore                      keeps node_modules/, .env, dist/ off GitHub
├── docs/
│   └── PROJECT_NOTES.md            ← this file
├── server/                         ← Node.js + Express backend (port 5000)
│   ├── config/
│   │   ├── businessRules.js        restaurant rules (slots, limits, statuses)
│   │   └── db.js                   connects to MongoDB Atlas
│   ├── controllers/                THE LOGIC (one file per area)
│   │   ├── authController.js       register, login, profile, password reset
│   │   ├── userController.js       Manage Users (Admin)
│   │   ├── tableController.js      tables
│   │   ├── reservationController.js bookings, availability, conflict check, status
│   │   ├── customerController.js   Customers page (view only)
│   │   └── archiveController.js    archive / restore
│   ├── data/                       SAMPLE data, used only by seed.js
│   │   ├── users.js, tables.js, reservations.js
│   ├── middleware/
│   │   ├── authMiddleware.js       protect + allowRoles (the "guards")
│   │   └── errorMiddleware.js      404 handler + error handler
│   ├── models/                     Mongoose models (shape + rules of each record)
│   │   ├── User.js, Table.js, Reservation.js
│   ├── requests/                   REST Client test files (not app code)
│   ├── routes/                     URL → controller function
│   │   ├── authRoutes.js, userRoutes.js, tableRoutes.js,
│   │   ├── reservationRoutes.js, customerRoutes.js, archiveRoutes.js
│   ├── utils/
│   │   ├── authUtils.js            create login token, hide private fields
│   │   ├── dateUtils.js            date/time helpers
│   │   ├── emailService.js         "sends" reset emails (printed in the terminal)
│   │   └── validators.js           shared rules: email, phone, password, search text
│   ├── .env                        secrets: JWT_SECRET, MONGO_URI (NOT on GitHub)
│   ├── .env.example                the same settings with fake values (on GitHub)
│   ├── package.json                scripts: dev, start, seed
│   ├── seed.js                     npm run seed → resets the database to the sample data
│   └── server.js                   entry point
└── client/                         ← React frontend made with Vite (port 5173)
    ├── src/
    │   ├── api/                    one file per backend area (apiClient adds the token)
    │   ├── assets/                 home page photos (logo.png, hero.jpg, menu-1.jpg, ...)
    │   ├── components/             Navbar, Footer, Sidebar, ProtectedRoute, Modal,
    │   │                           PasswordInput, BookingForm, ReservationForm,
    │   │                           UserForm, TableForm, Photo, MenuCarousel
    │   ├── context/AuthContext.jsx who is logged in (shared by all pages)
    │   ├── layouts/                PublicLayout (Navbar+Footer), DashboardLayout (Sidebar),
    │   │                           AuthLayout (photo + form, account pages)
    │   ├── pages/                  HomePage, Login, Register, Forgot/Reset Password,
    │   │   │                       MyReservations, Profile, NotFound
    │   │   └── dashboard/          Overview, Reservations, Tables, Customers, Users, Archive
    │   ├── utils/                  dateHelpers.js, formatRef.js, formatPrice.js, images.js
    │   ├── config.js               restaurant name, story, menu, address, hours (one place)
    │   ├── App.jsx                 list of routes (URL → page)
    │   ├── index.css               all styles + color variables
    │   └── main.jsx                starts React inside <BrowserRouter> and <AuthProvider>
    ├── index.html
    └── package.json
```

### Dependencies and why we installed them
| Package | Where | Why |
|---|---|---|
| `express` | server | Web framework that receives requests and sends responses |
| `cors` | server | Lets the React app (port 5173) call the API (port 5000) |
| `dotenv` | server | Reads settings (port, database URL, secrets) from `.env` |
| `bcryptjs` | server | Hashes passwords (Step 11) |
| `jsonwebtoken` | server | Creates and checks login tokens (Step 11) |
| `mongoose` | server | Talks to MongoDB with schemas and simple commands (Step 27) |
| `nodemon` (dev only) | server | Restarts the server automatically when a file is saved |
| `react`, `react-dom`, `vite` | client | Installed by the Vite React template |
| `react-router` | client | Multiple pages with their own URLs, without page reloads (installed as v8) |
| `gsap`, `@gsap/react` | client | Animations: hero entrance, scroll reveal, parallax, account-page entrance (Steps 35, 39) |

**Tool:** REST Client (VS Code extension by Huachao Mao) for testing API requests from `.http` files.

### How to run the project (two terminals)
| Terminal | Folder | Command | URL |
|---|---|---|---|
| 1: Backend | `resto-reservation-system\server` | `npm run dev` | http://localhost:5000 |
| 2: Frontend | `resto-reservation-system\client` | `npm run dev` | http://localhost:5173 |

---

## 4. How a Request Travels Through the Backend

```
React / REST Client
      │  e.g. POST /api/reservations
      ▼
server.js            → runs middleware (cors, express.json), then sends the
      │                request to the matching route file
      ▼
routes/              → matches URL + method to a controller function
      │                (POST "/" → createReservation)
      ▼
controllers/         → THE LOGIC: read input, validate, check rules,
      │                change data, send response
      ▼
models/ + MongoDB    → Mongoose models read and save the data in MongoDB Atlas
      │
      ▼
JSON response        → { success, message, count, data } or { success: false, message, errors }
```

If no route matches, the `notFound` middleware returns a 404 JSON message. If code throws an error, `errorHandler` returns a clean JSON error instead of crashing.

### Why the layers matter
Only the **controllers** touch the data. That's why switching from in-memory arrays to MongoDB (Phase 9) only changed the controllers: routes and React stayed the same.

### Where the data lives (since Phase 9)
```
React page ──► API (Express) ──► controller ──► Mongoose model ──► MongoDB Atlas (cloud)
                                                                    users / tables / reservations
```
- Data is **permanent**: restarting the server (`rs`, saving a file) changes nothing.
- `npm run seed` is the only thing that resets it (deletes everything, loads `data/*.js` again).
- The database is **shared** by the whole group, so a seed resets it for everyone.

**Before Phase 9 (Steps 1–26)** the data lived in arrays in memory, loaded from `data/*.js` when the server started. Every restart wiped all changes. That's why we moved to MongoDB.

---

## 5. Step-by-Step Log

### STEP 1: Backend setup and first Express server
**Goal:** prove Node, npm, and Express work.

**What we did**
- Created `server/`, ran `npm init -y`, installed `express cors dotenv` and `nodemon` (dev).
- Added scripts in `package.json`: `"start": "node server.js"`, `"dev": "nodemon server.js"`.
- Created `.env` with `PORT=5000`.
- Created `server.js` with one test route: `GET /api/health`.

**Key logic**
`dotenv` loads `PORT`. Express creates the app. `cors()` and `express.json()` run on every request. `app.listen` starts the server. All API routes start with `/api/...` to keep backend URLs separate from frontend pages.

**Test:** http://localhost:5000/api/health → `{"status":"ok", ...}`

---

### STEP 2: React frontend and frontend-to-backend connection
**Goal:** prove React can talk to Express.

**What we did**
- Created `client/` with `npm create vite@latest client -- --template react`, then `npm install`.
- Removed Vite demo files (`App.css`, logos).
- Replaced `App.jsx` with a page that calls `/api/health` and shows the result.

**Key logic**
When the page loads, `useEffect` (with `[]`) runs once and uses `fetch` to call the backend. The JSON reply is stored with `setHealth`, React re-renders, and the data appears. If the backend is down, `.catch` stores an error that shows in red.

Pattern used everywhere later: **request → response → state → re-render**.

Works only because the backend has `app.use(cors())`; without it, the browser blocks calls from port 5173 to port 5000.

**Test:** http://localhost:5173 shows "Connected to backend!". Stopping the backend shows the red error.

---

### STEP 3: Backend structure and read-only Tables API
**Goal:** organize the backend into layers; list tables.

**What we did**
- Created folders `data/`, `controllers/`, `routes/`, `middleware/`.
- `data/tables.js`: 12 tables (Table 11 set to `"unavailable"` for testing).
- `GET /api/tables` with filters `?status=` and `?minCapacity=`.
- `GET /api/tables/:id`.
- `errorMiddleware.js`: `notFound` (404) and `errorHandler` (500/other).

**Key logic**
- We use `_id` (not `id`) because MongoDB uses `_id`, so the frontend will not need changes later.
- Table `status` means *in service or not*. Whether a table is free at a specific date/time is computed from reservations.
- Every response has the same shape: `{ success, count, data }`.
- `notFound` must be placed **after** all routes, because Express checks top to bottom.

**Presentation line:**
> "When React requests `/api/tables?minCapacity=6`, `server.js` passes it to `tableRoutes`, which calls `getAllTables`. The controller reads the filters, validates them, filters the list, and returns JSON. If the URL doesn't exist or something fails, the error middleware returns a clean JSON error instead of crashing."

---

### STEP 4: Create and update tables with validation
**Goal:** add POST/PUT with input validation.

**What we did**
- `POST /api/tables` and `PUT /api/tables/:id`.
- `validateTable()` helper (required fields for create, optional for update).
- Installed the REST Client extension; created `requests/tables.http`.

**Key logic**
- Validation: table number is a positive whole number, capacity 1–20, location required, status only `available`/`unavailable`.
- Table numbers must be unique (409 Conflict if taken).
- New records are built from **allowed fields only**, so extra fields sent by a client are ignored.
- PUT updates only the fields that were sent.
- `req.body || {}` because Express 5 leaves `req.body` undefined when no JSON is sent.
- **No DELETE**: tables with reservation history should not disappear.

**Presentation line:**
> "POST validates the input first, checks that the table number isn't used, builds the table from allowed fields only, saves it, and returns 201. PUT updates only the fields sent and uses the same validation. We use 400 for invalid input, 404 when not found, and 409 for conflicts."

---

### STEP 5: Reservations, availability, and conflict prevention (core)
**Goal:** let customers book without double-booking.

**What we did**
- `config/businessRules.js` (slots, guest limits, booking window, statuses).
- `utils/dateUtils.js` (`getToday`, `addDays`, `getCurrentTime`, `isValidDateString`).
- `data/reservations.js` with sample bookings in different statuses.
- Endpoints: `GET /api/reservations`, `GET /api/reservations/availability`, `GET /api/reservations/:id`, `POST /api/reservations`.

**Booking flow (POST)**
```
1. Validate input (name, email, PH mobile, date, time slot, guests, table)
2. Check date (not past, max 30 days ahead, slot not passed today)
3. Check table (exists, in service, big enough)
4. CONFLICT CHECK (same table + date + time with Pending/Confirmed?)
5. Save with status "Pending"
6. Return 201 + reservation
```

**The conflict check**
```javascript
const isTableBooked = (tableId, date, time) =>
  reservations.some(
    (r) =>
      r.table === tableId &&
      r.date === date &&
      r.time === time &&
      ACTIVE_STATUSES.includes(r.status)
  );
```
`.some()` returns `true` as soon as ONE reservation matches ALL four conditions.

**Sample data used to prove it**
| Record | Purpose |
|---|---|
| r1: Maria Santos, Table 5, Oct 10, 19:00, **Confirmed** | The requirement example; a second booking for the same slot gets **409** |
| r4: Paolo Garcia, Table 6, Oct 10, 19:00, **Cancelled** | Proves cancelled bookings do **not** block the table |

**Design decisions**
- Dates are stored as `"2026-10-10"` and times as `"19:00"` (text). This format compares correctly as text and avoids timezone bugs.
- `table` stores the table `_id`; responses replace it with full table details (`withTableDetails`), the same thing MongoDB's `populate()` will do.
- `/availability` route must come **before** `/:id`, or Express would treat "availability" as an ID.
- Capacity comes from the **table data**, never from the request. The request sends `guests` (party size); the server compares `guests` with the stored `capacity`. Never trust the client for business data.

**Presentation line:**
> "Before saving a booking, the server looks for any reservation with the same table, date, and time slot whose status is still active (Pending or Confirmed). If one exists, it rejects the booking with 409 Conflict. Cancelled reservations aren't counted, so cancelling frees the table. Each slot is a 2-hour seating that never overlaps another, so matching the exact slot is enough. The availability endpoint uses the same check, so customers only see free tables."

---

### STEP 6: Status workflow (confirm, reject, cancel, complete)
**Goal:** move reservations through their life after creation.

**What we did**
- Added `ALLOWED_STATUS_CHANGES` to `businessRules.js`.
- Added r6 (Ramon Bautista, past Confirmed booking) so we could test completing.
- `PATCH /api/reservations/:id/status` (Staff/Admin): confirm, reject/cancel, complete.
- `PATCH /api/reservations/:id/cancel` (Customer): cancel own booking.
- Helpers: `hasStarted()`, `validateReason()`.
- Cancelled records store `cancelledBy` (`staff`/`customer`) and `cancellationReason`; changes store `updatedAt`.

**Key logic**
- The server looks up the current status in `ALLOWED_STATUS_CHANGES` and checks whether the new status is in its list.
- Time rules (cannot confirm a past booking, cannot complete a future one, customer cannot cancel after start).
- Customers have a **separate** endpoint because they may only cancel.
- Cancelling needs no "free the table" code: the conflict check only counts Pending/Confirmed, so the table becomes available automatically.
- **PATCH vs PUT:** PATCH changes one part (status); PUT edits a record's details.

**Test scenarios (reservationStatus.http)**
| Purpose | Requests |
|---|---|
| Staff confirms | #1 (r2 Juan) |
| Staff rejects | #3 (r3 Angela) |
| Staff completes | #5 (r6 Ramon) |
| Customer cancels; table freed | #9, #10 (r1 Maria) |
| Blocked wrong actions | #2, #4, #6, #7, #8, #11, #12 |

**Presentation line:**
> "Each reservation follows a fixed workflow stored in one object. Before changing a status, the server checks whether the change is allowed. We also apply time rules, like not completing a reservation before the guest's schedule. Customers have a separate cancel endpoint, and we record who cancelled and why."

**Connection to requirements:** the **20 completed transactions** are reservations that went Pending → Confirmed → Completed, like r6.

---

### STEP 7: Editing a reservation
**Goal:** staff can change date, time, guests, table, or details (e.g., a customer calls to move their booking).

**What we did**
- `PUT /api/reservations/:id` (Staff/Admin).
- Moved field checks into one shared helper, `validateReservationData()`, used by both create and edit.
- `isTableBooked()` got a 4th parameter, `excludeId`.

**Edit flow**
```
1. Find the reservation                      → 404 if missing
2. Pending/Confirmed and not started?        → 400 if not
3. "status" in body?                         → 400 (use /status)
4. Keep only editable fields that were sent  → 400 if none
5. MERGE: current data + changes
6. Validate the merged result (same rules as a new booking)
7. Check the table (exists, in service, big enough)
8. Conflict check, IGNORING this reservation itself → 409 if taken
9. Save changes + updatedAt
```

**The self-conflict problem**
Editing only the special request of r1 (Table 5, Oct 10, 19:00) would make the conflict check find **r1 itself** and wrongly reject it. Fix:
```javascript
isTableBooked(updated.table, updated.date, updated.time, reservation._id)
// checks every reservation EXCEPT the one being edited
```

**Where the edit actually happens**
`const updated = { ...reservation, ...changes }` is only a **draft** for validation. The real edit happens when assigning to `reservation.table = ...` etc. `reservation` points to the real object inside the in-memory array, so the array changes directly (the file does not).

**Presentation line:**
> "Staff send only the fields that changed. The server merges them with the existing data and validates the full result using the same function as new bookings. It then runs the conflict check but ignores the reservation being edited, so it doesn't conflict with itself. Status can't be changed through edit, so the workflow rules can't be bypassed."

---

### STEP 8: Routing, layouts, and page skeletons (Phase 3)
**Goal:** build the frame of the whole website using the group's draft layout.

**What we did**
- Installed `react-router`.
- `main.jsx` wraps `<App />` in `<BrowserRouter>`.
- `App.jsx` lists every route: public pages inside `PublicLayout`, dashboard pages inside `DashboardLayout` under `/dashboard`, and `*` for 404.
- `Navbar` (logo, HOME / ABOUT / MENU / BOOK NOW, profile icon), `Footer` (disclaimer + temporary dashboard link), `Sidebar` (dashboard menu).
- `HomePage` is one scrolling page with sections `home`, `about`, `menu`, `book`, `location` (placeholders for now).
- Placeholder pages: Login, Register, My Reservations, Profile, 404, and six dashboard pages.
- `index.css`: layout + colors as variables in `:root` (black background, brown navbar).

**Pages and URLs**
| URL | Page | Layout |
|---|---|---|
| `/` (+ `#about`, `#menu`, `#book`, `#location`) | Scrolling home page | Public |
| `/login`, `/register`, `/my-reservations`, `/profile` | Account pages | Public |
| `/dashboard` (+ `/reservations`, `/tables`, `/customers`, `/users`, `/archive`) | Staff/Admin pages | Dashboard |
| anything else | 404 | Public |

**Key concepts**
| Concept | Meaning |
|---|---|
| `<BrowserRouter>` | Turns on navigation using the URL. Without it, `<Routes>`/`<Link>` crash (black page). |
| `<Routes>` / `<Route>` | "This URL shows this page" |
| Layout route | Parent route that wraps child pages with shared parts (navbar or sidebar) |
| `<Outlet />` | Where the current child page appears inside a layout |
| `<Link>` / `<NavLink>` | Change pages without reloading; `NavLink` adds `class="active"` |
| `end` | Marks a link active only on the exact URL (otherwise "Overview" stays active on every dashboard page) |
| `#hash` links | `/#menu` = home page scrolled to `id="menu"` |

**How the scrolling works**
Clicking **Menu** changes the URL to `/#menu`. `useLocation()` gives the current URL; a `useEffect` runs whenever it changes, takes `"menu"` from the hash, finds `<section id="menu">`, and calls `scrollIntoView({ behavior: "smooth" })`. This also works from other pages (e.g., clicking Menu on the Login page). `scroll-margin-top` keeps the sticky navbar from covering section titles.

**Step 9 (home page content)** was done after the images arrived (see Step 9 below).

**Presentation line:**
> "The frontend uses React Router: every page has its own URL and pages switch without reloading. We use two layouts, a public layout with the navbar and footer and a dashboard layout with the sidebar. Each layout has an Outlet where the current page appears, so shared parts are written once. The customer home page is a single scrolling page; navbar links point to sections like `/#menu`, and a `useEffect` watches the URL and scrolls to the matching section."

---

### STEP 9: Home page content and photos
**Goal:** replace the dashed placeholder boxes on the home page with the real sections from the draft.

**What we did**
- **Hero:** full-width food photo with the logo, tagline, and "Book a Table" / "View Menu" buttons. A dark gradient over the photo keeps the white text readable. Height = one screen (max 800px).
- **About:** story text, three highlight boxes (Burgers / Flatbreads / Comfort Food), photo on the side.
- **Menu:** `MenuCarousel`, a center-focused card carousel that loops forever: one portrait dish card in the center (full size, full focus), the previous and next cards peeking in, cropped at the edges, smaller and faded. Every 3 seconds it slides to the next dish; after the last dish comes the first again, with no rewind. Pauses on mouse-over. Below it, the full menu list in two columns.
- **Dish details:** clicking the carousel photo or a dish in the list opens `MenuItemDetails`, a pop-up (reuses `Modal`) with the photo, category, price, longer description, ingredients, and a "Book a Table" button that closes the pop-up and scrolls to the booking form. `HomePage` keeps the clicked dish in `selectedItem` state (`null` = closed); the carousel tells the page which dish was clicked through its `onSelect` prop.
- **Book Now:** photo on the left of the existing `BookingForm`.
- **Visit Us:** three cards: address, opening hours, contact.
- **Navbar:** shows `logo.png` instead of the text logo once the file exists.
- All text (story, menu, address, hours) lives in `config.js`. The restaurant's real address, phone and email are filled in. The menu has 5 dishes; only the cheeseburger's price (₱425) comes from the restaurant, the other prices are our own estimates, which the group decided to keep.
- `index.html` title is now "POUND x Flatterie".
- **Fonts matching the real POUND branding** (Google Fonts, loaded in `index.html`, set as variables in `:root` of `index.css`):
  | Font | Used for | Why |
  |---|---|---|
  | Bodoni Moda | "POUND" (hero, navbar, sidebar) | High-contrast serif like the real logo |
  | Montserrat | "FLATTERIE", tagline box, navbar links | Thin, widely spaced capitals like the logo |
  | Permanent Marker | Section titles (About Us, Menu, ...) | Brush lettering like the poster headlines |
  | Poppins | All other text | Clean sans-serif like the poster captions |
- The hero's text logo is built like the real one: **POUND** / tagline in a thin box / **FLATTERIE**. We decided not to use a `logo.png`; the text logo is used everywhere.

**The photos** go in `client/src/assets/` with these exact names:
| File | Section | Size | Status |
|---|---|---|---|
| `logo.png` | Hero + navbar (optional) | transparent background | not used: text logo instead |
| `hero.jpg` | Hero background | ≥ 1920 px wide | ✅ |
| `about.jpg` | About | ≥ 800 px | ✅ |
| `menu-1.jpg` … `menu-5.jpg` | Menu carousel (one per dish in `MENU_ITEMS`) | square, ≥ 800 px | ✅ |
| `booking.jpg` | Book Now | ≥ 800 px | ✅ |

**How missing photos are handled**
A normal `import hero from "../assets/hero.jpg"` **breaks the whole build** if the file doesn't exist. `utils/images.js` uses Vite's `import.meta.glob("../assets/*")`, which imports *whatever files are in the folder*. `getImage("hero.jpg")` returns the URL, or `null` if the file isn't there, and the `Photo` component shows a "Photo coming soon" box instead. So adding a photo = drop the file in `assets/`, nothing else.

**Key concepts**
| Concept | Meaning |
|---|---|
| `import.meta.glob` | Vite feature: import every file matching a pattern at once |
| `object-fit: cover` | Fill the box and crop the edges (About / Book Now photos) |
| `object-fit: contain` | Show the whole photo, no cropping (dish pop-up, so the poster text isn't cut off) |
| Endless loop | The cards are placed three times in a row. It starts at copy 2 and slides one card at a time. When it reaches copy 3 (which looks exactly like copy 2), it jumps back one full copy with the animation switched off (`.jumping`), so the jump can't be seen |
| `transform: translateX(...)` | `--index` is the card in the center. The row moves left by `--index` cards (card width + gap each), then right by half the viewport minus half a card, which puts that card exactly in the middle. A `transition` makes it slide |
| Container query units (`cqi`) | `1cqi` = 1% of the carousel's width. Cards are `56cqi` wide (`64cqi` on phones), so the side cards are cropped the same way on every screen size |
| Active card | The card at `--index` gets the class `active`: CSS scales it to 100% and the others to 86% with 45% opacity, with a `transition` for smoothness |
| `setTimeout` + `paused` state | Waits 3 seconds, then moves to the next dish. `onMouseEnter` / `onMouseLeave` set `paused`, which stops the timer while the mouse is over the carousel |
| `auto-fit, minmax(300px, 1fr)` | Two columns on wide screens, one column on phones, without a media query |

**Presentation line:**
> "The home page is one scrolling page with a hero, About, Menu, Book Now and Visit Us sections. All restaurant text is kept in one config file, so it can be changed without touching the page code. Photos are loaded from the assets folder by file name, and if one is missing the page shows a placeholder instead of breaking. The menu has a small carousel built with React state and a timer; clicking a dish opens a pop-up with its full details. The layout switches to one column on phones."

---

### STEP 10: Connecting React to the backend (Manage Tables page)
**Goal:** first dashboard page with real backend data.

**What we did**
- `client/src/api/apiClient.js`: `apiRequest()`, the ONE function that talks to the backend (builds the URL, sends JSON, turns `{ success: false, message }` into an Error).
- `client/src/api/tableApi.js`: `getTables(filters)` and `updateTable(id, changes)`.
- `ManageTablesPage.jsx`: loads tables in a `useEffect`, status filter, loading/error/success messages, and a button to switch a table between available/unavailable.
- Styles for data tables, badges, buttons, and messages added to `index.css`.

**The API layer**
```
Page → api/tableApi.js (getTables, updateTable) → api/apiClient.js (apiRequest) → fetch → backend
```
- Backend address and error handling are written once.
- Phase 4 adds the login token in `apiClient.js` only.
- Phase 9 (MongoDB) needs no frontend changes.

**Key logic**
- `useEffect(..., [statusFilter])` reloads the list on first load and whenever the filter changes.
- After a successful PUT, React replaces that table in its state list, so the page updates without reloading.
- `async`/`await` = "wait for the answer, then continue" (same as `.then()`, easier to read). `throw new Error()` in the API layer is caught by the page and shown as a message.
- `.map()` creates one row per table; `key={table._id}` helps React track rows.

**Two meanings of "available" (important)**
| | Booking availability | Table status (the button) |
|---|---|---|
| Question | Is Table 5 free on Oct 10 at 7 PM? | Can Table 5 be used at all? |
| Decided by | The system, automatically, from reservations | Staff, manually |
| Example | Booked by Maria at 7 PM only | Broken, private event, rain on outdoor tables |

Staff never click anything to mark a table "booked". The button is for out-of-service tables, which bookings cannot know about (requirement: "Staff/Admin can manage table availability"). Planned: rename the labels to **In Service / Out of Service** in Phase 7 to avoid confusion, and add a per-date table schedule view.

**Presentation line (Step 10):**
> "React talks to the backend through an API layer. Pages call functions like `getTables()` and `updateTable()`, which use one shared `apiRequest()` function that sends the request, reads the JSON, and turns backend errors into messages. When the Tables page opens, a `useEffect` loads the tables into state and React draws one row per table. When staff take a table out of service, React sends a PUT request; the backend validates and saves it, and React updates that row without reloading."

---

### STEP 11: Users, password hashing, register and login (Phase 4)
**Goal:** the system learns "who are you?" (register/login) and "how do I remember you?" (token).

**What we did**
- Installed `bcryptjs` (hashes and compares passwords) and `jsonwebtoken` (creates and checks tokens).
- `.env`: added `JWT_SECRET` (secret key that signs tokens) and `JWT_EXPIRES_IN=1d`.
- `data/users.js`: temporary users with **hashed** passwords (admin, staff, customer, and one inactive customer).
- `utils/authUtils.js`: `generateToken(user)` and `toPublicUser(user)` (removes `passwordHash` before sending).
- `controllers/authController.js` + `routes/authRoutes.js`: `POST /api/auth/register`, `POST /api/auth/login`.
- `server.js`: mounts `/api/auth` and stops at startup if `JWT_SECRET` is missing.

**Idea 1: Password hashing (a fingerprint)**
- We never store the real password, only its hash (`$2b$10$...`).
- A hash cannot be turned back into the password.
- Login hashes what the user typed and compares: `bcrypt.compare(typed, savedHash)`.
- bcrypt adds a random salt, so equal passwords still produce different hashes.

**Idea 2: The token (a signed wristband)**
- The server has no memory between requests, so after login it gives a **JWT** containing `{ id, role }`.
- The frontend sends the token with every request (used from Step 12).
- The token is **signed** with `JWT_SECRET`; editing it (e.g., changing role to admin) breaks the signature.
- It expires after 1 day. The data part is readable (only encoded), so it never contains passwords.
- **Logout** = the frontend deletes the token (Step 13).

**Register flow:** validate input → email unused (409 if taken) → hash password → create user with role **always "customer"** → return token + user (no hash).

**Login flow:** both fields given (400) → find user by email + compare hash → wrong email or wrong password gives the **same** 401 message → inactive account gives 403 → return token + user.

**Deactivated accounts:** each user has `status: "active" | "inactive"`. Login refuses inactive accounts (`if (user.status !== "active")`). Paolo Garcia (u4) was set to `"inactive"` by hand in `data/users.js` to test this; in Phase 5 the Admin will switch this status from the dashboard. The account and its history are kept, unlike deleting it.

**Development test accounts**
| Name | Role | Email | Password | Status |
|---|---|---|---|---|
| Giuz Montaño | admin | giuz.montano@gmail.com | Admin@123 | active |
| Marco Delos Reyes | staff | marco.delosreyes@gmail.com | Staff@123 | active |
| Maria Santos | customer | maria.santos@gmail.com | Customer@123 | active |
| Paolo Garcia | customer | paolo.garcia@outlook.com | Customer@123 | inactive |

**Presentation line:**
> "Passwords are never stored as plain text. On registration the server validates the input, checks the email is unused, hashes the password with bcrypt, and saves only the hash; the role is always set to customer on the server, so nobody can register as admin. At login, bcrypt compares the typed password with the stored hash. If they match and the account is active, the server returns a JWT, a token signed with a secret key that holds the user's ID and role. The frontend sends this token with later requests to prove who the user is. Wrong emails and wrong passwords return the same message so attackers can't discover which accounts exist."

---

### STEP 12: Protecting routes (checking the token)
**Goal:** put "guards at the doors" so only logged-in users with the right role can use protected actions.

**What we did**
- `middleware/authMiddleware.js`: two guards, `protect` and `allowRoles(...)`.
- `authController.js`: added `getMe`, `updateMe`, `changePassword`.
- Routes: `GET/PUT /api/auth/me`, `PUT /api/auth/me/password`; guards added to table and reservation routes.
- `requests/protected.http`: logs in as each role, saves the tokens, and tests every guard.

**The two guards**
| Guard | Question | Fails with |
|---|---|---|
| `protect` | "Who are you?" Reads `Authorization: Bearer <token>`, verifies signature/expiry, checks the account exists and is active, sets `req.user` | **401** (not logged in / invalid token) |
| `allowRoles("admin", "staff")` | "Is your role allowed here?" | **403** (logged in, wrong role) |

`router.get("/", protect, allowRoles("admin", "staff"), getAllReservations)` runs left to right; a guard that doesn't call `next()` stops the request before the controller.

**Who can do what**
| Action | Who |
|---|---|
| View tables, check availability | Everyone (public) |
| Add/edit tables | Admin, Staff |
| View all reservations / one reservation | Admin, Staff |
| Make a reservation | Any logged-in user |
| Edit, confirm, reject, complete | Admin, Staff |
| Cancel a reservation | Customer (own only from Phase 6) |
| View/edit own profile, change password | Any logged-in user |

**Rules:** users cannot change their own role or status through `/me`; changing a password requires the current password; the role is read from the current user record, so role changes and deactivation take effect immediately.

**Presentation line (Step 12):**
> "Protected routes pass through two middleware guards. `protect` reads the token from the Authorization header, verifies it with the secret key, and checks the account is still active, otherwise 401. `allowRoles` checks whether the user's role may perform the action, otherwise 403. Public routes like viewing available tables have no guards. Users can edit only their own profile, cannot change their role, and must enter their current password to change it."

---

### STEP 13: Login, Register, and Logout on the website
**Goal:** connect authentication to the React website.

**What we did**
- `api/apiClient.js`: token helpers (`getToken`, `saveToken`, `removeToken`) using `localStorage`; the token is added to every request as `Authorization: Bearer <token>`; errors keep `error.status`.
- `api/authApi.js`: `loginUser`, `registerUser`, `getCurrentUser`.
- `context/AuthContext.jsx`: shared login memory (`user`, `loading`, `login`, `register`, `logout`) available through `useAuth()`. On page load it calls `/api/auth/me` if a token was saved, so refreshing keeps the user logged in.
- `components/ProtectedRoute.jsx`: page guard. Not logged in → Login (remembers the wanted page); wrong role → redirected.
- Working `LoginPage` and `RegisterPage` (controlled inputs, error messages, redirects by role).
- `Navbar`: profile icon opens Login, or a dropdown (name, role, My Reservations or Dashboard, My Profile, Logout).
- `Sidebar`: shows the logged-in user, Logout button, "Users" link only for Admin.
- `Footer`: temporary dashboard link removed.
- `components/PasswordInput.jsx`: password field with an eye button (switches `type` between `password` and `text`; the button uses `type="button"` so it doesn't submit the form).

**Where each role goes**
| Situation | Result |
|---|---|
| Customer logs in | Home page (or the page they wanted) |
| Staff/Admin logs in | Dashboard |
| Logged out → `/my-reservations` or `/dashboard` | Login |
| Customer → `/dashboard` | Home page |
| Staff → `/dashboard/users` | Dashboard overview |

**Key ideas**
- `localStorage` keeps the token after refresh; logout deletes it.
- Context = one shared place for "who is logged in", instead of passing it through every component.
- Controlled inputs: each input's value lives in state and `onChange` updates it.
- `ProtectedRoute` hides pages for convenience; the **backend** guards (Step 12) are the real security.

**Presentation line:**
> "On login, React sends the email and password to the backend, receives a token, and saves it in localStorage so the user stays logged in after a refresh. An AuthContext shares the logged-in user with every component; the navbar and sidebar change based on the role. Every API request adds the token automatically. A ProtectedRoute component redirects logged-out visitors to Login and users with the wrong role away. The backend still checks the token and role on every request, so the real security is on the server. Logout deletes the token."

---

### STEP 14: My Profile page
**Goal:** let every user view their account, edit their info, and change their password (Account Management requirement).

**What we did**
- `authApi.js`: `updateMyProfile(changes)` and `changeMyPassword(current, new)` (backend endpoints already existed from Step 12).
- `AuthContext.jsx`: `updateUser()` replaces the remembered user after saving, so the navbar shows the new name immediately.
- `ProfilePage.jsx`: two independent forms (own state, messages, saving flag):
  - **Account Information**: read-only role and "member since"; editable name, email, phone; **Save Changes** and **Undo Changes** (restores saved values).
  - **Change Password**: current, new, confirm (with eye buttons); the browser checks the two new passwords match, the backend checks the current password and the password rules.
- `Sidebar.jsx`: "My Profile" link for Staff/Admin.

**Note learned in testing:** after a rejected save (e.g., duplicate email), the text box still shows what was typed, but the saved account is unchanged. Refresh or Undo Changes shows the saved values.

**Presentation line:**
> "Each user has a My Profile page. They can see their role and join date, and edit their name, email, and phone; the backend validates the data and rejects an email already used by another account. After saving, the shared login state updates so the new name appears immediately. Users can't change their own role. To change the password, they must enter the current one; the backend verifies it and the password rules before storing the new hash."

---

### STEP 15: Forgot / Reset Password (password recovery)
**Goal:** let users who forgot their password (and cannot log in) set a new one (mandatory requirement).

**What we did**
- `.env`: `CLIENT_URL=http://localhost:5173` (used to build the link).
- `utils/emailService.js`: `sendPasswordResetEmail()` **simulates** the email by printing it in the backend terminal. Real sending (e.g., nodemailer) would only change this file.
- `authController.js`: `forgotPassword` and `resetPassword`; `authUtils.toPublicUser` also hides the reset fields.
- Routes: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` (public).
- Frontend: `ForgotPasswordPage` (`/forgot-password`), `ResetPasswordPage` (`/reset-password/:token`, reads the token with `useParams()`), "Forgot password?" link on Login.

**Flow**
```
Forgot password? → enter email → server creates a random token, stores its HASH + 15-min expiry,
"emails" the link → user opens /reset-password/<token> → enters new password →
server hashes the token, finds the matching unexpired user, validates the password,
saves the new hash, deletes the token → user logs in
```

**Security rules**
| Rule | Why |
|---|---|
| 64-character random token (`crypto.randomBytes`, built into Node) | Impossible to guess |
| Expires after 15 minutes | Old emails can't be used later |
| One-time use (deleted after reset) | A link can't be reused |
| Only the SHA-256 hash is stored | A data leak doesn't expose usable links |
| Same answer whether the email exists or not | Attackers can't discover accounts |
| Inactive accounts get no link | Deactivated users stay locked out |

**Improvement: checking the link when the page opens**
- New route `GET /api/auth/reset-password/:token` (`checkResetToken`), sharing the helper `findUserByResetToken()` with `resetPassword`.
- `ResetPasswordPage` calls `checkResetLink(token)` in a `useEffect` and shows one of four screens: *Checking...*, **Link Not Valid** (used/expired/fake link, with "Request a New Link"), the **form**, or **success**.
- Before this, a used link still showed the form and only failed after submitting. Security was the same either way (the token is deleted after use); this only improves what the user sees.

**Forgot vs change password (Step 15):** change password (Step 14) requires being logged in and knowing the current password; forgot password proves identity with a secret link sent to the account's email.

**Presentation line:**
> "If users forget their password, they enter their email. The server creates a long random token, stores only its hash with a 15-minute expiry, and emails a reset link; in our demo the email is simulated in the server console, and sending is isolated in one file so real email can be added later. The response is the same whether the email exists or not. When the link is opened, the website sends the token with the new password; the server checks the token's hash and expiry, saves the new password hash, and deletes the token so the link works only once."

---

### STEP 16: User Management API (Admin only)
**Goal:** the Admin can view, add, edit, change roles, and activate/deactivate accounts (User Management requirement).

**What we did**
- `utils/validators.js`: shared `EMAIL_PATTERN`, `PH_MOBILE_PATTERN`, `validatePassword` (older controllers will switch to it during cleanup).
- `controllers/userController.js`: `getAllUsers`, `getUserById`, `createUser`, `updateUser`.
- `routes/userRoutes.js`: `router.use(protect, allowRoles("admin"))` guards every route in the file.
- `server.js`: `app.use("/api/users", userRoutes)`.
- `requests/users.http`: 23 tests (all passed).

**Endpoints**
| Endpoint | Purpose |
|---|---|
| `GET /api/users` | List; filters `?role=`, `?status=`, `?search=` (name/email); sorted admin → staff → customer |
| `GET /api/users/:id` | One user |
| `POST /api/users` | Create an account with any role (how Staff accounts are made) |
| `PUT /api/users/:id` | Edit name/email/phone, change role, activate/deactivate |

**My Profile vs User Management**
| | `/api/auth/me` | `/api/users` |
|---|---|---|
| Who | Any logged-in user | Admin only |
| Edits | Own account | Anyone's account |
| Role/status | Cannot change | Can change |

**Safety rules**
- Admin cannot change their own role or deactivate themselves.
- At least one active admin must always remain (`countActiveAdmins()`).
- No delete, only deactivate (keeps history, reversible).
- Passwords cannot be changed here (users use My Profile or Forgot Password).
- Deactivation is immediate: `protect` checks the account status on every request, so a logged-in user is blocked on their next action.

**Presentation line:**
> "User management is Admin only; every route passes through protect and allowRoles('admin'), so Staff get 403. The Admin can list, filter, and search users, create accounts with any role (that's how Staff accounts are made), edit details, change roles, and activate or deactivate accounts. Users are never deleted, to keep their history. Admins can't change their own role or deactivate themselves, and at least one active admin always remains. Deactivation takes effect immediately because protect checks the account status on every request."

---

### STEP 17: Manage Users page (Admin dashboard)
**Goal:** the website page for the Step 16 API.

**What we did**
- `api/userApi.js`: `getUsers(filters)`, `createUserAccount(data)`, `updateUserAccount(id, changes)` (named "UserAccount" to avoid confusion with `updateUser` in AuthContext).
- `components/Modal.jsx`: reusable pop-up frame; content goes between `<Modal>` and `</Modal>` (`children`). Will be reused in Phase 7.
- `components/UserForm.jsx`: one form, two modes: **Add** (no `user`, temporary password required, role defaults to Staff) and **Edit** (pre-filled, no password; role locked when editing yourself). It passes data to the page through `onSave`; errors show inside the form.
- `ManageUsersPage.jsx`: table with role/status badges and join date, search + role/status filters, **+ Add User**, **Edit**, **Deactivate/Activate** with `window.confirm`. Own row shows "(You)" with no Deactivate button. Editing your own name updates the sidebar (`updateUser`).
- CSS: page header, toolbar search, badges per role/status, danger button, modal overlay.

**Key ideas**
- `modal` state: `null` = closed, `{ mode: "add" }` or `{ mode: "edit", user }`.
- `refreshKey`: incremented after a change so the `useEffect` reloads the list.
- The page mirrors the backend safety rules, but the backend still enforces them.

**Presentation line:**
> "The Admin's Manage Users page lists every account with role and status badges, search, and filters. 'Add User' opens a pop-up where the admin creates accounts with any role, which is how Staff accounts are made, using a temporary password. 'Edit' opens the same form pre-filled. Accounts can be deactivated or reactivated after a confirmation, and deactivated users can't log in. The page follows the backend safety rules: the admin's own row can't be deactivated or have its role changed. Backend errors, like a duplicate email, appear inside the form."

---

### STEP 18: Booking backend (accounts, auto-assign, My Reservations)
**Goal:** connect reservations to customer accounts and assign tables automatically (core transaction, Phase 6).

**What we did**
- `data/reservations.js`: every reservation has `customer` (the account `_id`, or `null` for phone/walk-in bookings entered by staff); added r7 (Maria's past Completed visit).
- `reservationController.js`:
  - `validateDate()` and `hasSlotPassed()` split out of `validateSchedule()`; `table` is now optional.
  - `findAvailableTables(date, time, guests)`: in-service tables that fit and are free, **smallest first**. Used by the availability list, slot buttons, and auto-assign.
  - `createReservation`: customers' `table` is ignored and the table is **auto-assigned** (first result of `findAvailableTables`); staff may choose a table; one active booking per customer per slot (409); saves `customer`.
  - New `getMyReservations` (`GET /my`, customer only) and `getSlotAvailability` (`GET /slots?date=&guests=`, public: for each of the 5 seatings `available`, `tablesLeft`, `reason` = "Fully booked" / "Time has passed").
  - `getReservationById` and `cancelReservation`: customers only their **own** (403 otherwise).
- `reservationRoutes.js`: `/availability`, `/slots`, `/my` placed before `/:id`.
- `requests/booking.http`: 21 tests (all passed).

**Who can do what**
| Action | Customer | Staff/Admin |
|---|---|---|
| Slot availability | ✅ public | ✅ |
| Book | ✅ table auto-assigned | ✅ choose a table or auto-assign |
| `/my` | ✅ own | — |
| View one | own only | any |
| Cancel | own only | (use `/status`) |

**Presentation line:**
> "Each reservation is linked to the customer account that made it. Customers pick the date, time, and party size, and the server assigns the smallest available table that fits, so large tables stay free for large groups; if none fits, they're asked to choose another time. Staff can still choose a table for phone bookings, with the same conflict check. A customer can't hold two bookings in the same slot, and customers can only view and cancel their own reservations. A slots endpoint tells the booking form which seatings still have a table, so full or past slots are greyed out."

---

### STEP 19: The booking form (Book Now section)
**Goal:** the customer booking form from the group's draft, on the home page.

**What we did**
- `client/src/utils/dateHelpers.js`: `getTodayString`, `addDaysString`, `formatTime` ("19:00" → "7:00 PM"), `formatDate` ("2026-10-15" → "Thursday, October 15, 2026").
- `api/reservationApi.js`: `getSlotAvailability(date, guests)`, `createReservation(data)`.
- `components/BookingForm.jsx`, placed in the Book Now section of `HomePage.jsx` (photo placeholder on the left):
  - Full Name; Email | Phone; Date | Guests; 5 time-slot buttons; Special Requests (max 300, counter); Submit.
  - Contact details pre-filled from the logged-in customer's profile.
  - Slots reload whenever date/guests change (`GET /slots`); full or past slots are disabled and crossed out.
  - Date picker limited to today … +30 days.
  - No table is sent; the success screen shows the auto-assigned table and a Pending badge.
  - If booking fails (e.g., last table taken), the error is shown and the slots refresh.
  - Logged out: availability can be checked, "Log in to Book" (`state={{ from: "/#book" }}` brings them back). Staff/Admin: a note instead of Submit.
- CSS: two-column form rows, slot buttons (selected/disabled), login prompt, success box, reservation status badges (pending/confirmed/cancelled/completed).

**Mistake we hit:** `dateHelpers.js` was created in `server/utils` instead of `client/src/utils` (both projects have a `utils` folder). Fixed by moving it.

**Presentation line:**
> "When the customer picks a date and party size, the form asks the backend which of the five seatings still have a table for that many guests; full or past seatings are greyed out. Contact details are pre-filled for logged-in customers, and visitors must log in to book, returning to the form afterwards. On submit, the backend validates everything, assigns the smallest free table, and saves the booking as Pending; the customer sees a confirmation with the assigned table. Frontend checks are for convenience; the backend still validates everything."

---

### STEP 20: My Reservations page
**Goal:** customers view their bookings and cancel upcoming ones (requirements: "view their reservation", "cancel where appropriate").

**What we did**
- `dateHelpers.js`: `getNowString()` ("YYYY-MM-DD HH:MM").
- `reservationApi.js`: `getMyReservations()` (`GET /my`) and `cancelMyReservation(id, reason)` (`PATCH /:id/cancel`).
- `MyReservationsPage.jsx`: loads all of the customer's reservations once and splits them in the browser:
  - **Upcoming** = Pending/Confirmed and date+time still in the future (soonest first) → can be cancelled.
  - **History** = completed, cancelled, or past (newest first).
  - Cards: date, time, guests, table, special request, status badge, reference code, booked-on date, status message; cancelled cards show who cancelled ("You" / "The restaurant") and the reason.
  - **Cancel Reservation** opens the `Modal` with an optional reason; after cancelling, `refreshKey` reloads the list.
  - Empty states with a **Book a Table** link.
- CSS: tabs, reservation cards, `<dl>` details grid, empty state.

**Where the cancellation reason goes:** it is sent with `PATCH /:id/cancel` and saved on the reservation itself (`status: "Cancelled"`, `cancelledBy`, `cancellationReason`). It appears in the customer's History, and later in the staff dashboard and archive. It lives in server memory until MongoDB (Phase 9).

**Presentation line:**
> "Customers see only their own reservations, split into Upcoming and History. Each card shows the date, time, guests, assigned table, request, status, and a reference code. Upcoming bookings can be cancelled through a confirmation pop-up with an optional reason; the backend verifies ownership and that the booking hasn't started, and the table becomes available again immediately. Cancelled bookings show who cancelled and why."

---

### STEP 21: Manage Reservations page (Staff/Admin)
**Goal:** staff move bookings through the workflow from the dashboard.

**What we did**
- `reservationApi.js`: `getReservations(filters)` (`GET /api/reservations`) and `changeReservationStatus(id, status, reason)` (`PATCH /:id/status`). No backend changes.
- `ManageReservationsPage.jsx`:
  - Banner with the number of pending (not yet started) bookings.
  - Filters: View (Upcoming / Today / Past / All, done in the browser), Status (done by the backend), Search (name, email, phone, or reference).
  - Table: date & time + ref, customer + phone/email (+ "phone/walk-in booking" when `customer` is null), guests, table, status badge, notes (special request; who cancelled and why).
  - `renderActions(r)` shows only allowed buttons:

| Status | Before the time | After the time |
|---|---|---|
| Pending | Confirm, Reject | Reject |
| Confirmed | Cancel | Complete, No-show |
| Completed / Cancelled | none | none |

  - Confirm/Complete use `window.confirm`; Reject/Cancel/No-show open the `Modal` for a reason (No-show pre-fills "Customer did not arrive (no-show)"). All three send `status: "Cancelled"` + reason; the customer sees "Cancelled by: The restaurant (reason)".
- CSS: `.cell-sub` (grey second line in cells), notes column, `.alert-info`.

**Presentation line:**
> "Staff manage all bookings on one page with view, status, and search filters and a banner of pending requests. The buttons follow the workflow: pending bookings can be confirmed or rejected; confirmed ones can be cancelled before the time or, after it, completed or marked as a no-show. Completed and cancelled bookings are final. Reject, cancel, and no-show ask for a reason the customer can see. The backend enforces the same rules."

---

### STEP 22: Edit reservations + staff phone bookings
**Goal:** "Update reservations" requirement, plus bookings for customers who call or walk in.

**What we did**
- Backend `getAvailableTables`: reads an optional `exclude` from the URL and passes it to `findAvailableTables(date, time, guests, exclude || null)`.
- `reservationApi.js`: `getAvailableTables(date, time, guests, excludeId)` and `updateReservation(id, changes)`.
- `components/ReservationForm.jsx`: one form, two modes (new booking / edit) shown in the `Modal`. The **Table dropdown lists only free tables**, reloaded from `/availability` whenever date, time, or guests change; a chosen table that no longer fits is cleared. New bookings can use "Auto-assign"; edits must choose a table.
- `ManageReservationsPage.jsx`: **+ New Booking** button (phone/walk-in; `customer: null`) and **Edit** on Pending/Confirmed bookings that haven't started.

**The self-conflict problem again:** when editing r2, its own table looks "booked" (by r2 itself). `?exclude=r2` makes the availability check ignore r2, the same idea as `excludeId` in Step 7.

**Mistakes we hit:** a half-replaced function left old lines behind (`SyntaxError: Unexpected token '}'`), then `exclude` was missing/misspelled in `const { date, time, exclude } = req.query;` ("exclude is not defined"). Lesson: when replacing a function, select from its first comment line to its closing `};`.

**Presentation line:**
> "Staff can edit a booking when a customer calls, and create bookings for phone or walk-in customers, using the same pop-up form. When the date, time, or party size changes, the form asks the backend which tables are free and lists only those, so staff can't pick a double-booked table. When editing, the reservation itself is excluded from that check so its own table still appears. New bookings can be auto-assigned. The backend validates everything again on save."

---

### STEP 23: Manage Tables page (tables + daily schedule)
**Goal:** Let staff manage the dining area and see which tables are booked in each seating.

**What we did**
- `components/TableForm.jsx`: one form, two modes (add / edit) for table number, capacity, and location (with location suggestions), shown in the `Modal`.
- `ManageTablesPage.jsx` now has **two tabs**:
  - **Tables**: list with an "Upcoming bookings" count, **Add Table**, **Edit**, and **Take out of service / Put back in service**.
  - **Daily Schedule**: pick a date and see a grid (tables × the 5 seatings) showing which table is free, Pending, Confirmed, or Completed. Cancelled bookings don't count. Out-of-service tables are faded.
- Staff see **"In Service / Out of Service"** labels instead of the backend's `available` / `unavailable`.
- Taking a table out of service asks "Are you sure?" and **warns if the table still has upcoming bookings** (they are kept; staff should move them with Edit).
- CSS: legend, schedule grid colors, faded out-of-service rows.

**Two kinds of "availability" (common question):**
| | Table status (In/Out of Service) | Booked or free in a seating |
|---|---|---|
| Who sets it | Staff, manually | Automatic, from reservations |
| Meaning | Can this table be used at all? (broken, being repaired, reserved for events) | Is it taken at 7:00 PM on Oct 10? |
| Where | Tables tab | Daily Schedule tab |

**Mistake we hit:** `TableForm.jsx` was created in `pages/dashboard` instead of `components`, so the import failed. Lesson: reusable forms live in `components/`; only full pages go in `pages/`.

**Presentation line (Step 23):**
> "The Tables page has two views. In the Tables tab, staff add and edit tables and can take one out of service, for example if it's broken; the system then stops assigning it to new bookings and warns if it still has upcoming reservations. The Daily Schedule tab shows, for any date, which table is booked in each seating. That part is automatic: it is calculated from the reservations, so staff never update it by hand."

---

### STEP 24: Dashboard Overview + Customers page (end of Phase 7)
**Goal:** Give staff a starting page with today's situation, and a way to look up customers.

**What we did**
- `DashboardHomePage.jsx` (Overview): greeting + today's date, **4 cards** (Bookings today, Guests expected today, Pending requests, Tables in service), **Today's Reservations** table, and the 5 soonest **Pending Requests** with a link to Manage Reservations. **No new backend route**: it loads 3 existing lists at once with `Promise.all` and counts them in the browser.
- New backend `controllers/customerController.js` + `routes/customerRoutes.js`, mounted at `/api/customers` (Admin + Staff, **read-only**):
  - `GET /api/customers` (`?search=` name/email/phone, `?status=`): customer accounts + a `bookings` summary (total, completed, cancelled, upcoming, lastVisit).
  - `GET /api/customers/:id`: one customer + full booking history (newest first). 404 for non-customers.
- `api/customerApi.js` and `CustomersPage.jsx`: list with search/status filter and a **View** pop-up with contact info and booking history.
- CSS: stat cards, dashboard sections, history list.

**Why a separate `/api/customers` route?** `/api/users` is Admin-only and can **edit** accounts. Staff need to **see** customers (to call them about a booking), not manage accounts. A separate read-only route gives staff exactly what they need and nothing more (**least privilege**).

**How the numbers are counted**
| Number | Rule |
|---|---|
| Bookings today | Today's reservations with status Pending or Confirmed |
| Guests expected today | Sum of `guests` of those bookings |
| Pending requests | Pending reservations whose time hasn't passed yet |
| Customer "Upcoming" | Their Pending/Confirmed bookings from today on |
| Customer "Last visit" | Latest date among their **Completed** bookings |

Phone/walk-in bookings (`customer: null`) aren't linked to an account, so they don't count in customer stats.

**Testing note:** at night every seating for today has passed, so a booking for "today" can't be made; the "today" cards were checked the next day using the sample bookings (Oct 10).

**Presentation line:**
> "When staff log in, the Overview shows today's bookings, expected guests, pending requests, and tables in service. These numbers aren't stored anywhere; they're calculated from the reservations every time the page opens, so they're always current. The Customers page lets staff look up a customer's contact details and booking history, but it's read-only: only the Admin can edit accounts."

---

### STEP 25: Archive reservations (Phase 8)
**Goal:** Archive module requirement (view, search, restore) for reservations.

**What we did**
- New `controllers/archiveController.js` + `routes/archiveRoutes.js`, mounted at `/api/archive` (Staff/Admin):
  - `GET /api/archive/reservations` (`?search=` name/email/phone/ref), most recently archived first, with `archivedByName`.
  - `PATCH /api/archive/reservations/:id/archive` and `.../:id/restore`.
- `getAllReservations` now hides archived records: `reservations.filter((r) => !r.archived)`.
- Sample data: **r5 (Carlo)** starts archived (by Andrea, Oct 1) so the Archive page isn't empty.
- `api/archiveApi.js`, **Archive** button on Completed/Cancelled rows in `ManageReservationsPage.jsx`, and `ArchivePage.jsx` (search + Restore).

**Rules**
| Rule | Why |
|---|---|
| Only Completed/Cancelled can be archived | Pending/Confirmed bookings still need staff action |
| Archived = hidden from Manage Reservations | A cleaner working list |
| Restore = back unchanged (same status) | Archive is reversible |
| Save `archivedAt` + `archivedBy` | Accountability (when and who) |
| Customers still see archived bookings in My Reservations | It's still their real visit; archive is staff housekeeping |

**Archive vs delete:** archiving sets a flag (`archived: true`) instead of removing the record, often called a **soft delete**. Restoring turns the flag off. Nothing is ever lost, which matters for records like completed transactions.

**Testing confusion we hit:** the staff Reservations page defaults to **View: Upcoming**, so past bookings (Sep 26) only appear under **Past/All**. "History" is the customer's tab in My Reservations, not a staff page.

**Presentation line:**
> "Finished bookings can be moved to the Archive to keep the staff's working list clean. Archiving never deletes anything; it marks the record as archived and saves who did it and when. The Archive page lets staff search those records and restore any of them, unchanged. Only completed or cancelled bookings can be archived, and the backend enforces that."

---

### STEP 26: Archive user accounts (end of Phase 8)
**Goal:** Archive old accounts (e.g. a staff member who left) without deleting them.

**What we did**
- `archiveController.js` / `archiveRoutes.js`: added `GET /api/archive/users`, `PATCH /api/archive/users/:id/archive`, `PATCH /api/archive/users/:id/restore`, **Admin only** (`allowRoles("admin")` on each user route, on top of the router-wide `allowRoles("admin", "staff")`).
- `userController.js`: `getAllUsers` hides archived accounts; `updateUser` refuses to edit an archived account ("Restore it from the Archive first").
- `customerController.js`: the Customers list hides archived accounts.
- `ManageUsersPage.jsx`: **Archive** button on **inactive** accounts.
- `ArchivePage.jsx`: Admin sees **2 tabs** (Reservations / User Accounts); Staff see only reservations. One file, three functions: `ArchivePage` (picks the tab), `ArchivedReservations`, `ArchivedUsers`.

**Rules**
| Rule | Why |
|---|---|
| Admin only | Staff don't manage accounts |
| Must be **deactivated first** | An archived account can never log in; the Step 11 login check already blocks inactive accounts. Also protects the admin's own (active) account |
| Hidden from Users and Customers | Cleaner lists |
| Can't be edited while archived | Restore first |
| Restore → back **inactive** | Activating is a separate, deliberate decision |
| Their reservations stay | Booking history is never touched |

**Small UI fixes in this step**
- **Two eye icons** on password boxes in Microsoft Edge: Edge adds its own reveal button. Hidden with `.password-input input::-ms-reveal { display: none; }`.
- **Phone box sticking out of the New Booking pop-up:** grid columns set to `1fr` won't shrink below an input's default width. Fixed with `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)` and `width: 100%` on inputs in `.form-row`.

**Presentation line:**
> "The Admin can archive old accounts, like a staff member who resigned. An account must be deactivated first, so an archived account can never log in. Archived accounts disappear from the user and customer lists but nothing is deleted: their booking history stays, and the Admin can restore the account at any time. It comes back inactive, so reactivating it is a separate decision."

---

### STEP 27: Connect to MongoDB Atlas (Phase 9 starts)
**Goal:** Make data permanent. Until now everything lived in memory, so every restart reset it.

**Phase 9 plan:** 27 connect → 28 models + seed script → 29 tables/auth/users use MongoDB → 30 reservations → 31 customers/archive + remove the old `data/` arrays.

**What we did**
- Created a free **MongoDB Atlas** cluster (M0, AWS Singapore), a database user `poundadmin` (read/write), and allowed connections from anywhere (`0.0.0.0/0`, IP Access List).
- `npm install mongoose`. **Why Mongoose:** the standard way to use MongoDB from Node.js; it adds **schemas** (rules for each record) and simple commands like `User.find()`.
- `.env`: `MONGO_URI=mongodb+srv://poundadmin:PASSWORD@cluster0.xxxxx.mongodb.net/pound_reservations?appName=Cluster0`. `.env.example` has a fake placeholder.
- New `config/db.js`: `connectDB()` (connects, or prints the error and stops) and `getDatabaseStatus()`.
- `server.js`: checks `MONGO_URI` exists, **connects to MongoDB first and only then starts listening**, and `/api/health` now shows `"database": "connected"`.

**Why Atlas (cloud) instead of MongoDB on each laptop?** Nothing to install, and the whole group (and the presentation laptop) share **one** database with the same data. Downside: it needs internet, so bring a phone hotspot to the presentation.

**Why `0.0.0.0/0`?** Our IP changes (home, school, hotspot) and the groupmate has a different one. The database is still protected by its username and password.

**Mistakes we hit**
| Problem | Cause | Fix |
|---|---|---|
| `bad auth : authentication failed` | Password in `MONGO_URI` didn't match the Atlas user's password | Atlas → Database Users → Edit → set the same password |
| Data would go to a database named `test` | No name after `.net/` in the connection string | Add `pound_reservations` between `.net/` and `?` |

**Presentation line:**
> "The backend stores its data in MongoDB Atlas, a cloud database. The connection string contains a password, so it's kept in the .env file and never uploaded to GitHub. When the server starts, it connects to the database first and only then accepts requests; if the connection fails it stops with a clear message instead of running half-broken."

---

### STEP 28: Mongoose models + seed script
**Goal:** Describe each kind of record for MongoDB and fill the database with the sample data.

**What we did**
- New folder `server/models/`:
  - `User.js`: fullName, email (**unique**, lowercase), phone, passwordHash, role (`enum`), status, reset-token fields, archive fields. A **`toJSON` transform** removes `passwordHash` and the reset token whenever a user is sent as JSON.
  - `Table.js`: tableNumber (**unique**, min 1), capacity (1–20), location, status.
  - `Reservation.js`: `customer` and `table` are **references** (`ObjectId` + `ref`), plus date, time (`enum` of the 5 seatings), guests (1–10), status (`enum`), cancellation and archive fields. An **index** on `{ table, date, time }` makes the conflict check fast.
  - All use `timestamps: true` (automatic `createdAt`/`updatedAt`) and `versionKey: false` (no `__v`).
- New `server/seed.js` + `"seed": "node seed.js"` in `package.json`: **deletes** the 3 collections, then inserts the sample tables, users and reservations. Old IDs like `"t5"` are mapped to the new MongoDB IDs so references stay correct.

**Key ideas**
| Term | Meaning |
|---|---|
| Schema / model | The rules for one kind of record (like a form template). MongoDB itself accepts anything; the model enforces our rules. |
| Collection | MongoDB's "table": `users`, `tables`, `reservations` |
| Document | One record in a collection (one user, one booking) |
| ObjectId | MongoDB's automatic unique ID, e.g. `6aca7110be4a5b660eea7886` |
| Reference (`ref`) | A reservation stores the table's **ID**, not a copy of the table. `populate()` swaps the ID for the full record when needed. |
| Seed | Filling a database with starting/sample data |

**Careful:** the database is **shared** (Atlas). `npm run seed` resets it for the whole group, so tell your groupmate before running it.

**Presentation line:**
> "Each kind of record has a Mongoose model that defines its fields and rules, such as required fields, allowed status values, and unique emails and table numbers. A reservation doesn't copy the customer or the table; it stores their IDs as references. A seed script resets the database to known sample data with one command, which we use before testing and before the demo."

---

### STEP 29: Login, users and tables use MongoDB
**Goal:** Make accounts and tables permanent.

**What we did** (6 files, full replacements)
- `authController.js`, `userController.js`, `tableController.js`: arrays replaced by the models. Same rules and messages as before.
- `authMiddleware.js` (`protect`): loads the user with `User.findById()`. Old tokens with ids like `"u3"` are rejected (401), so the website logs you out once.
- `authUtils.js`: `toPublicUser(user)` is now `user.toJSON()` (the model removes the password hash).
- `errorMiddleware.js`: MongoDB errors become clear answers: invalid ID → **400**, schema rule broken → **400**, duplicate unique value → **409**.
- `authController.js` now uses the shared rules in `utils/validators.js` instead of its own copy.

**The pattern (same in every controller)**
| Before (array) | Now (MongoDB) |
|---|---|
| `users.find((u) => u.email === email)` | `await User.findOne({ email })` |
| `users.push(newUser)` | `await User.create({...})` |
| change a field (done) | change a field, then `await user.save()` |
| `a._id !== b._id` | `!a._id.equals(b._id)` (ids are objects) |
| `(req, res) =>` | `async (req, res) =>` + `await` |
| `_id: "u" + Date.now()` | removed: MongoDB creates the `_id` |

MongoDB words used: `$gte` (≥), `$ne` (not equal), `$gt` (>), `$or` (either condition), `$regex` + `"i"` (contains, any case), `exists()`, `countDocuments()`.

**Search safety:** `escapeRegex()` makes typed search text safe, because characters like `.` and `+` mean something special in a regex search.

**Mistake we hit:** the new authController code was pasted into `archiveController.js`, so `archiveRoutes.js` received `undefined` and the server crashed with `TypeError: argument handler must be a function`. Fixed with `git checkout -- controllers/archiveController.js` (restores the last committed version) and pasting into the right file. Lesson: check the **tab name** before pasting.

**Presentation line:**
> "Accounts and tables are stored in MongoDB, so they survive restarts. Every rule stayed the same; only the storage changed. For example, finding a user by email is now a database query, and any change has to be saved with save(). The login guard looks the user up in the database on every request, so a deactivated account is blocked immediately."

---

### STEP 30: Reservations, Customers and Archive use MongoDB
**Goal:** Make the core transaction permanent. After this step, the whole system runs on MongoDB.

**What we did** (4 files, full replacements)
- `reservationController.js`:
  - **Conflict check:** `Reservation.exists({ table, date, time, status: { $in: ["Pending","Confirmed"] } })`
  - **Free tables:** `Reservation.distinct("table", …)` gets the booked table ids, then `Table.find({ status: "available", capacity: { $gte: guests }, _id: { $nin: bookedIds } }).sort({ capacity: 1, tableNumber: 1 })` (smallest first)
  - **`populate("table")`** replaces the table id with the full table in every answer (replaces our old `withTableDetails`)
  - **Slots:** the 5 time slots are checked at the same time with `Promise.all`
- `customerController.js`: one query for all customers' reservations, then the summary per customer.
- `archiveController.js`: `populate("archivedBy", "fullName")` gives the "archived by" name.
- `utils/validators.js`: added the shared `escapeRegex`.

**New MongoDB words:** `$in` (is one of), `$nin` (is NOT one of), `distinct` (list of unique values), `populate` (follow a reference).

**Testing note:** in **Edit** mode, changing guests so the current table no longer fits clears the table, and the form asks you to **choose one** ("Please select a table"). That's the Step 22 rule: only new bookings auto-assign.

**Presentation line:**
> "The core booking logic now runs on MongoDB. To find free tables, the system asks the database which tables are already booked in that slot, then finds in-service tables that are big enough and not in that list, smallest first. Because a reservation stores only the table's ID, we use populate to show the table details. Bookings, status changes, cancellations and archive actions are all permanent now."

---

### STEP 31: Short booking references and Phase 9 cleanup (end of Phase 9)
**Goal:** make reservation reference numbers short enough for people to read, and tidy up after the move to MongoDB.

**Why short references?** A MongoDB id is 24 characters (`6aca7110be4a5b660eea7886`), too long to read out over the phone or type into a search box. We show only the **last 6 characters, in capitals**, like the last digits of a receipt number: `#EA7886`. The database still uses the full id; only what people see is shorter.

**What we did**
- `client/src/utils/formatRef.js`: `formatRef(id)` turns the full id into `#EA7886`. Used everywhere a reference is shown:
  - My Reservations: "Ref: #EA7886 · Booked on …"
  - Manage Reservations: the list, the "Edit Reservation (#EA7886)" title, and every success message (confirmed, updated, cancelled, archived)
  - Archive: the list, the "Restore …?" question, and the success messages
- **Searching by short reference:** typing `#EA7886` or `ea7886` finds the booking.
  - Manage Reservations checks it in the browser: `formatRef(r._id)` equals the typed text.
  - Archive asks the server: `archiveController.js` matches ids whose **last 6 characters** are the typed text (`$expr` + `$regexMatch` on the id turned into text with `$toString`). A full 24-character id still works too.
- **Cleanup:**
  - `server/data/*.js` are now only **sample data for `seed.js`**; their comments no longer say "temporary in-memory".
  - `escapeRegex` (makes typed search text safe for a MongoDB search) lives in one place, `utils/validators.js`, instead of being copied into controllers.
- **Follow-up fix:** `formatRef.js` first went into `server/utils/`, but React can't import files from the server folder, so it was moved to `client/src/utils/`.

**Key concepts**
| Concept | Meaning |
|---|---|
| `slice(-6)` | The last 6 characters of a text |
| `$toString` | MongoDB: turn the id into text so it can be searched |
| `$regexMatch` with `"ea7886$"` | "ends with ea7886" (`$` = end of the text), `options: "i"` ignores upper/lower case |
| `$expr` | Lets a MongoDB filter use those calculation operators |

**Could two bookings get the same short reference?** In theory yes, since only 6 of 24 characters are shown, but with the number of bookings a restaurant has it's extremely unlikely, and staff also see the name, date and time next to it.

**Presentation line:**
> "MongoDB ids are 24 characters long, which is too long for customers and staff to read out or type. Like a receipt, we show only the last 6 characters, for example #EA7886, and staff can search by that short reference. The full id is still used inside the database. This step also finished Phase 9: the old sample files are now only used to seed the database."

---

### STEP 32: Favicon and account pages (Phase 10: visual polish starts)
**Goal:** make the rest of the website match the new home page (Step 9).

**What we did**
- **Favicon:** `client/public/favicon.svg`, a white serif "P" on POUND brown. Files in `client/public/` are served as they are, at the site's root address (`/favicon.svg`), which is where `index.html` points.
- **New `layouts/AuthLayout.jsx`** for the four account pages (Login, Register, Forgot Password, Reset Password): a food photo (`about.jpg`) with the POUND text logo on the left, the page's form on the right. On phones the photo becomes a short banner above the form.
- `App.jsx`: the four account routes are wrapped in `<Route element={<AuthLayout />}>`, inside `PublicLayout`, so they still have the navbar and footer. **The four pages themselves didn't change**: each still renders its `.auth-card`, which appears in the layout's `<Outlet />`.
- Page titles (Login, Create an Account, …) use the brush font, and links on these pages are light brown.

**Why a layout and not editing each page?** The frame is the same for all four pages. A layout route writes it once; the pages only contain their form. This is the same idea as `PublicLayout` and `DashboardLayout` (Step 8): layouts can be nested.

**Presentation line:**
> "All account pages share one layout: a food photo with our logo next to the form. It's a nested layout route, so the frame is written once and the Login, Register and password pages only contain their forms."

---

### STEP 33: My Reservations and My Profile (Phase 10)
**Goal:** style the customer's own pages like the rest of the site.

**What we did** (almost all in `index.css`, section "Customer pages")
- **Page titles** (`.page h1`) use the brush font, like the home page.
- **My Reservations:** its tabs, cards and empty box had class names since Step 20 but **no styles yet**, so they showed as plain text. Now:
  - **Tabs** (Upcoming / History) are a pill-shaped switch; the active tab is brown.
  - **Reservation cards** are raised dark cards, two or three per row (one on phones). Each card's left edge and status message use the status color: yellow Pending, green Confirmed, grey Completed, red Cancelled (slightly faded).
  - Details (Guests, Table, Request, Cancelled by) are shown as label → value rows.
  - "No reservations" is a dashed box with a Book a Table button.
- `MyReservationsPage.jsx`: the only code change. Each card gets a class like `status-confirmed`, which sets `--status-color` in CSS.
- **My Profile:** the `.card` boxes are raised with a subtle border; their headings are small light-brown capitals.
- **Links styled as buttons** (`a.btn`, e.g. "Book a Table") are no longer underlined anywhere on the site.

**CSS idea: one variable per status.** Instead of repeating the colors for the edge and the message, each status class only sets `--status-color`; the border and the message both use `var(--status-color)`.

---

### STEP 34: Staff/Admin dashboard (Phase 10)
**Goal:** make the dashboard match the website, without changing how it works.

**What we did** (only `index.css`, section "Staff/Admin dashboard polish"; no page code changed)
- **Page titles** ("Welcome, Andrea", "Manage Tables", …) use the brush font; **section headings** ("Today's Reservations", "Pending Requests") are small light-brown capitals.
- **Overview number cards** and **all tables** sit in raised dark panels with rounded corners and a subtle border. Tables have a lighter header strip and highlight the row under the mouse.
- **Sidebar:** stays in place while the page scrolls (`position: sticky`); the current page has a soft brown background with a light-brown bar on the left.
- **Search box and dropdowns** have the same look, with a brown outline when selected.
- The Tables page's "Tables / Daily Schedule" switch automatically got the pill style from Step 33 (same `.tabs` class).
- Pop-up titles (e.g. "Edit Reservation") keep their normal style.

**Why everything starts with `.dashboard-content` or `.sidebar`:** those rules only apply inside the dashboard, so the public website can't change by accident. (CSS "scoping".)

---

### Tweaks after Step 34: continuous menu carousel + POUND font for headings
- **Headings:** section titles (ABOUT US, MENU, BOOK A TABLE, VISIT US) and the page titles of the account pages, customer pages and dashboard now use **Bodoni Moda** (`var(--font-logo)`, weight 700), the same font as the POUND logo, instead of the brush font.
- **Menu carousel** (`MenuCarousel.jsx`) rebuilt as a **conveyor belt** that never stops: the dishes are placed twice in a row and a CSS animation slides the row left by exactly half its width (one copy), then restarts. The restart can't be seen, so it looks endless. Hover pauses it (`animation-play-state: paused`); clicking a card opens the dish details. Speed: `SECONDS_PER_DISH` (seconds for one card to pass). `margin-right` is used instead of `gap` so both copies are exactly the same width.
- **Spacing fix:** buttons placed directly in a pop-up (reason pop-ups for Reject/Cancel) got space above them: `.modal > .form-actions { margin-top: 20px; }`.

---

### STEP 35: GSAP animations on the home page
**Goal:** a more polished, "alive" home page.

**New dependency (justified):** `gsap` + `@gsap/react` (in `client`). GSAP is the industry-standard animation library (free), with **ScrollTrigger** for scroll-based animations, which plain CSS can't do easily. `@gsap/react` gives `useGSAP()`, which cleans up the animations automatically when the page closes. Groupmates must run `npm install` in `client` after pulling.

**What we did**
- New `client/src/hooks/useHomeAnimations.js` (a **hook** = reusable React logic), used in `HomePage.jsx` with a `ref` on the page wrapper (`<div ref={pageRef}>`), so animations only affect the home page.
  1. **Hero entrance** (timeline): POUND rises in → the tagline box opens from the middle → FLATTERIE → the 2 buttons one after another (≈2.5 s).
  2. **Scroll reveal** (ScrollTrigger, `start: "top 85%"`): section titles, About text, photos, carousel and booking form slide up when they reach the screen; the About boxes, menu list and Visit Us cards appear **one by one** (`stagger`). Each plays once.
  3. **Parallax**: the hero photo is now its own layer (`.hero-bg`, 20% taller than the hero) that GSAP moves while scrolling (`scrub: true`), so it moves slower than the page.
- People who turned off animations in their device settings get none (`prefers-reduced-motion`).

**Words:** *timeline* (animations in order; `"-=0.5"` = start 0.5 s early), *stagger* (delay between items of a group), *scrub* (animation follows the scrollbar).

---

### STEP 36: Navbar highlights the current section (scroll spy)
- New `hooks/useActiveSection.js`: on every scroll it measures how many pixels of each home page section are on screen; the **most visible** section is active. At the very bottom of the page, the last section (Visit Us) wins, because it's short.
- `Navbar.jsx`: links built from one `NAV_LINKS` list (added **Visit Us**); the active link gets `class="active"` and `aria-current`.
- CSS: links slightly dimmed; an underline grows from the middle (half on hover, full when active).

---

### STEP 37: Transparent navbar over the hero
- The hero slides **up behind** the sticky navbar (negative top margin), so the photo starts at the very top of the screen.
- `Navbar.jsx` checks on every scroll whether the **bottom of the hero** is still below the navbar → class `navbar-over-hero` = transparent with a soft dark fade (readable links); otherwise solid brown (smooth `transition`). Other pages: always brown.

---

### STEP 38: Mobile menu (☰)
- Phones (≤ 700px): the section links become a **drop-down panel** opened by a ☰ button (it turns into ✕). One list of links, two looks, decided by CSS `@media`.
- State `linksOpen` in `Navbar.jsx`; `aria-expanded` / `aria-label` for screen readers.
- The panel closes when a link, the logo, or the login icon is tapped; the ☰ panel and the profile menu never open at the same time. While open, the navbar is solid (not transparent).
- **Bug we caught while testing:** when logged out, the profile icon is a *link* to Login (not the dropdown button), so it didn't close the panel. Fixed by closing the panel in that link's `onClick` (and the logo's).

---

### STEP 39: Short entrance on the account pages
- New `hooks/useAuthAnimations.js`, used in `AuthLayout.jsx` (so it covers Login, Register, Forgot and Reset Password).
- The photo panel fades in once; the form card slides up and its fields appear one quick step at a time (≈0.6 s), again when switching page (e.g. Login → Register: `dependencies: [pathname]`).
- **Kept short on purpose:** these are task pages, so typing works immediately during the animation. No animations on the dashboard or My Reservations (used all day; repeated animations get annoying).

### STEP 40: Visit Us: Google Map, directions, click-to-call, "Open now" badge
**Goal:** finish the Location section we planned ("real address + map") and make it useful.

**What we did**
- `config.js`: `OPEN_HOUR = 10`, `CLOSE_HOUR = 22` (hours as numbers for the badge) and `MAP_QUERY` (what Google Maps searches for).
- `HomePage.jsx` Visit Us: map on the left, 3 cards on the right (stacked on phones):
  - **Embedded Google Map** (`<iframe src="https://www.google.com/maps?q=...&output=embed">`): free, no account or API key. `loading="lazy"` = it only loads when you scroll near it.
  - **Get Directions** button → Google Maps directions in a new tab (`target="_blank"` + `rel="noopener noreferrer"` for safety).
  - **Click-to-call** (`tel:+639176318950`) and **click-to-email** (`mailto:`) links: on a phone they open the phone/email app.
- New `components/OpenStatusBadge.jsx`: green **"Open now · closes 10:00 PM"** or red **"Closed · opens 10:00 AM"**. Uses the time in **Asia/Manila** (correct even if the visitor's computer is in another time zone) and re-checks every minute (`setInterval`).
- The map also slides in with the scroll reveal (Step 35).

**Rule:** open when 10:00 ≤ now < 22:00 (checked: 9:59 closed, 10:00 open, 21:59 open, 22:00 closed).

**Known minor issue (for testing phase):** opening the site *directly* with a link ending in `#location` can stop a bit too early, because photos above it finish loading after the jump and push the page down. Clicking the navbar links works fine.

### STEP 41: "Tables left" on the booking time slots
- The backend already sent `tablesLeft` for each slot (`GET /api/reservations/slots`, Step 19); now the booking form shows it.
- `BookingForm.jsx`: new helper `slotLabel(slot)` → "Available", **"Only 2 tables left"** (3 or fewer), **"Last table!"** (1), or the reason it's disabled ("Fully booked", "Time has passed"). Low numbers are shown in light orange (`.few-left`).
- **Why only when few are left:** like real booking sites, it creates a little urgency without showing the restaurant's exact capacity all the time.
- Example (12 tables, Table 11 out of service): 6 guests → "Only 3 tables left" (Tables 9, 10, 12 fit), 10 guests → "Last table!" (only Table 12).

### STEP 42: Footer credit + balanced menu list (end of Phase 10)
- **Footer:** a third, smaller line: *"Menu items, photos, and prices are based on POUND x Flatterie and are used for academic purposes only."* **No link** to an outside menu site: this is a mock-up project, and the menu listing we found (imenuph.com) is a third-party site, not POUND's official page.
- **Menu list:** changed from a CSS grid to **flexbox with `justify-content: center`**, so with 5 dishes the last row's 2 dishes sit in the **middle** instead of on the left. 3 per row on computers, 2 on tablets (≤ 900px), 1 on phones (≤ 600px). Works for any number of dishes.
- **Note for the presentation:** the prices on our site don't all match the third-party listing (e.g. Good Ol' Fries ₱195 here vs ₱90 there), and Spaghetti and Meatballs isn't on that listing. Since it's a mock-up, we kept our sample prices; say so if asked.
- **Hint text (placeholders):** they were so bright they looked like real typed text. Now dimmer and in italics, and they **disappear as soon as you click** a field (`input:focus::placeholder { color: transparent; }`). Applies to every form on the site.

### STEP 43: Realistic sample data (Phase 11)
**Goal:** meet the requirements **"at least 10 realistic users"** and **"at least 20 completed transactions"**, and make every page look lived-in for the demo.

**Users (12)** in `server/data/users.js` (the admin was changed from Andrea Villanueva to **Giuz Montaño**, who is no longer a customer):
| Role | People | Password |
|---|---|---|
| Admin | Giuz Montaño | `Admin@123` |
| Staff | Marco Delos Reyes, Rene Baterbonia | `Staff@123` |
| Customers | Maria Santos, Paolo Garcia (**inactive**), Kclei Comuelo, Khalil Espiritu, Al-vi Ebdane, Giian Medina, Syd Villanueva, Carlo Valino, Jhoshua Gacud | `Customer@123` |

Emails follow `firstname.surname@gmail.com` (some yahoo/outlook), e.g. `giuz.montano@gmail.com`, `alvi.ebdane@gmail.com`.

**Reservations (40)** in `server/data/reservations.js`, covering about 6 weeks:
| Group | Count |
|---|---|
| **Completed** | **26** (24 visible + 2 archived) ✅ requirement: 20+ |
| Cancelled (customer, rejected by staff, no-show; 1 archived) | 5 |
| Confirmed **yesterday** (staff can demo "Complete" / "No-show") | 1 |
| Today (Confirmed) | 2 |
| Upcoming (4 Pending, 2 Confirmed) | 6 |

- **Dates are counted from today** (`day(-7)` = 7 days ago, `day(0)` = today), and sign-up dates too, so whenever you run the seed the data looks current. Run it on presentation day.
- A mix of **account** bookings (name/email/phone copied from the account with `account("u3")`) and **phone/walk-in** bookings (`walkIn(...)`).
- Different tables, time slots, party sizes and special requests; Table 11 (out of service) is never used.

**`seed.js` now checks the data first** (`checkSampleData()`), with the same rules as the real system: the table exists, the party fits it, no table used twice in the same slot (cancelled ones don't count), no upcoming booking on an out-of-service table, account bookings belong to a customer, and no customer holds 2 active bookings in one slot. **If anything is wrong it stops before deleting anything.** After seeding it prints a summary (users by role, reservations by status, archived count).

**Tested on a temporary database:** 12 users (1/2/9), 37 visible + 3 archived reservations, 24 visible Completed, 2 today, 4 Pending, Maria's stats (3 completed, last visit 14 days ago), the conflict check still blocks double booking, and a deliberately broken data file was refused.

---

## 6. API Reference

Base URL: `http://localhost:5000/api`

### Health
| Method | URL | Purpose |
|---|---|---|
| GET | `/health` | Check that the API is running |

### Tables
| Method | URL | Purpose | Future access (Phase 4) |
|---|---|---|---|
| GET | `/tables` | List tables (`?status=`, `?minCapacity=`) | Everyone |
| GET | `/tables/:id` | One table | Everyone |
| POST | `/tables` | Create table | Staff, Admin |
| PUT | `/tables/:id` | Update table | Staff, Admin |

### Reservations
| Method | URL | Purpose | Future access (Phase 4) |
|---|---|---|---|
| GET | `/reservations` | List (`?date=`, `?status=`, `?table=`) | Staff, Admin |
| GET | `/reservations/availability?date=&time=&guests=` | Free tables for a schedule | Everyone |
| GET | `/reservations/:id` | One reservation | Staff, Admin, owner |
| POST | `/reservations` | Make a booking | Customer |
| PUT | `/reservations/:id` | Edit details | Staff, Admin |
| PATCH | `/reservations/:id/status` | Confirm / reject / complete | Staff, Admin |
| PATCH | `/reservations/:id/cancel` | Cancel own booking | Customer (owner) |

### Customers (Step 24)
| Method | URL | Purpose | Access |
|---|---|---|---|
| GET | `/customers` | Customer accounts + booking summary (`?search=`, `?status=`) | Staff, Admin |
| GET | `/customers/:id` | One customer + booking history | Staff, Admin |

### Archive (Steps 25–26)
| Method | URL | Purpose | Access |
|---|---|---|---|
| GET | `/archive/reservations` | Archived reservations (`?search=`) | Staff, Admin |
| PATCH | `/archive/reservations/:id/archive` | Archive a Completed/Cancelled reservation | Staff, Admin |
| PATCH | `/archive/reservations/:id/restore` | Restore it | Staff, Admin |
| GET | `/archive/users` | Archived accounts (`?search=`) | Admin |
| PATCH | `/archive/users/:id/archive` | Archive an inactive account | Admin |
| PATCH | `/archive/users/:id/restore` | Restore it (stays inactive) | Admin |

### Response format
```json
{ "success": true, "count": 3, "data": [ ... ] }
{ "success": true, "message": "Reservation updated", "data": { ... } }
{ "success": false, "message": "Validation failed", "errors": [ "..." ] }
```

---

## 7. HTTP Status Codes We Use

| Code | Meaning | Example in our system |
|---|---|---|
| 200 OK | Success | Listing tables, confirming a reservation |
| 201 Created | New record saved | New table or reservation |
| 400 Bad Request | Invalid input or rule broken | Past date, too many guests, invalid status change |
| 404 Not Found | Record or route doesn't exist | `/api/reservations/r999`, `/api/banana` |
| 409 Conflict | Clashes with existing data | Table already booked; table number already used |
| 500 Server Error | Unexpected bug | Caught by `errorHandler` |

---

## 8. Errors We Hit and How We Fixed Them

| Error | Cause | Fix |
|---|---|---|
| `npm error Missing script: "dev"` | `package.json` edit not saved | Add `"dev": "nodemon server.js"` to scripts and **save** |
| Browser showed `{"success":true,"status":"ok"}` | Another project (`online_system`) was already using port 5000 | Stop the other server, or change `PORT` in `.env` |
| `Failed to resolve import "./assets/react.svg"` | `App.jsx` still had Vite demo code after deleting its files | Replace `App.jsx` contents and save |
| POST/PUT requests all returned 404 | Controller and routes files still had the old versions (not saved) | Replace both files and save |
| `[nodemon] app crashed` → `Cannot find module '../data/reservations'` | File was named `reservation.js` (missing "s") | Rename to `reservations.js` |
| `Failed to resolve import` (Step 8) | Folder `componenets` (typo), `MyReservationPage.jsx` and `ManageUserPage.jsx` (missing "s") | Rename to `components`, `MyReservationsPage.jsx`, `ManageUsersPage.jsx` |
| `Could not resolve '../utils/dateHelpers'` (Step 19) | File created in `server/utils` instead of `client/src/utils` | Move it to `client/src/utils/dateHelpers.js` |
| `Cannot find module '../utils/emailService'` and `Could not resolve './pages/ForgotPasswordPage'` (Step 15) | `emailService..js` and `ResetPasswordPage..jsx` (two dots), `ReseetPasswordPage` and `ForgetPasswordPage` (typos) | Rename to `emailService.js`, `ResetPasswordPage.jsx`, `ForgotPasswordPage.jsx`; type the whole name fresh when renaming |
| `Cannot find module '../controllers/authController'` (Step 11) | Files named `authControllersjs` (extra "s", missing dot) and `user.js` (missing "s") | Rename to `authController.js` and `users.js` |
| "Cannot connect to the server. Is the backend running?" (Step 10) | Only the frontend was running | Start the backend in a second terminal (`server` → `npm run dev`); both must run |
| `ERROR: Could not connect to MongoDB: querySrv ENODATA _mongodb._tcp.cluster0...` | The Wi-Fi router's DNS (192.168.1.1) can't answer the special SRV lookup that `mongodb+srv://` addresses need; Google DNS can | `config/db.js` now uses public DNS: `dns.setServers(["8.8.8.8", "1.1.1.1"])` before connecting (works on any network) |
| `ERROR: Could not connect to MongoDB: bad auth : authentication failed` (Step 27) | Password in `MONGO_URI` didn't match the Atlas database user | Atlas → Database Users → Edit → Edit Password (letters and numbers only) |
| `Failed to resolve import "../../components/TableForm"` (Step 23) | `TableForm.jsx` was saved in `pages/dashboard` | Move it to `client/src/components` |
| Page completely black (Step 8) | `main.jsx` not replaced, so `<App />` was not inside `<BrowserRouter>`; React Router crashed | Replace `main.jsx`; check **F12 → Console** for the red error |

**Lessons**
- Turn on **File → Auto Save**. A ● dot on a tab means unsaved.
- When nodemon says `app crashed`, scroll **up**; the real error is printed above it.
- `rs` + Enter in the nodemon terminal restarts the server manually.
- Data resets on every restart (in-memory data), so run tests in order after a fresh start.

---

## 9. Possible Instructor Questions

**Q: How do you prevent double-booking?**
Before saving, the server checks for any reservation with the same table, date, and time slot whose status is Pending or Confirmed. If one exists, it returns 409 Conflict. The availability list uses the same check.

**Q: What happens to the table when a reservation is cancelled?**
It becomes available automatically, because the conflict check only counts Pending and Confirmed reservations.

**Q: Why 2-hour time slots instead of exact times?**
Fixed, non-overlapping seatings make conflicts easy to detect and match how restaurants run lunch/dinner seatings. A party at 19:00 never overlaps one at 17:00.

**Q: Why can't a customer set the status or table capacity?**
The client cannot be trusted for business data. New bookings are always Pending, and capacity is read from the restaurant's own table records.

**Q: Why are tables not deleted?**
Old reservations refer to tables. Deleting a table would break that history, so we mark it `"unavailable"` instead.

**Q: Why are dates stored as text like "2026-10-10"?**
This format sorts and compares correctly as text, and it avoids timezone shifts between Philippine time and UTC.

**Q: Why does editing a reservation not conflict with itself?**
The conflict check receives the ID of the reservation being edited and skips it.

**Q: Why is status changed through a separate endpoint?**
So the workflow rules (`ALLOWED_STATUS_CHANGES` and the time rules) always apply and cannot be bypassed by a general edit.

**Q: What is middleware?**
Functions that run on requests before or after routes. We use `cors()`, `express.json()`, a 404 handler, and an error handler. In Phase 4 we'll add authentication and role-checking middleware.

**Q: Why use `_id` in temporary data?**
MongoDB names its ID field `_id`. Using the same name now means the frontend doesn't change when we switch to the database.

**Q: Where is the data stored right now?**
In JavaScript arrays in the server's memory, loaded from `data/*.js` when the server starts. Changes are lost on restart, which is why Phase 9 moves everything to MongoDB.

**Q: What are the 400, 404, and 409 codes for?**
400 = invalid input or rule broken, 404 = not found, 409 = conflict with existing data.

**Q: Do customers choose the time? Why not every 1 hour?**
Yes, customers choose a start time from a list. A meal takes about two hours, so a booking holds the table for two hours. With one-hour slots and an exact-time check, a 6 PM and a 7 PM booking on the same table would overlap. Two-hour seatings never overlap, so a simple same-slot check prevents double-booking. Hourly start times would still need the 2-hour hold plus a more complex overlap check.

**Q: Does the 2-hour rule block the whole restaurant?**
No. It applies per table. A 7 PM booking on Table 5 blocks only Table 5 at 7 PM; other tables remain bookable.

**Q: Do customers pick their own table?**
No. Customers choose date, time, and party size. The system auto-assigns the smallest available table that fits, so large tables stay free for large groups. Preferences go in Special Requests, and staff can reassign the table when editing (with the same conflict check).

**Q: How does the system choose a table?**
It searches for tables that are in service, seat at least the party size, and have no active reservation in that slot, sorted smallest first, and assigns the first one. If none is found, the customer is asked to choose another time.

**Q: Can a customer see or cancel someone else's reservation?**
No. Each reservation stores the customer's account ID; the server returns 403 if a customer tries to view or cancel a reservation that isn't theirs.

**Q: Does the system support multiple branches?**
No, it manages one restaurant location. Multi-branch support would need a branch on every table and reservation, branch selection, and per-branch staff, which is outside the project scope.

**Q: Why can staff mark a table unavailable if bookings already show availability?**
Two different things. Whether a table is booked at a certain time is automatic (from reservations). The button marks a table as out of service (broken, private event, weather), which bookings cannot know. The system then stops offering that table to customers. It is also a stated requirement.

**Q: Why do we need a Staff role?**
Customers only create bookings. Someone at the restaurant must confirm or reject them, edit them when customers call, and mark them Completed after the guests dine (the system cannot know who showed up), which is how the 20 completed transactions happen. Staff are separate from Admin because a restaurant has several employees but one manager: staff run daily operations but cannot create accounts or change roles (principle of least privilege, role-based access control). Separate accounts also give accountability and let the admin deactivate one employee without affecting others.

**Q: How are passwords stored?**
As bcrypt hashes, never as plain text. A hash is one-way: it cannot be turned back into the password. Login compares a hash of the typed password with the stored hash.

**Q: How does the server know who is logged in?**
After login it returns a JWT containing the user's ID and role, signed with a secret key. The frontend sends it with each request; the server checks the signature. A changed or fake token fails the check. Tokens expire after one day.

**Q: Can someone register as an admin?**
No. Registration always sets the role to customer on the server and ignores any role sent by the client. Staff accounts are created by the Admin.

**Q: Why does login say "Invalid email or password" instead of which one is wrong?**
So attackers cannot test emails to discover who has an account.

**Q: What is the difference between 401 and 403?**
401 means "I don't know who you are" (no token, fake, or expired). 403 means "I know who you are, but your role isn't allowed to do this."

**Q: How are routes protected?**
With two middleware functions placed before the controller: `protect` (valid token + active account) and `allowRoles` (allowed role). If either fails, the controller never runs.

**Q: Do Staff and Admin use different systems?**
No. It is one website with one login. After login, the role decides what each user sees: customers use the public site; Staff and Admin share the same dashboard, but Admin-only pages (Users, restoring archived users) are hidden from Staff and blocked by the backend (403) even if a staff member types the URL.

**Q: If the page is hidden, why also check on the backend?**
Hiding links and pages is only for convenience. Anyone could send requests directly (e.g., with a REST tool), so the server checks the token and role on every request.

**Q: How does password recovery work, and is it secure?**
The user requests a link by email. The link contains a 64-character random token that expires in 15 minutes and works once; the server stores only its hash. The response never reveals whether an email is registered. In the demo the email is printed in the server console; real sending would only change `emailService.js`.

**Q: How are Staff accounts created?**
Only the Admin can create them, through User Management (`POST /api/users`), choosing the role. Public registration always creates Customers.

**Q: What stops the Admin from locking everyone out?**
Safety rules: the Admin cannot change their own role or deactivate their own account, and the system refuses any change that would leave zero active admins.

**Q: Why deactivate accounts instead of deleting them?**
Deactivated users cannot log in, but their records and reservation history stay intact, and the account can be reactivated.

**Q: Why one login page for everyone?**
The system reads the user's role after login and sends Customers to the website and Staff/Admin to the dashboard. Register only creates Customer accounts; Staff accounts are created by the Admin, so no one can make themselves staff.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **API** | The set of URLs the frontend calls to get or change data |
| **Endpoint** | One URL + method, e.g. `POST /api/reservations` |
| **Route** | Code that connects an endpoint to a controller function |
| **Controller** | Function containing the logic for an endpoint |
| **Middleware** | Function that runs on requests before/after routes |
| **Request body** | JSON data sent with POST/PUT/PATCH |
| **Query string** | Filters in the URL after `?`, e.g. `?date=2026-10-10` |
| **URL parameter** | Value inside the URL path, e.g. `r1` in `/reservations/r1` (`req.params.id`) |
| **GET / POST / PUT / PATCH** | Read / create / edit details / change one part |
| **CORS** | Browser rule that blocks calls between different origins unless the server allows them |
| **State (React)** | Data a component remembers; changing it re-renders the page |
| **useEffect** | React hook that runs code after rendering (e.g., load data once) |
| **nodemon** | Tool that restarts the server when files change |
| **In-memory data** | Data kept in RAM; lost on restart |
| **populate()** | Mongoose feature that replaces an ID with the full related record |
