import './stage.css';

/** Simple chrome tonearm. `down` = needle on the record (only while playing). */
export function Tonearm({ down, className = '' }: { down: boolean; className?: string }) {
  return (
    <div className={`tonearm ${down ? 'is-down' : ''} ${className}`} aria-hidden="true">
      <span className="tonearm__base" />
      <span className="tonearm__arm">
        <span className="tonearm__head" />
      </span>
    </div>
  );
}
