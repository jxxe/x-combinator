import { error, json } from '@sveltejs/kit';

const STORY_LIMIT = 20;
const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0/';

/**
 * @param {typeof globalThis.fetch} fetch
 * @param {string} day
 * @param {Date} date
 * @returns {Promise<number[]>}
 */
async function fetchArchivedStoryIds(fetch, day, date) {
    const frontPage = await fetch(`https://news.ycombinator.com/front?day=${day}`);

    if (frontPage.ok) {
        const html = await frontPage.text();
        return [...html.matchAll(/<tr class="athing[^"]*" id="(\d+)"/g)]
            .slice(0, STORY_LIMIT)
            .map(match => Number(match[1]));
    }

    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const params = new URLSearchParams({
        tags: 'story',
        numericFilters: `created_at_i>=${date.getTime() / 1000},created_at_i<${nextDay.getTime() / 1000}`,
        hitsPerPage: String(STORY_LIMIT)
    });
    const response = await fetch(`https://hn.algolia.com/api/v1/search?${params}`);
    if (!response.ok) throw error(502, 'Unable to load archived Hacker News stories');

    /** @type {{ hits: { objectID: string }[] }} */
    const results = await response.json();
    return results.hits.map(hit => Number(hit.objectID));
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, fetch }) {
    const day = url.searchParams.get('day');
    const date = day && new Date(`${day}T00:00:00Z`);

    if (!day || !date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
        throw error(400, 'Invalid day');
    }

    const today = new Date().toISOString().slice(0, 10);
    let storyIds;

    if (day === today) {
        const frontPage = await fetch('https://news.ycombinator.com/news');
        if (!frontPage.ok) throw error(502, 'Unable to load the Hacker News front page');

        const html = await frontPage.text();
        storyIds = [...html.matchAll(/<tr class="athing[^"]*" id="(\d+)"/g)]
            .slice(0, STORY_LIMIT)
            .map(match => Number(match[1]));
    } else {
        storyIds = await fetchArchivedStoryIds(fetch, day, date);
    }

    const stories = await Promise.all(storyIds.map(async id => {
        const response = await fetch(`${API_BASE_URL}item/${id}.json`);
        if (!response.ok) throw error(502, 'Unable to load a Hacker News story');
        return response.json();
    }));

    return json(stories, {
        headers: {
            'Cache-Control': `public, max-age=${day === today ? 300 : 86400}`
        }
    });
}
