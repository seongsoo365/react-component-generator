import { useId } from 'react';
import type { ReactNode } from 'react';

interface WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  closeLabel?: string;
}

export function Window({ title, children, className = '', onClose, closeLabel = '닫기' }: WindowProps) {
  const titleId = useId();

  return (
    <section className={`win ${className}`} aria-labelledby={titleId}>
      <div className="win-title">
        {onClose ? (
          <button type="button" className="win-close" onClick={onClose} aria-label={closeLabel} title={closeLabel} />
        ) : (
          <span className="win-close win-close--static" aria-hidden="true" />
        )}
        <h2 id={titleId}>{title}</h2>
      </div>
      <div className="win-body">{children}</div>
    </section>
  );
}
