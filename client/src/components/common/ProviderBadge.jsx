export function ProviderBadge({ provider, href }) {
  const label = provider.replace(/^\w/, (char) => char.toUpperCase());

  const baseClass = "inline-flex items-center gap-[10px] min-h-[28px] px-[10px] py-[5px] border border-line rounded-full bg-[#101510] text-[0.78rem]";

  if (!href) {
    return <span className={`${baseClass} text-muted`}>{label}</span>;
  }

  return (
    <a className={`${baseClass} text-[#dfe7dd]`} href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}
