<script lang="ts">
    import type { Story } from '$lib/types/item';
    import ago from 's-ago';

    export let story: Story;
    export let selected = false;
</script>

<div>
    <h2 title={story.title} class="truncate {selected && 'font-bold text-blue-500'}">{story.title}</h2>

    <div class="text-xs text-gray-500 flex gap-2.5">
        <span>{story.score} points</span>
        <span>{ago(new Date(story.time * 1000))}</span>
        <span>{story.descendants} comments</span>
    </div>
</div>