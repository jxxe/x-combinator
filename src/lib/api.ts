import type { Comment, Item, Story } from './types/item';

const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0/';
const itemRequests = new Map<number, Promise<Item>>();

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
        itemRequests.set(itemId, request);
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
    return await request.json() as Story[];
}

export async function fetchComments(item: Item) {
    const promises = item.kids!.map(fetchComment);
    const comments = await Promise.all(promises);
    return comments.filter(c => !c.deleted);
}
