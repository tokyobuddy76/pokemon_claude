export default function ProgressBar({ current, total, answered }) {
  const percent = Math.round((answered / total) * 100);
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>
          Question <strong>{current}</strong> of {total}
        </span>
        <span>{percent}% complete</span>
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-valuetext={`${answered} of ${total} questions answered`}
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <ol className="progress__dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i + 1 === current ? 'is-current' : i < answered ? 'is-done' : ''} />
        ))}
      </ol>
    </div>
  );
}
