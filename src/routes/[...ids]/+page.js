import { fetchComment, fetchComments, fetchStory } from '$lib/api';

export const prerender = false;
export const ssr = false;

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const ids = params.ids
        ? params.ids.split('/').map(Number).filter(n => n > 0)
        : [];

    const [story, ...comments] = ids.length
        ? await Promise.all([fetchStory(ids[0]), ...ids.slice(1).map(fetchComment)])
        : [];

    if (!story) return { story: undefined, selectedIds: /** @type {number[]} */ ([]), columns: [] };

    // Keep the longest valid parent-to-child chain from the URL
    /** @type {import('$lib/types/item').Item[]} */
    const path = [story];
    for (const comment of comments) {
        if (comment?.parent !== path[path.length - 1].id) break;
        path.push(comment);
    }

    const selectedIds = path.map(item => item.id);

    return {
        story,
        selectedIds,
        // Nested promises are not awaited, so the columns stream in after navigation
        columns: path
            .map((item, index) => ({ path: selectedIds.slice(0, index + 1), comments: fetchComments(item) }))
            .filter((_, index) => path[index].kids?.length)
    };
}
