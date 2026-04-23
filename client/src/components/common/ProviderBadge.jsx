export function ProviderBadge({ provider, href }) {
  const label = provider.replace(/^\w/, (char) => char.toUpperCase());
  if (!href) {
    return <span className="provider-badge muted">{label}</span>;
  }

  return (
    <a className="provider-badge" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}
