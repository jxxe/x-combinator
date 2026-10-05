<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    import { fetchFrontPage } from '$lib/api';
    import Column from '$lib/components/Column.svelte';
    import CommentItem from '$lib/components/CommentItem.svelte';
    import Header from '$lib/components/Header.svelte';
    import StoryItem from '$lib/components/StoryItem.svelte';
    import type { Story } from '$lib/types/item';
    import { onMount } from 'svelte';
    import { hnAge } from '$lib/time';
    import type { PageData } from './$types';

    export let data: PageData;

    let storyGroups: { day: string, stories: Story[] }[] = [];
    let loadingStories = false;
    let hasMoreStories = true;
    let nextStoryDay = new Date();
    let commentsContainer: HTMLElement;

    nextStoryDay.setUTCHours(0, 0, 0, 0);

    $: story = data.story;
    $: storyTime = story && new Date(story.time * 1000);

    function openSelectedStory(event: MouseEvent, clicked: Story) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (story?.id === clicked.id && clicked.url) {
            event.preventDefault();
            window.open(clicked.url, '_blank', 'noopener');
        }
    }

    function selectComment(path: number[], commentId: number) {
        goto('/' + [...path, commentId].join('/'), { replaceState: true, noScroll: true, keepFocus: true });
    }

    afterNavigate(() => {
        commentsContainer?.scrollTo({ left: commentsContainer.scrollWidth, top: 0, behavior: 'smooth' });
    });

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

    onMount(loadMoreStories);
</script>

<svelte:head>
    <title>{story?.title ?? 'Horizontal News'}</title>
</svelte:head>

<div class="flex h-[100dvh] overflow-y-hidden scrollbar-none" bind:this={commentsContainer}>
    <Column index={0} on:scroll={handleStoriesScroll}>
        <Header/>

        <div class="space-y-2 p-2 pb-4">
            {#each storyGroups as group, groupIndex}
                {#if groupIndex > 0}
                    <div class="flex items-center gap-2 pt-4 text-xs font-medium text-gray-500">
                        <time datetime={group.day}>{formatDay(group.day)}</time>
                        <div class="h-px grow bg-gray-300"></div>
                    </div>
                {/if}

                {#each group.stories as groupStory}
                    <a
                        href={`/${groupStory.id}`}
                        on:click={(event) => openSelectedStory(event, groupStory)}
                        aria-current={story?.id === groupStory.id ? 'page' : undefined}
                        class="block active:opacity-50 sm:active:!opacity-100"
                    >
                        <StoryItem story={groupStory} selected={story?.id === groupStory.id}/>
                    </a>
                {/each}
            {/each}

            {#if loadingStories}
                <p class="italic text-gray-500">Loading...</p>
            {/if}
        </div>
    </Column>

    {#if story}
        <Column index={1}>
            <div class="flex flex-col h-full">
                <div class="px-4 py-3 space-y-1 border-b border-gray-300">
                    <h1 class="leading-snug [text-wrap:pretty]">
                        {#if story.url}
                            <!-- The non-breaking space keeps the domain on the same line as the title's last word -->
                            <a href={story.url} target="_blank" rel="noopener" class="hover:underline">{story.title}</a>&nbsp;<span class="text-xs text-gray-500">({new URL(story.url).hostname.replace(/^www\./, '')})</span>
                        {:else}
                            {story.title}
                        {/if}
                    </h1>

                    <p class="text-xs text-gray-500">
                        {story.score} points by <a href={`https://news.ycombinator.com/user?id=${story.by}`} target="_blank" rel="noopener" class="hover:underline">{story.by}</a>
                        {#if storyTime}
                            <time datetime={storyTime.toISOString()} title={storyTime.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}>{hnAge(story.time)}</time>
                        {/if}
                        | <a href={`https://news.ycombinator.com/item?id=${story.id}`} target="_blank" rel="noopener" class="hover:underline">{story.descendants ?? 0} {story.descendants === 1 ? 'comment' : 'comments'}</a>
                    </p>
                </div>

                {#if story.url}
                    {#key story.url}
                        <iframe
                            src={`/embed-proxy?url=${encodeURIComponent(story.url)}`}
                            frameborder="0"
                            title="Embedded article"
                            class="w-full grow [zoom:90%]"
                            sandbox=""
                        ></iframe>
                    {/key}
                {:else if story.text}
                    <div class="prose p-4">{@html story.text}</div>
                {/if}
            </div>
        </Column>
    {/if}

    {#each data.columns as column, columnIndex (column.path.join('/'))}
        <Column index={columnIndex + (story ? 2 : 1)}>
            {#await column.comments}
                <p class="p-4 italic text-gray-500">Loading...</p>
            {:then comments}
                <div class="divide-y divide-gray-300">
                    {#each comments as comment}
                        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                        <div
                            role={comment.kids ? 'button' : undefined}
                            tabindex={comment.kids ? 0 : undefined}
                            on:click={(event) => {
                                if (comment.kids && !(event.target instanceof Element && event.target.closest('a'))) {
                                    selectComment(column.path, comment.id);
                                }
                            }}
                            on:keydown={(event) => {
                                if (comment.kids && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                                    event.preventDefault();
                                    selectComment(column.path, comment.id);
                                }
                            }}
                            class="p-4 border-r-2 {data.selectedIds.includes(comment.id) ? '!border-r-blue-500' : '!border-r-transparent'} {comment.kids && 'cursor-pointer active:opacity-50 sm:active:!opacity-100'}"
                        >
                            <CommentItem {comment}/>
                        </div>
                    {/each}
                </div>
            {:catch}
                <p class="p-4 italic text-gray-500">Unable to load comments.</p>
            {/await}
        </Column>
    {/each}
</div>
