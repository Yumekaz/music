export function LoadingSkeleton({ label = "Loading" }) {
  return (
    <div className="skeleton-wrap" role="status" aria-label={label}>
      <div className="skeleton-line wide" />
      <div className="skeleton-line" />
      <div className="skeleton-row">
        <div className="skeleton-cover" />
        <div className="skeleton-stack">
          <div className="skeleton-line wide" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  );
}
