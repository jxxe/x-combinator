<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { fetchFrontPage } from '$lib/api';
    import Column from '$lib/components/Column.svelte';
    import CommentItem from '$lib/components/CommentItem.svelte';
    import Header from '$lib/components/Header.svelte';
    import StoryItem from '$lib/components/StoryItem.svelte';
    import type { Story } from '$lib/types/item';
    import { onMount } from 'svelte';
    import { hnAge } from '$lib/time';
    import { horizontalNewsUrl, rewriteHnLinks } from '$lib/hn-links';
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
    $: title = story?.title ?? 'Horizontal News';
    $: previewUrl = new URL($page.url.pathname, $page.url.origin).href;

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
    <title>{title}</title>
    <meta property="og:site_name" content="Horizontal News">
    <meta property="og:type" content={story ? 'article' : 'website'}>
    <meta property="og:title" content={title}>
    <meta property="og:url" content={previewUrl}>
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content={title}>
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
                        href={story?.id === groupStory.id ? '/' : `/${groupStory.id}`}
                        aria-current={story?.id === groupStory.id ? 'page' : undefined}
                        class="{story?.id === groupStory.id ? 'cursor-west' : 'cursor-east'} block active:opacity-50 sm:active:!opacity-100"
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
                            {@const domain = new URL(story.url).hostname.replace(/^www\./, '')}
                            <!-- The non-breaking space keeps the domain on the same line as the title's last word -->
                            <a href={horizontalNewsUrl(story.url)} target="_blank" rel="noopener" class="hover:underline">{story.title}</a>&nbsp;<a href={`https://news.ycombinator.com/from?site=${domain}`} target="_blank" rel="noopener" class="text-xs text-gray-500 hover:underline">({domain})</a>
                        {:else}
                            {story.title}
                        {/if}
                    </h1>

                    <p class="text-xs text-gray-500">
                        {story.score} points by <a href={`https://news.ycombinator.com/user?id=${story.by}`} target="_blank" rel="noopener" class="hover:underline">{story.by}</a>
                        {#if storyTime}
                            <time datetime={storyTime.toISOString()} title={storyTime.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}>{hnAge(story.time)}</time>
                        {/if}
                        | <a href={`/${story.id}`} target="_blank" rel="noopener" class="hover:underline">{story.descendants ?? 0} {story.descendants === 1 ? 'comment' : 'comments'}</a>
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
                    <div class="prose p-4" use:rewriteHnLinks={story.text}>{@html story.text}</div>
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
                        {@const selected = data.selectedIds.includes(comment.id)}
                        {@const canSelect = comment.kids && !selected}
                        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                        <div
                            role={canSelect ? 'button' : undefined}
                            tabindex={canSelect ? 0 : undefined}
                            on:click={(event) => {
                                if (canSelect && !(event.target instanceof Element && event.target.closest('a'))) {
                                    selectComment(column.path, comment.id);
                                }
                            }}
                            on:keydown={(event) => {
                                if (canSelect && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                                    event.preventDefault();
                                    selectComment(column.path, comment.id);
                                }
                            }}
                            class="p-4 border-r-2 {selected ? '!border-r-blue-500 cursor-text select-text' : '!border-r-transparent'} {canSelect && 'cursor-east active:opacity-50 sm:active:!opacity-100'}"
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

<style>
    .cursor-east {
        cursor: url('/resizeeast.svg') 23 16, e-resize;
    }

    .cursor-west {
        cursor: url('/resizewest.svg') 9 16, w-resize;
    }
</style>
