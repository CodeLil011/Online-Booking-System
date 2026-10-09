// components/TableForm.jsx
// Form for ADDING or EDITING a restaurant table (shown in a Modal).
//   table = null    -> Add mode
//   table = {...}   -> Edit mode (pre-filled)

import { useState } from "react";

// Suggestions for the location box (staff can still type a new one)
const LOCATION_SUGGESTIONS = ["Window Side", "Main Hall", "Garden Area", "Function Room"];

function TableForm({ table, onSave, onCancel }) {
  const isEdit = Boolean(table);

  const [form, setForm] = useState({
    tableNumber: table ? table.tableNumber : "",
    capacity: table ? table.capacity : 4,
    location: table ? table.location : "Main Hall",
    status: table ? table.status : "available",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Number fields come from inputs as text, so convert them
      await onSave({
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
        location: form.location,
        status: form.status,
      });
    } catch (err) {
      setError(err.message); // e.g. "Table 5 already exists"
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tf-number">Table Number</label>
          <input
            id="tf-number"
            name="tableNumber"
            type="number"
            min="1"
            value={form.tableNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="tf-capacity">Capacity (seats)</label>
          <input
            id="tf-capacity"
            name="capacity"
            type="number"
            min="1"
            max="20"
            value={form.capacity}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tf-location">Location</label>
        {/* list="..." connects the input to the suggestions below */}
        <input
          id="tf-location"
          name="location"
          list="location-suggestions"
          value={form.location}
          onChange={handleChange}
          required
        />
        <datalist id="location-suggestions">
          {LOCATION_SUGGESTIONS.map((place) => (
            <option key={place} value={place} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label htmlFor="tf-status">Status</label>
        <select id="tf-status" name="status" value={form.status} onChange={handleChange}>
          <option value="available">In Service (can be booked)</option>
          <option value="unavailable">Out of Service (cannot be booked)</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Table"}
        </button>
      </div>
    </form>
  );
}

export default TableForm;
