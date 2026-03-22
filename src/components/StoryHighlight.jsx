/* eslint-disable @next/next/no-img-element */

export default function StoryHighlight({
  label,
  image,
  initial,
  seen = false,
}) {
  const ringGradient = seen
    ? "conic-gradient(from 90deg, #d4d4d8, #f4f4f5, #d4d4d8)"
    : "conic-gradient(from 90deg, #f5b841, #0f6b5f, #f5b841)";
  const fallback = (initial || label || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={`flex flex-col items-center gap-2 text-center cursor-pointer ${
        seen ? "story-seen" : "story-unseen"
      }`}
    >
      {/* Ring rotativo + pulse quando não visto */}
      <div
        className={`group relative flex h-20 w-20 items-center justify-center rounded-full ${
          seen ? "" : "animate-ring-pulse"
        }`}
      >
        <div
          className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 ${
            seen ? "" : "animate-ring-rotate"
          }`}
          style={{ backgroundImage: ringGradient }}
        >
          <div className="h-full w-full rounded-full bg-white p-[3px] dark:bg-zinc-900">
            {image ? (
              <img
                src={image}
                alt={label}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[rgba(15,107,95,0.08)] text-lg font-semibold text-[var(--fh-green)] dark:bg-zinc-800">
                {fallback}
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
    </div>
  );
}

