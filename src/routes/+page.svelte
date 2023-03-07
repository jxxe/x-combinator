<script lang="ts">
    import { fetchComments, fetchTopStories } from '$lib/api';
    import Column from '$lib/components/Column.svelte';
    import CommentItem from '$lib/components/CommentItem.svelte';
    import Header from '$lib/components/Header.svelte';
    import StoryItem from '$lib/components/StoryItem.svelte';
    import type { Comment, Item, Story } from '$lib/types/item';
    import { onMount } from 'svelte';

    let topStories: Story[] = [];
    let commentColumns: Comment[][] = [];
    let selectedItems: Item[] = [];

    let loading = false;

    let commentsContainer: HTMLElement;

    onMount(async () => topStories = await fetchTopStories(30));

    async function loadComments(item: Item) {
        if(!item.kids) return;

        loading = true;
        const comments = await fetchComments(item);
        loading = false;

        commentColumns = [...commentColumns, comments];

        setTimeout(() => {
            commentsContainer.scrollTo({
                left: commentsContainer.scrollWidth,
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    async function selectStory(story: Story) {
        if(loading) return;

        selectedItems = [story];
        commentColumns = [];
        await loadComments(story);
    }

    async function selectComment(columnIndex: number, commentIndex: number) {
        if(loading) return;

        const item = commentColumns[columnIndex][commentIndex];
        if(!item.kids) return;

        selectedItems = selectedItems.slice(0, columnIndex + 1);
        selectedItems = [...selectedItems, item];

        const comments = await fetchComments(item);
        commentColumns = commentColumns.slice(0, columnIndex + 1);
        commentColumns = [...commentColumns, comments];

        setTimeout(() => {
            commentsContainer.scrollTo({
                left: commentsContainer.scrollWidth,
                top: 0,
                behavior: 'smooth'
            });
        });
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="flex h-[100dvh] overflow-y-hidden scrollbar-none" bind:this={commentsContainer}>
    <Column index={0}>
        <Header/>

        <div class="space-y-2 p-2">
            {#each topStories as story}
                <div on:click={() => selectStory(story)} class="cursor-pointer active:opacity-50">
                    <StoryItem {story} selected={selectedItems.includes(story)}/>
                </div>
            {:else}
                <p class="italic text-gray-500">Loading top stories...</p>
            {/each}
        </div>
    </Column>

    {#each commentColumns as comments, columnIndex}
        <Column index={columnIndex + 1}>
            <div class="divide-y divide-gray-300">
                {#each comments as comment, commentIndex}
                    <div
                        on:click={() => selectComment(columnIndex, commentIndex)}
                        class="p-4 border-r-2 {selectedItems.includes(comment) ? '!border-r-blue-500' : '!border-r-transparent'} {comment.kids && 'cursor-pointer active:opacity-50'}"
                    >
                        <CommentItem {comment}/>
                    </div>
                {/each}
            </div>
        </Column>
    {/each}
</div>