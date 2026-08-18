import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';

type FormModalProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function FormModal({
  isOpen,
  title,
  children,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onClose,
}: FormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="form-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onClose();
      }}
    >
      <form onSubmit={onSubmit}>
        <div className="form-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button className="form-modal__close" type="button" aria-label="Close" title="Close" onClick={onClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>
        <div className="form-modal__body">{children}</div>
        <div className="form-modal__actions">
          <button className="button button--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
