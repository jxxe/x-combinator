<script lang="ts">
    import { goto } from '$app/navigation';
    import { fetchLatestItem, refreshComments } from '$lib/api';
    import { SORT_LABELS, sortComments, type CommentSort } from '$lib/comment-sort';
    import type { Comment, Item } from '$lib/types/item';
    import { onMount } from 'svelte';
    import Column from './Column.svelte';
    import CommentItem from './CommentItem.svelte';

    const POLL_INTERVAL_MS = 30_000;

    export let index: number;
    export let column: { item: Item, path: number[], comments: Promise<Comment[]> };
    export let selectedIds: number[];
    let sort: CommentSort = 'default';

    let element: HTMLElement | undefined;

    // Load the column once. Later navigations within it pass the same cached comments again.
    let comments: Comment[] | undefined;
    let failed = false;
    column.comments.then(
        result => comments = result,
        () => failed = true
    );

    let knownKids = new Set(column.item.kids);
    let latestItem: Item | undefined;
    let showingNew = false;
    // Comments loaded by the last banner click, which flash yellow when they first render.
    let flashIds = new Set<number>();

    $: newCount = latestItem?.kids?.filter(id => !knownKids.has(id)).length ?? 0;
    $: sortedComments = comments && sortComments(comments, sort);

    async function checkForNewComments() {
        if (document.hidden || showingNew) return;

        try {
            latestItem = await fetchLatestItem(column.item.id);
        } catch {
            // Try again on the next poll.
        }
    }

    async function showNewComments() {
        if (!latestItem || showingNew) return;

        const item = latestItem;
        showingNew = true;
        try {
            comments = await refreshComments(item);
            flashIds = new Set(item.kids?.filter(id => !knownKids.has(id)));
            knownKids = new Set(item.kids);
            sort = 'newest';
            element?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            // Keep the banner so the user can try again.
        } finally {
            showingNew = false;
        }
    }

    function selectComment(commentId: number) {
        goto('/' + [...column.path, commentId].join('/'), { replaceState: true, noScroll: true, keepFocus: true });
    }

    onMount(() => {
        const interval = setInterval(checkForNewComments, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    });
</script>

<Column {index} bind:element>
    {#if failed}
        <p class="p-4 italic text-gray-500">Unable to load comments.</p>
    {:else if !sortedComments}
        <p class="p-4 italic text-gray-500">Loading...</p>
    {:else}
        <!-- Zero-height sticky row, so the button floats over the comments without taking space.
             It shows on hover (always on touch screens), and always once the column is not on the default sort. -->
        <div class="sticky top-0 z-20 h-0 flex justify-end">
            <!-- The invisible select covers the icon, so a click opens its native menu -->
            <!-- Over the new comments banner, which is also h-7, sit flush in its corner instead of overhanging it -->
            <label class="relative {newCount > 0 ? '' : 'mt-1 mr-1'} h-7 flex items-center justify-center gap-1 bg-white text-gray-500 hover:text-black {sort === 'default' ? 'w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100' : 'px-2'}">
                {#if sort !== 'default'}
                    <span class="text-xs leading-none">{SORT_LABELS[sort]}</span>
                {/if}
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 13V3M2 6l3-3 3 3M11 3v10M8 10l3 3 3-3"/>
                </svg>
                <select aria-label="Sort comments" bind:value={sort} class="absolute inset-0 opacity-0 cursor-pointer">
                    <optgroup label="Comment sort">
                        {#each Object.entries(SORT_LABELS) as [value, label]}
                            <option {value}>{label}</option>
                        {/each}
                    </optgroup>
                </select>
            </label>
        </div>

        {#if newCount > 0}
            <button
                type="button"
                on:click={showNewComments}
                disabled={showingNew}
                class="sticky top-0 z-10 w-full h-7 px-2 leading-none bg-blue-500 text-white disabled:opacity-75"
            >
                {showingNew ? 'Loading...' : `${newCount} new ${newCount === 1 ? 'comment' : 'comments'}`}
            </button>
        {/if}

        <div class="divide-y divide-gray-300">
            {#each sortedComments as comment (comment.id)}
                {@const selected = selectedIds.includes(comment.id)}
                {@const canSelect = comment.kids && !selected}
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <div
                    role={canSelect ? 'button' : undefined}
                    tabindex={canSelect ? 0 : undefined}
                    on:click={(event) => {
                        if (canSelect && !(event.target instanceof Element && event.target.closest('a'))) {
                            selectComment(comment.id);
                        }
                    }}
                    on:keydown={(event) => {
                        if (canSelect && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            selectComment(comment.id);
                        }
                    }}
                    class:yellow-fade={flashIds.has(comment.id)}
                    class="p-4 border-r-2 {selected ? '!border-r-blue-500 cursor-text select-text' : '!border-r-transparent'} {canSelect && 'cursor-east active:opacity-50 sm:active:!opacity-100'}"
                >
                    <CommentItem {comment}/>
                </div>
            {/each}
        </div>
    {/if}
</Column>

<style>
    /* The Yellow Fade Technique: https://signalvnoise.com/archives/000558 */
    .yellow-fade {
        animation: yellow-fade 2.5s ease-out;
    }

    @keyframes yellow-fade {
        0%, 20% { background-color: #fffbd1; }
        100% { background-color: transparent; }
    }

    .cursor-east {
        cursor: url('/resizeeast.svg') 23 16, e-resize;
    }
</style>
