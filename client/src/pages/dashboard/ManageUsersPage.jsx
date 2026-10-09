// pages/dashboard/ManageUsersPage.jsx
// Admin only: view, search, filter, add, edit, and activate/deactivate users.
// Uses GET/POST/PUT /api/users (built in Step 16).

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUsers, createUserAccount, updateUserAccount } from "../../api/userApi";
import Modal from "../../components/Modal";
import UserForm from "../../components/UserForm";

function ManageUsersPage() {
  const { user: currentUser, updateUser } = useAuth(); // the admin who is logged in

  // ----- List + filters -----
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Changing this number makes the list load again (after adding/editing)
  const [refreshKey, setRefreshKey] = useState(0);
  const reloadUsers = () => setRefreshKey((key) => key + 1);

  // ----- Pop-up form -----
  // null = closed, { mode: "add" } or { mode: "edit", user: {...} }
  const [modal, setModal] = useState(null);

  // Load users on first load, when a filter/search changes, or after a change
  useEffect(() => {
    setLoading(true);
    setError("");

    getUsers({ search, role: roleFilter, status: statusFilter })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter, refreshKey]);

  // Called by UserForm when the admin clicks "Add User" / "Save Changes".
  // If the API fails, the error goes back to UserForm and is shown inside the form.
  const handleSave = async (data) => {
    if (modal.mode === "add") {
      const created = await createUserAccount(data);
      setMessage(`${created.fullName} was added as ${created.role}.`);
    } else {
      const updated = await updateUserAccount(modal.user._id, data);
      // If the admin edited their OWN name/email, update the sidebar too
      if (updated._id === currentUser._id) updateUser(updated);
      setMessage(`${updated.fullName} was updated.`);
    }

    setError("");
    setModal(null); // close the pop-up
    reloadUsers(); // show the latest list
  };

  // Activate or deactivate a user (asks for confirmation first)
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    const question =
      newStatus === "inactive"
        ? `Deactivate ${user.fullName}? They will no longer be able to log in.`
        : `Activate ${user.fullName}? They will be able to log in again.`;

    if (!window.confirm(question)) return; // admin clicked "Cancel"

    setError("");
    setMessage("");
    try {
      const updated = await updateUserAccount(user._id, { status: newStatus });
      setMessage(`${updated.fullName} is now ${updated.status}.`);
      reloadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // "2026-09-20T10:30:00.000Z" -> "Sep 20, 2026"
  const formatDate = (isoDate) =>
    new Date(isoDate).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p className="muted">Add staff accounts, edit user details, and manage access.</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            setMessage("");
            setModal({ mode: "add" });
          }}
        >
          + Add User
        </button>
      </div>

      {/* Search + filters */}
      <div className="toolbar">
        <div className="toolbar-group">
          <input
            type="search"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label>
            Role:{" "}
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </label>

          <label>
            Status:{" "}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <span className="muted">Showing {users.length} user(s)</span>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* User list */}
      {loading ? (
        <p className="muted">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="muted">No users found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user._id === currentUser._id;

                return (
                  <tr key={user._id}>
                    <td>
                      {user.fullName}
                      {isSelf && <span className="muted"> (You)</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status}`}>{user.status}</span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setMessage("");
                            setModal({ mode: "edit", user });
                          }}
                        >
                          Edit
                        </button>

                        {/* No deactivate button on your own account (safety rule) */}
                        {!isSelf && (
                          <button
                            className={
                              user.status === "active" ? "btn btn-danger" : "btn btn-outline"
                            }
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pop-up form (only shown when "modal" is not null) */}
      {modal && (
        <Modal
          title={modal.mode === "add" ? "Add User" : `Edit ${modal.user.fullName}`}
          onClose={() => setModal(null)}
        >
          <UserForm
            user={modal.mode === "edit" ? modal.user : null}
            isSelf={modal.mode === "edit" && modal.user._id === currentUser._id}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

export default ManageUsersPage;
