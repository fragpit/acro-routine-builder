import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import newsSource from '../../docs/news.md?raw';
import { markCurrentNewsSeen } from '../hooks/useNewsUnread';

export default function NewsDocs() {
  useEffect(() => {
    markCurrentNewsSeen();
  }, []);

  return (
    <div className="h-full overflow-auto">
      <article className="max-w-3xl mx-auto px-4 lg:px-6 py-6 prose prose-lg prose-slate dark:prose-invert prose-headings:scroll-mt-4 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-code:text-sky-700 dark:prose-code:text-sky-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {newsSource}
        </ReactMarkdown>
      </article>
    </div>
  );
}
