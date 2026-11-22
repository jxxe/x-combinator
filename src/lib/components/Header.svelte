<script lang="ts">
    import { SORT_LABELS, type CommentSort } from '$lib/comment-sort';
    import { tick } from 'svelte';

    export let query = '';
    export let sort: CommentSort;
    export let showSort = false;

    let input: HTMLInputElement;
    let searchOpen = false;

    // Search stays open while it has a query, even after it loses focus.
    $: searchExpanded = searchOpen || query !== '';

    async function openSearch() {
        searchOpen = true;
        await tick();
        input.focus();
    }
</script>

<div class="bg-blue-500 p-1 text-white flex gap-2 items-center justify-between leading-none sticky top-0 z-10">
    <a href="/" class="flex gap-2 items-center shrink-0">
        <img class="w-5 h-5 border border-white" src="/assets/icon.svg" alt="">
        <p class="font-bold">Horizontal News</p>
    </a>

    <div class="flex gap-1 items-center min-w-0">
        {#if showSort}
            <!-- The invisible select covers the icon, so a click opens its native menu -->
            <label class="relative shrink-0 h-5 flex items-center justify-center gap-1 bg-white/20 {sort === 'default' ? 'w-5' : 'px-1.5'}" title="Sort comments: {SORT_LABELS[sort]}">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 13V3M2 6l3-3 3 3M11 3v10M8 10l3 3 3-3"/>
                </svg>
                {#if sort !== 'default'}
                    <span class="text-xs">{SORT_LABELS[sort]}</span>
                {/if}
                <select aria-label="Sort comments" bind:value={sort} class="absolute inset-0 opacity-0 cursor-pointer">
                    <optgroup label="Comment sort">
                        {#each Object.entries(SORT_LABELS) as [value, label]}
                            <option {value}>{label}</option>
                        {/each}
                    </optgroup>
                </select>
            </label>
        {/if}

        {#if searchExpanded}
            <label class="relative w-40 min-w-0">
                <input
                    type="search"
                    placeholder="Search"
                    aria-label="Search Hacker News"
                    bind:this={input}
                    bind:value={query}
                    on:keydown={(event) => {
                        if (event.key === 'Escape') {
                            query = '';
                            input.blur();
                        }
                    }}
                    on:blur={() => searchOpen = false}
                    class="peer h-5 w-full pl-1.5 pr-5 text-xs text-white bg-white/20 placeholder:text-white/70 outline-none focus:bg-white focus:text-black focus:placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
                >
                {#if query}
                    <button
                        type="button"
                        aria-label="Clear search"
                        on:click={() => { query = ''; searchOpen = true; input.focus(); }}
                        class="absolute right-0 top-0 h-5 w-5 flex items-center justify-center text-white/70 hover:text-white peer-focus:text-gray-400 peer-focus:hover:text-black"
                    >
                        <svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                            <path d="M3 3l10 10M13 3 3 13"/>
                        </svg>
                    </button>
                {:else}
                    <!-- Same size and spot as the collapsed search icon, so it does not jump when search opens -->
                    <svg class="absolute right-[3px] top-[3px] w-3.5 h-3.5 text-white/70 peer-focus:text-gray-400 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="6.5" cy="6.5" r="5"/>
                        <path d="M10.5 10.5 15 15" stroke-linecap="round"/>
                    </svg>
                {/if}
            </label>
        {:else}
            <button type="button" aria-label="Search Hacker News" on:click={openSearch} class="shrink-0 w-5 h-5 flex items-center justify-center bg-white/20">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5"/>
                    <path d="M10.5 10.5 15 15" stroke-linecap="round"/>
                </svg>
            </button>
        {/if}
    </div>
</div>
