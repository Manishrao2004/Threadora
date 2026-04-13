import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function RichTextRenderer({ content, truncate = false }) {
  if (!content) return null;

  // If truncate is true, just show simple text up to a certain length without embeds
  if (truncate) {
    const text = content.replace(URL_REGEX, '[$1]');
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  // Split text by URLs to make them clickable
  const parts = content.split(URL_REGEX);

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap word-break break-words">
        {parts.map((part, i) => {
          if (part.match(URL_REGEX)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    </div>
  );
}
