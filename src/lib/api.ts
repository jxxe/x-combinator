import { browser } from '$app/environment';
import type { Comment, Item, Story } from './types/item';

const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0/';
// Keep these session caches in the browser, not across server-rendered requests.
const itemRequests = new Map<number, Promise<Item>>();
const commentRequests = new Map<number, Promise<Comment[]>>();

async function GET<T>(path: string): Promise<T> {
    const request = await fetch(API_BASE_URL + path);
    return await request.json();
}

function fetchItem<T extends Item>(itemId: number) {
    let request = itemRequests.get(itemId);
    if (!request) {
        request = GET<Item>(`item/${itemId}.json`).catch(error => {
            itemRequests.delete(itemId);
            throw error;
        });
        if (browser) itemRequests.set(itemId, request);
    }
    return request as Promise<T>;
}

export async function fetchStory(storyId: number) {
    return await fetchItem<Story>(storyId);
}

export async function fetchComment(commentId: number) {
    return await fetchItem<Comment>(commentId);
}

export async function fetchFrontPage(day: string) {
    const request = await fetch(`/front-page?day=${day}`);
    if (!request.ok) throw new Error('Unable to load stories');
    const stories = await request.json() as Story[];
    for (const story of stories) {
        if (!itemRequests.has(story.id)) itemRequests.set(story.id, Promise.resolve(story));
    }
    return stories;
}

export function fetchComments(item: Item) {
    let request = commentRequests.get(item.id);
    if (!request) {
        request = Promise.all((item.kids ?? []).map(fetchComment))
            .then(comments => comments.filter(c => !c.deleted))
            .catch(error => {
                commentRequests.delete(item.id);
                throw error;
            });
        if (browser) commentRequests.set(item.id, request);
    }
    return request;
}
