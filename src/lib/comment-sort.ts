import type { Comment } from './types/item';

export type CommentSort = 'default' | 'newest' | 'oldest' | 'replies';

export const SORT_LABELS: Record<CommentSort, string> = {
    default: 'default',
    newest: 'newest',
    oldest: 'oldest',
    // The HN API has no comment scores, so popularity is ranked by reply count.
    replies: 'popular'
};

export function sortComments(comments: Comment[], sort: CommentSort) {
    const sorted = [...comments];

    if (sort === 'newest') sorted.sort((a, b) => b.time - a.time);
    if (sort === 'oldest') sorted.sort((a, b) => a.time - b.time);
    if (sort === 'replies') sorted.sort((a, b) => (b.kids?.length ?? 0) - (a.kids?.length ?? 0));

    // 'default' keeps Hacker News's own ranking, which is the order of the parent's kids.
    return sorted;
}
