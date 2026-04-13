/**
 * Skeleton loading components for Threadora.
 * All use the `.skeleton` CSS class which has a left-to-right shimmer sweep.
 */

// ─── Page Loader ──────────────────────────────────────────────────────────────
// Shared full-page loading spinner for admin and protected pages

export function PageLoader({ className = 'py-32' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
        <span className="text-xs text-[#908FA0] animate-pulse">Loading…</span>
      </div>
    </div>
  );
}

// ─── Thread Card Skeleton ──────────────────────────────────────────────────────
// Mirrors the exact layout of ThreadCard.jsx

export function ThreadCardSkeleton() {
  return (
    <div className="glass-panel p-5 rounded-3xl mb-4">
      <div className="flex gap-4">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
          <div className="skeleton w-7 h-7 rounded-md" />
          <div className="skeleton w-5 h-3 rounded" />
          <div className="skeleton w-7 h-7 rounded-md" />
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Meta row: category • author • time */}
          <div className="flex items-center gap-2 mb-3">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-2 w-2 rounded-full" />
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-2 w-2 rounded-full" />
            <div className="skeleton h-3 w-12 rounded" />
          </div>

          {/* Title */}
          <div className="skeleton h-5 w-4/5 rounded mb-1.5" />
          <div className="skeleton h-5 w-3/5 rounded mb-4" />

          {/* Body text lines */}
          <div className="space-y-2 mb-4">
            <div className="skeleton h-3.5 w-full rounded" />
            <div className="skeleton h-3.5 w-[92%] rounded" />
            <div className="skeleton h-3.5 w-[70%] rounded" />
          </div>

          {/* Footer: comment pill + save pill */}
          <div className="flex items-center gap-3">
            <div className="skeleton h-7 w-16 rounded-full" />
            <div className="skeleton h-7 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Thread Feed Skeleton ─────────────────────────────────────────────────────
// Renders N thread card skeletons for the feed initial load

export function ThreadFeedSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ThreadCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Thread Detail Skeleton ───────────────────────────────────────────────────
// Mirrors the layout of the article block + comment section in ThreadDetail.jsx

export function ThreadDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Back button placeholder */}
      <div className="flex items-center gap-4 mb-6 py-2">
        <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="skeleton h-3 w-24 rounded hidden sm:block" />
      </div>

      {/* Article */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl mb-8">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>

        {/* Title */}
        <div className="skeleton h-8 w-full rounded mb-2" />
        <div className="skeleton h-8 w-3/4 rounded mb-8" />

        {/* Body paragraphs */}
        <div className="space-y-2.5 mb-8">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-[95%] rounded" />
          <div className="skeleton h-4 w-[88%] rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-[72%] rounded" />
          <div className="skeleton h-4 w-[80%] rounded" />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 pt-6 border-t border-white/5">
          <div className="skeleton h-9 w-28 rounded-lg" />
          <div className="skeleton h-9 w-28 rounded-lg" />
          <div className="skeleton h-9 w-20 rounded-lg" />
          <div className="skeleton h-9 w-20 rounded-lg ml-auto" />
        </div>
      </div>

      {/* Comment skeletons */}
      <div className="space-y-1">
        <div className="skeleton h-3 w-24 rounded mb-6" />
        <CommentSkeleton depth={0} />
        <CommentSkeleton depth={0} />
        <CommentSkeleton depth={1} />
        <CommentSkeleton depth={0} />
        <CommentSkeleton depth={1} />
        <CommentSkeleton depth={2} />
      </div>
    </div>
  );
}

// ─── Individual Comment Skeleton ──────────────────────────────────────────────

function CommentSkeleton({ depth = 0 }) {
  // Indent matches the real CommentNode — 44px per level (avatar 32px + mr-3 12px)
  const indentPx = depth * 44;
  const lineWidths = ['full', '[95%]', '[80%]', '[65%]'];
  // Vary body length per skeleton to look natural
  const bodyLines = 1 + (depth % 3 === 0 ? 2 : depth % 3 === 1 ? 1 : 0);

  return (
    <div className="flex pb-4" style={{ paddingLeft: `${indentPx}px` }}>
      {/* Avatar + thread line */}
      <div className="flex flex-col items-center mr-3 flex-shrink-0">
        <div className="skeleton w-8 h-8 rounded-lg" />
        {depth < 2 && <div className="w-[2px] flex-1 mt-1 bg-white/5 rounded-full min-h-[32px]" />}
      </div>

      {/* Comment body */}
      <div className="flex-1 min-w-0">
        {/* Header: username + time */}
        <div className="flex items-center gap-2 mb-2">
          <div className="skeleton h-3.5 w-24 rounded" />
          <div className="skeleton h-3 w-14 rounded" />
        </div>

        {/* Body lines */}
        <div className="space-y-1.5 mb-3">
          {Array.from({ length: bodyLines }).map((_, i) => (
            <div
              key={i}
              className={`skeleton h-3.5 rounded`}
              style={{ width: i === bodyLines - 1 ? `${55 + (depth * 7) % 30}%` : '100%' }}
            />
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-6 w-16 rounded-md" />
          <div className="skeleton h-6 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}
