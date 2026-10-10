// pages/dashboard/CustomersPage.jsx
// Staff/Admin: view registered customers, their contact details, and booking history.
// View only: editing accounts stays in Manage Users (Admin only).

import { useEffect, useState } from "react";
import { getCustomers, getCustomerById } from "../../api/customerApi";
import { formatDate, formatTime } from "../../utils/dateHelpers";
import Modal from "../../components/Modal";

// "2026-09-26" -> "Sep 26, 2026" (short version for the table)
const shortDate = (dateString) => {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function CustomersPage() {
  // ----- List + filters -----
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----- "View" pop-up: the customer + their booking history -----
  const [selected, setSelected] = useState(null);

  // Load customers on first load and when the search/filter changes
  useEffect(() => {
    setLoading(true);
    setError("");

    getCustomers({ search, status: statusFilter })
      .then((data) => setCustomers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  // Load one customer's full history, then open the pop-up
  const handleView = async (customer) => {
    setError("");
    try {
      const data = await getCustomerById(customer._id);
      setSelected(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="muted">Registered customers, their contact details, and booking history.</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="toolbar">
        <div className="toolbar-group">
          <input
            type="search"
            placeholder="Search name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label>
            Status:{" "}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <span className="muted">Showing {customers.length} customer(s)</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Customer list */}
      {loading ? (
        <p className="muted">Loading customers...</p>
      ) : customers.length === 0 ? (
        <p className="muted">No customers found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Bookings</th>
                <th>Completed</th>
                <th>Upcoming</th>
                <th>Last Visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>{c.fullName}</td>
                  <td>
                    {c.email}
                    <div className="cell-sub">{c.phone}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </td>
                  <td>{c.bookings.total}</td>
                  <td>{c.bookings.completed}</td>
                  <td>{c.bookings.upcoming}</td>
                  <td>{c.bookings.lastVisit ? shortDate(c.bookings.lastVisit) : "-"}</td>
                  <td>
                    <button className="btn btn-outline" onClick={() => handleView(c)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer details pop-up */}
      {selected && (
        <Modal title={selected.fullName} onClose={() => setSelected(null)}>
          <div className="info-list">
            <div className="info-row">
              Email <strong className="no-caps">{selected.email}</strong>
            </div>
            <div className="info-row">
              Phone <strong>{selected.phone}</strong>
            </div>
            <div className="info-row">
              Account <strong>{selected.status}</strong>
            </div>
            <div className="info-row">
              Member since <strong>{shortDate(selected.createdAt)}</strong>
            </div>
            <div className="info-row">
              Bookings{" "}
              <strong>
                {selected.bookings.total} total · {selected.bookings.completed} completed ·{" "}
                {selected.bookings.cancelled} cancelled
              </strong>
            </div>
          </div>

          <h3>Booking History</h3>
          {selected.reservations.length === 0 ? (
            <p className="muted">No bookings yet.</p>
          ) : (
            <ul className="history-list">
              {selected.reservations.map((r) => (
                <li key={r._id} className="history-item">
                  <div>
                    <strong>{formatDate(r.date)}</strong>
                    <div className="cell-sub">
                      {formatTime(r.time)} · {r.guests} guest(s) ·{" "}
                      {r.table ? `Table ${r.table.tableNumber}` : "No table"}
                    </div>
                    {r.specialRequest && <div className="cell-sub">Note: {r.specialRequest}</div>}
                  </div>
                  <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

export default CustomersPage;
