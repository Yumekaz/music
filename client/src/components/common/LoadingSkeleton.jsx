export function LoadingSkeleton({ label = "Loading" }) {
  const skeletonWrapClass = "grid gap-[16px] p-[16px] border border-line rounded-[8px]";
  const skeletonLineBaseClass = "rounded-[8px] bg-[#182018] animate-pulse h-[14px]";
  const skeletonCoverClass = "rounded-[8px] bg-[#182018] animate-pulse w-[64px] h-[64px]";
  const skeletonRowClass = "flex gap-[14px]";
  const skeletonStackClass = "flex-1 grid content-center gap-[10px]";

  return (
    <div className={skeletonWrapClass} role="status" aria-label={label}>
      <div className={`${skeletonLineBaseClass} w-[72%]`} />
      <div className={`${skeletonLineBaseClass} w-[44%]`} />
      <div className={skeletonRowClass}>
        <div className={skeletonCoverClass} />
        <div className={skeletonStackClass}>
          <div className={`${skeletonLineBaseClass} w-[72%]`} />
          <div className={`${skeletonLineBaseClass} w-[34%]`} />
        </div>
      </div>
    </div>
  );
}
