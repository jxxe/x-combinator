<script lang="ts">
    import { fetchComment, fetchComments, fetchStory, fetchTopStories } from '$lib/api';
    import Column from '$lib/components/Column.svelte';
    import CommentItem from '$lib/components/CommentItem.svelte';
    import Header from '$lib/components/Header.svelte';
    import StoryItem from '$lib/components/StoryItem.svelte';
    import type { Comment, Item, Story } from '$lib/types/item';
    import { onMount } from 'svelte';

    export let data: { ids: number[] };

    let topStories: Story[] = [];
    let commentColumns: Comment[][] = [];
    let selectedItems: Item[] = [];
    let loading = false;
    let commentsContainer: HTMLElement;

    $: embedUrl = selectedItems[0]?.type === 'story'
        ? selectedItems[0].url
        : undefined

    function updateURL() {
        const path = selectedItems.length
            ? '/' + selectedItems.map(i => i.id).join('/')
            : '/';
        history.replaceState(null, '', path);
    }

    async function restoreFromIds(ids: number[]) {
        if (ids.length === 0) return;

        // Round 1: fetch story and all selected comments in parallel
        const [story, ...pathComments] = await Promise.all([
            fetchStory(ids[0]),
            ...ids.slice(1).map(id => fetchComment(id))
        ]);

        if (!story) return;

        // Round 2: fetch all comment columns in parallel
        const allItems = [story, ...pathComments];
        const columns = await Promise.all(
            allItems.map(item => item?.kids ? fetchComments(item) : Promise.resolve([]))
        );

        // Build state, stopping at the first ID not found in its parent's column
        selectedItems = [story];
        commentColumns = [columns[0]];

        for (let i = 0; i < pathComments.length; i++) {
            const commentInColumn = columns[i].find(c => c.id === ids[i + 1]);
            if (!commentInColumn) break;
            selectedItems = [...selectedItems, commentInColumn];
            commentColumns = [...commentColumns, columns[i + 1]];
        }
    }

    onMount(async () => {
        loading = true;
        const storiesPromise = fetchTopStories(30);
        const restorePromise = restoreFromIds(data.ids);
        topStories = await storiesPromise;
        await restorePromise;
        loading = false;

        if (commentColumns.length > 0) {
            setTimeout(() => {
                commentsContainer.scrollTo({
                    left: commentsContainer.scrollWidth,
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    });

    async function loadComments(item: Item) {
        if (!item.kids) return;

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
        if (loading) return;

        selectedItems = [story];
        commentColumns = [];
        updateURL();
        await loadComments(story);
    }

    async function selectComment(columnIndex: number, commentIndex: number) {
        if (loading) return;

        const item = commentColumns[columnIndex][commentIndex];
        if (!item.kids) return;

        selectedItems = [...selectedItems.slice(0, columnIndex + 1), item];
        updateURL();

        const comments = await fetchComments(item);
        commentColumns = [...commentColumns.slice(0, columnIndex + 1), comments];

        setTimeout(() => {
            commentsContainer.scrollTo({
                left: commentsContainer.scrollWidth,
                top: 0,
                behavior: 'smooth'
            });
        });
    }
</script>

<svelte:head>
    <title>
        {selectedItems[0]?.type === 'story' ? selectedItems[0].title : 'Horizontal News'}
    </title>
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="flex h-[100dvh] overflow-y-hidden scrollbar-none" bind:this={commentsContainer}>
    <Column index={0}>
        <Header/>

        <div class="space-y-2 p-2">
            {#each topStories as story}
                <div on:click={() => {
                    if(selectedItems[0]?.id === story.id) {
                        window.open(story.url);
                    } else {
                        selectStory(story);
                    }
                }} class="cursor-pointer active:opacity-50 sm:active:!opacity-100">
                    <StoryItem {story} selected={selectedItems[0]?.id === story.id}/>
                </div>
            {:else}
                <p class="italic text-gray-500">Loading top stories...</p>
            {/each}
        </div>
    </Column>

    {#if embedUrl}
        <Column index={1}>
            {#key embedUrl}
                <iframe
                    src={`/embed-proxy?url=${encodeURIComponent(embedUrl)}`}
                    frameborder="0"
                    title="Embedded article"
                    class="w-full h-full [zoom:80%]"
                ></iframe>
            {/key}
        </Column>
    {/if}

    {#each commentColumns as comments, columnIndex}
        <Column index={columnIndex + (embedUrl ? 2 : 1)}>
            <div class="divide-y divide-gray-300">
                {#each comments as comment, commentIndex}
                    <div
                        on:click={() => selectComment(columnIndex, commentIndex)}
                        class="p-4 border-r-2 {selectedItems.some(item => item.id === comment.id) ? '!border-r-blue-500' : '!border-r-transparent'} {comment.kids && 'cursor-pointer active:opacity-50 sm:active:!opacity-100'}"
                    >
                        <CommentItem {comment}/>
                    </div>
                {/each}
            </div>
        </Column>
    {/each}
</div>
