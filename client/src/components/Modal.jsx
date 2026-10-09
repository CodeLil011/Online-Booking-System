// components/Modal.jsx
// A pop-up box shown on top of the page (dark background behind it).
// Usage:
//   <Modal title="Add User" onClose={() => ...}>
//     ...content...
//   </Modal>

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Whatever is placed between <Modal> and </Modal> appears here */}
        {children}
      </div>
    </div>
  );
}

export default Modal;
