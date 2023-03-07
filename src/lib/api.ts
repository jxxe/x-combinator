import type { Comment, Item, Story } from './types/item';

const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0/';

async function GET<T>(path: string): Promise<T> {
    const request = await fetch(API_BASE_URL + path);
    return await request.json();
}

export async function fetchStory(storyId: number) {
    return await GET<Story>(`item/${storyId}.json`);
}

export async function fetchComment(commentId: number) {
    return await GET<Comment>(`item/${commentId}.json`);
}

export async function fetchTopStories(limit?: number) {
    let storyIds = await GET<number[]>('topstories.json');
    if(limit) storyIds = storyIds.slice(0, limit);
    const promises = storyIds.map(fetchStory);
    return await Promise.all(promises);
}

export async function fetchComments(item: Item) {
    const promises = item.kids!.map(fetchComment);
    const comments = await Promise.all(promises);
    return comments.filter(c => !c.deleted);
}