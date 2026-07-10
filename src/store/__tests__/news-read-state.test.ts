import { beforeEach, describe, expect, it } from 'vitest';
import {
  extractLatestNewsSection,
  getLatestNewsSignature,
  getNewsReadState,
  markNewsSeen,
} from '../news-read-state';
import { STORAGE_KEYS } from '../storage-keys';

describe('news read state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('extracts the first h2 section as the latest news entry', () => {
    const source = [
      '# News',
      '',
      'Intro copy.',
      '',
      '## v2',
      '',
      '- New public feature.',
      '',
      '## v1',
      '',
      '- Older public feature.',
    ].join('\n');

    expect(extractLatestNewsSection(source)).toBe(
      ['## v2', '', '- New public feature.'].join('\n'),
    );
  });

  it('ignores older sections when computing the latest signature', () => {
    const first = ['# News', '', '## v2', '', '- New public feature.'].join('\n');
    const withOlder = [
      first,
      '',
      '## v1',
      '',
      '- Older public feature.',
    ].join('\n');

    expect(getLatestNewsSignature(withOlder)).toBe(
      getLatestNewsSignature(first),
    );
  });

  it('returns no unread state when there is no published section', () => {
    expect(getLatestNewsSignature('# News\n\nNo entries yet.')).toBeNull();
    expect(getNewsReadState('# News\n\nNo entries yet.')).toEqual({
      latestSignature: null,
      hasUnread: false,
    });
    expect(localStorage.getItem(STORAGE_KEYS.newsLastSeen)).toBeNull();
  });

  it('initializes missing read state without showing unread news', () => {
    const source = '# News\n\n## v1\n\n- First public update.';
    const state = getNewsReadState(source);

    expect(state.hasUnread).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.newsLastSeen)).toBe(
      state.latestSignature,
    );
  });

  it('shows unread news when the latest signature changes', () => {
    const oldSource = '# News\n\n## v1\n\n- First public update.';
    const newSource = '# News\n\n## v2\n\n- Second public update.';
    markNewsSeen(oldSource);

    expect(getNewsReadState(newSource)).toMatchObject({ hasUnread: true });
  });

  it('stores the latest signature when news is marked as seen', () => {
    const source = '# News\n\n## v2\n\n- Second public update.';

    markNewsSeen(source);

    expect(getNewsReadState(source)).toMatchObject({ hasUnread: false });
  });
});
