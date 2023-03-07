export interface Item {
    by: string;
    id: number;
    kids?: number[];
    time: number;
    type: string;
    deleted?: true;
}

export interface Story extends Item {
    descendants: number;
    score: number;
    title: string;
    type: 'story';
    url?: string;
    text?: string;
}

export interface Comment extends Item {
    parent: number;
    text: string;
    type: 'comment';
}