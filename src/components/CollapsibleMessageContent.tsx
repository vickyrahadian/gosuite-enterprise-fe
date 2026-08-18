import { useMemo, useState } from 'react';

type CollapsibleMessageContentProps = {
  value: unknown;
  emptyMessage?: string;
};

function formatXml(value: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(value, 'application/xml');
  if (document.querySelector('parsererror')) return value;

  const serialized = new XMLSerializer().serializeToString(document);
  const lines = serialized.replace(/>\s*</g, '><').replace(/(>)(<)(\/?)/g, '$1\n$2$3').split('\n');
  let depth = 0;
  return lines.map((line) => {
    const trimmed = line.trim();
    if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1);
    const formatted = `${'  '.repeat(depth)}${trimmed}`;
    if (/^<[^!?/][^>]*[^/]>(?!.*<\/)/.test(trimmed)) depth += 1;
    return formatted;
  }).join('\n');
}

export function CollapsibleMessageContent({ value, emptyMessage = 'No content available.' }: CollapsibleMessageContentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const message = typeof value === 'string' ? value : '';
  const formattedMessage = useMemo(() => message.trim().startsWith('<') ? formatXml(message) : message, [message]);

  return <div className="collapsible-message-content">
    <button className="button button--secondary" type="button" aria-expanded={isVisible} onClick={() => setIsVisible((visible) => !visible)}>{isVisible ? 'Hide message' : 'Show message'}</button>
    {isVisible && <pre>{formattedMessage || emptyMessage}</pre>}
  </div>;
}
