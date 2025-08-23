import { Modal as BootstrapModal } from 'react-bootstrap';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  showCloseButton = true
}) {
  return (
    <BootstrapModal show={isOpen} onHide={onClose} size={size} centered>
      <BootstrapModal.Header closeButton={showCloseButton}>
        {title && <BootstrapModal.Title>{title}</BootstrapModal.Title>}
      </BootstrapModal.Header>
      <BootstrapModal.Body>
        {children}
      </BootstrapModal.Body>
    </BootstrapModal>
  );
}

// Confirmation Modal Component
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) {
  const typeStyles = {
    danger: {
      button: 'btn-danger',
      icon: 'bi-exclamation-triangle'
    },
    warning: {
      button: 'btn-warning',
      icon: 'bi-exclamation-triangle'
    },
    info: {
      button: 'btn-primary',
      icon: 'bi-info-circle'
    }
  };

  const currentStyle = typeStyles[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="d-flex align-items-center mb-3">
        <i className={`${currentStyle.icon} fs-4 me-3`}></i>
        <p className="mb-0">{message}</p>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`btn ${currentStyle.button}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
