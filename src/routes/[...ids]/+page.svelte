<script lang="ts">
    import { fetchComment, fetchComments, fetchFrontPage, fetchStory } from '$lib/api';
    import Column from '$lib/components/Column.svelte';
    import CommentItem from '$lib/components/CommentItem.svelte';
    import Header from '$lib/components/Header.svelte';
    import StoryItem from '$lib/components/StoryItem.svelte';
    import type { Comment, Item, Story } from '$lib/types/item';
    import { onMount, tick } from 'svelte';

    export let data: { ids: number[] };

    let storyGroups: { day: string, stories: Story[] }[] = [];
    let commentColumns: Comment[][] = [];
    let selectedItems: Item[] = [];
    let loadingStories = false;
    let hasMoreStories = true;
    let nextStoryDay = new Date();
    let commentsContainer: HTMLElement;
    let selectedStoryPosition: 'top' | 'bottom' | undefined;
    let restoreId = 0;

    nextStoryDay.setUTCHours(0, 0, 0, 0);

    $: selectedStory = selectedItems[0]?.type === 'story'
        ? selectedItems[0]
        : undefined;
    $: selectedStoryIsLoaded = selectedStory
        ? storyGroups.some(group => group.stories.some(story => story.id === selectedStory?.id))
        : false;
    $: embedUrl = selectedItems[0]?.type === 'story'
        ? selectedItems[0].url
        : undefined

    $: void restoreFromIds(data.ids);

    function shouldSelectOptimistically(event: MouseEvent) {
        return !event.defaultPrevented
            && event.button === 0
            && !event.metaKey
            && !event.ctrlKey
            && !event.shiftKey
            && !event.altKey;
    }

    function selectStory(event: MouseEvent, story: Story) {
        if (!shouldSelectOptimistically(event)) return;
        if (selectedItems.length === 1 && selectedItems[0].id === story.id) return;
        ++restoreId;
        selectedItems = [story];
        commentColumns = [];
    }

    function selectCommentFromClick(event: MouseEvent, columnIndex: number, comment: Comment) {
        if (!(event.target as HTMLElement).closest('a')) selectComment(columnIndex, comment);
    }

    async function selectComment(columnIndex: number, comment: Comment) {
        if (!comment.kids) return;
        const currentRestoreId = ++restoreId;
        selectedItems = [...selectedItems.slice(0, columnIndex + 1), comment];
        commentColumns = commentColumns.slice(0, columnIndex + 1);
        history.replaceState({ ...history.state }, '', '/' + selectedItems.map(item => item.id).join('/'));

        const comments = await fetchComments(comment);
        if (currentRestoreId !== restoreId) return;
        commentColumns = [...commentColumns, comments];

        await tick();
        commentsContainer?.scrollTo({ left: commentsContainer.scrollWidth, top: 0, behavior: 'smooth' });
    }

    async function restoreFromIds(ids: number[]) {
        const currentRestoreId = ++restoreId;

        if (ids.length === 0) {
            selectedItems = [];
            commentColumns = [];
            return;
        }

        // Round 1: fetch story and all selected comments in parallel
        const [story, ...pathComments] = await Promise.all([
            fetchStory(ids[0]),
            ...ids.slice(1).map(id => fetchComment(id))
        ]);

        if (currentRestoreId !== restoreId) return;
        if (!story) return;

        // Round 2: fetch all comment columns in parallel
        const allItems = [story, ...pathComments];
        const columns = await Promise.all(
            allItems.map(item => item?.kids ? fetchComments(item) : Promise.resolve([]))
        );

        if (currentRestoreId !== restoreId) return;

        // Build state, stopping at the first ID not found in its parent's column
        selectedItems = [story];
        commentColumns = [columns[0]];

        for (let i = 0; i < pathComments.length; i++) {
            const commentInColumn = columns[i].find(c => c.id === ids[i + 1]);
            if (!commentInColumn) break;
            selectedItems = [...selectedItems, commentInColumn];
            commentColumns = [...commentColumns, columns[i + 1]];
        }

        await tick();
        commentsContainer?.scrollTo({
            left: commentsContainer.scrollWidth,
            top: 0,
            behavior: 'smooth'
        });
    }

    async function loadMoreStories() {
        if (loadingStories || !hasMoreStories) return;

        loadingStories = true;
        try {
            const day = nextStoryDay.toISOString().slice(0, 10);
            const stories = await fetchFrontPage(day);
            storyGroups = [...storyGroups, { day, stories }];
            hasMoreStories = stories.length > 0;
            nextStoryDay.setUTCDate(nextStoryDay.getUTCDate() - 1);
        } finally {
            loadingStories = false;
        }
    }

    function formatDay(day: string) {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'long',
            timeZone: 'UTC'
        }).format(new Date(`${day}T00:00:00Z`));
    }

    function handleStoriesScroll(event: Event) {
        const column = event.currentTarget as HTMLElement;
        const distanceFromBottom = column.scrollHeight - column.scrollTop - column.clientHeight;

        if (distanceFromBottom < 400) loadMoreStories();
    }

    onMount(async () => {
        await loadMoreStories();
    });

    function trackStickyStory(marker: HTMLElement) {
        const column = marker.parentElement?.parentElement;
        let frame: number;

        function update() {
            const story = marker.nextElementSibling as HTMLElement | null;
            if (!column || !story) return;

            const columnRect = column.getBoundingClientRect();
            const normalTop = marker.getBoundingClientRect().top
                + parseFloat(getComputedStyle(story).marginTop);

            if (normalTop < columnRect.top + 28) {
                selectedStoryPosition = 'top';
            } else if (normalTop + story.offsetHeight > columnRect.bottom) {
                selectedStoryPosition = 'bottom';
            } else {
                selectedStoryPosition = undefined;
            }
        }

        function scheduleUpdate() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        }

        column?.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);
        scheduleUpdate();

        return {
            destroy() {
                cancelAnimationFrame(frame);
                column?.removeEventListener('scroll', scheduleUpdate);
                window.removeEventListener('resize', scheduleUpdate);
                selectedStoryPosition = undefined;
            }
        };
    }

