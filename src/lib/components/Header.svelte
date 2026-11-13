<script lang="ts">
    export let query = '';

    let input: HTMLInputElement;
</script>

<div class="bg-blue-500 p-1 text-white flex gap-4 items-center justify-between leading-none sticky top-0 z-10">
    <a href="/" class="flex gap-2 items-center shrink-0">
        <img class="w-5 h-5 border border-white" src="/assets/icon.svg" alt="">
        <p class="font-bold">Horizontal News</p>
    </a>

    <label class="relative w-40 min-w-0">
        <input
            type="search"
            placeholder="Search"
            aria-label="Search Hacker News"
            bind:this={input}
            bind:value={query}
            on:keydown={(event) => { if (event.key === 'Escape') query = ''; }}
            class="peer h-5 w-full pl-1.5 pr-5 text-xs text-white bg-white/20 placeholder:text-white/70 outline-none focus:bg-white focus:text-black focus:placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
        >
        {#if query}
            <button
                type="button"
                aria-label="Clear search"
                on:click={() => { query = ''; input.focus(); }}
                class="absolute right-0 top-0 h-5 w-5 flex items-center justify-center text-white/70 hover:text-white peer-focus:text-gray-400 peer-focus:hover:text-black"
            >
                <svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <path d="M3 3l10 10M13 3 3 13"/>
                </svg>
            </button>
        {:else}
            <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/70 peer-focus:text-gray-400 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="5"/>
                <path d="M10.5 10.5 15 15" stroke-linecap="round"/>
            </svg>
        {/if}
    </label>
</div>
