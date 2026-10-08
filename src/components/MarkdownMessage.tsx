import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <div className="text-sm text-[#14211F] leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold text-[#14211F]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-[#14211F]">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 my-2.5 space-y-1.5 marker:text-[#0F5C4D]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 my-2.5 space-y-1.5 marker:text-[#0F5C4D] marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1 leading-relaxed text-[#14211F]">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0F5C4D] font-semibold underline underline-offset-2 hover:text-[#0A4237] transition-colors"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-[#14211F] mt-3 mb-1.5">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-[#14211F] mt-2.5 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-[#14211F] mt-2 mb-1">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#0F5C4D] pl-3 my-2 text-[#5E6E6A] italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-[#E3F1ED] text-[#0F5C4D] px-1.5 py-0.5 rounded text-xs font-mono font-medium">
              {children}
            </code>
          ),
          hr: () => <hr className="my-3 border-t border-[#E4E8E5]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