</script>

<svelte:head>
    <title>
        {selectedItems[0]?.type === 'story' ? selectedItems[0].title : 'Horizontal News'}
    </title>
</svelte:head>

<div class="flex h-[100dvh] overflow-y-hidden scrollbar-none" bind:this={commentsContainer}>
    <Column index={0} on:scroll={handleStoriesScroll}>
        <Header/>

        <div class="pt-2">
            {#if selectedStory && storyGroups.length > 0 && !selectedStoryIsLoaded}
                <div class="h-0" use:trackStickyStory></div>
                <a
                    href={`/${selectedStory.id}`}
                    on:click={(event) => selectedStory && selectStory(event, selectedStory)}
                    aria-current="page"
                    class="sticky top-7 bottom-0 z-10 -mt-2 mb-2 block border-b border-gray-300 bg-blue-50 p-2 active:opacity-50 sm:active:!opacity-100"
                >
                    <StoryItem story={selectedStory} selected/>
                </a>
            {/if}

            {#each storyGroups as group, groupIndex}
                {#if groupIndex > 0}
                    <div class="flex items-center gap-2 px-2 pt-4 pb-2 text-xs font-medium text-gray-500">
                        <time datetime={group.day}>{formatDay(group.day)}</time>
                        <div class="h-px grow bg-gray-300"></div>
                    </div>
                {/if}

                {#each group.stories as story}
                    {#if selectedStory?.id === story.id}
                        <div class="h-0" use:trackStickyStory></div>
                    {/if}
                    <a
                        href={`/${story.id}`}
                        on:click={(event) => selectStory(event, story)}
                        aria-current={selectedItems[0]?.id === story.id ? 'page' : undefined}
                        class:sticky={selectedStory?.id === story.id}
                        class:top-7={selectedStory?.id === story.id}
                        class:bottom-0={selectedStory?.id === story.id}
                        class:z-10={selectedStory?.id === story.id}
                        class:bg-blue-50={selectedStory?.id === story.id}
                        class:border-t={selectedStory?.id === story.id && selectedStoryPosition === 'bottom'}
                        class:border-b={selectedStory?.id === story.id && selectedStoryPosition === 'top'}
                        class:border-gray-300={selectedStory?.id === story.id && !!selectedStoryPosition}
                        class="block px-2 pb-2 active:opacity-50 sm:active:!opacity-100 {selectedStory?.id === story.id ? 'pt-2 -mt-2' : ''}"
                    >
                        <StoryItem {story} selected={selectedItems[0]?.id === story.id}/>
                    </a>
                {/each}
            {/each}

            {#if loadingStories}
                <p class="px-2 py-4 italic text-gray-500">Loading...</p>
            {/if}
        </div>
    </Column>

    {#if embedUrl}
        <Column index={1}>
            {#key embedUrl}
                <iframe
                    src={`/embed-proxy?url=${encodeURIComponent(embedUrl)}`}
                    frameborder="0"
                    title="Embedded article"
                    class="w-full h-full [zoom:90%]"
                    sandbox=""
                ></iframe>
            {/key}
        </Column>
    {/if}

    {#each commentColumns as comments, columnIndex}
        <Column index={columnIndex + (embedUrl ? 2 : 1)}>
            <div class="divide-y divide-gray-300">
                {#each comments as comment}
                    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                    <div
                        role={comment.kids ? 'button' : undefined}
                        tabindex={comment.kids ? 0 : undefined}
                        on:click={(event) => selectCommentFromClick(event, columnIndex, comment)}
                        on:keydown={(event) => {
                            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                selectComment(columnIndex, comment);
                            }
                        }}
                        class="p-4 border-r-2 {selectedItems.some(item => item.id === comment.id) ? '!border-r-blue-500' : '!border-r-transparent'} {comment.kids && 'cursor-pointer active:opacity-50 sm:active:!opacity-100'}"
                    >
                        <CommentItem {comment}/>
                    </div>
                {/each}
            </div>
        </Column>
    {/each}
</div>
