import { useEffect, useId, useRef } from 'react';

export type NotificationVariant = 'success' | 'error' | 'confirm';

type NotificationModalProps = {
  isOpen: boolean;
  variant: NotificationVariant;
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  isProcessing?: boolean;
  onPrimary: () => void;
  onClose: () => void;
};

const icons: Record<NotificationVariant, string> = {
  success: '\u2713',
  error: '!',
  confirm: '?',
};

export function NotificationModal({
  isOpen,
  variant,
  title,
  message,
  primaryLabel = 'OK',
  secondaryLabel,
  isProcessing = false,
  onPrimary,
  onClose,
}: NotificationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="notification-modal"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isProcessing) onClose();
      }}
    >
      <div className={`notification-modal__icon notification-modal__icon--${variant}`} aria-hidden="true">
        {icons[variant]}
      </div>
      <h2 id={titleId}>{title}</h2>
      <p id={messageId}>{message}</p>
      <div className="notification-modal__actions">
        {secondaryLabel && (
          <button className="button button--secondary" type="button" onClick={onClose} disabled={isProcessing}>
            {secondaryLabel}
          </button>
        )}
        <button
          className={`button ${variant === 'confirm' ? 'button--danger' : 'button--primary'}`}
          type="button"
          onClick={onPrimary}
          disabled={isProcessing}
          autoFocus
        >
          {isProcessing ? 'Processing...' : primaryLabel}
        </button>
      </div>
    </dialog>
  );
}
