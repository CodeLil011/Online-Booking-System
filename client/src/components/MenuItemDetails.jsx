// components/MenuItemDetails.jsx
// Pop-up with the full details of one dish (opened by clicking a dish in the Menu section).
// Usage:
//   <MenuItemDetails item={selectedItem} onClose={() => setSelectedItem(null)} />

import { useNavigate } from "react-router";
import Modal from "./Modal";
import Photo from "./Photo";
import { formatPrice } from "../utils/formatPrice";

function MenuItemDetails({ item, onClose }) {
  const navigate = useNavigate();

  // Close the pop-up, then scroll down to the booking form
  const handleBook = () => {
    onClose();
    navigate("/#book");
  };

  return (
    <Modal title={item.name} onClose={onClose}>
      <Photo file={item.image} alt={item.name} className="menu-details-photo" />

      <div className="menu-details-info">
        <span className="badge">{item.category}</span>
        {item.price !== null && <span className="menu-price">{formatPrice(item.price)}</span>}
      </div>

      <p className="menu-details-text">{item.details}</p>

      {item.ingredients.length > 0 && (
        <>
          <h3 className="menu-details-heading">What's in it</h3>
          <ul className="ingredient-list">
            {item.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Close
        </button>
        <button type="button" className="btn" onClick={handleBook}>
          Book a Table
        </button>
      </div>
    </Modal>
  );
}

export default MenuItemDetails;
