import { useEffect, useState } from 'react';
import newsSource from '../../docs/news.md?raw';
import { getNewsReadState, markNewsSeen } from '../store/news-read-state';

const NEWS_SEEN_EVENT = 'arb-news-seen';

export function useNewsUnread(): boolean {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setHasUnread(getNewsReadState(newsSource).hasUnread);
    };

    refresh();
    window.addEventListener(NEWS_SEEN_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(NEWS_SEEN_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return hasUnread;
}

export function markCurrentNewsSeen(): void {
  markNewsSeen(newsSource);
  window.dispatchEvent(new Event(NEWS_SEEN_EVENT));
}
