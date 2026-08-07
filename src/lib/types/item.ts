export type Item = Story | Comment;

type CommonFields = {
    by: string,
    id: number,
    kids?: number[],
    time: number,
    type: string,
    deleted?: true
}

export type Story = CommonFields & {
    descendants: number;
    score: number;
    title: string;
    type: 'story';
    url?: string;
    text?: string;
}

export type Comment = CommonFields & {
    parent: number;
    text: string;
    type: 'comment';
}
