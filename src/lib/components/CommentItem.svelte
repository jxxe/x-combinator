<script lang="ts">
    import type { Comment } from '$lib/types/item';
    import ago from 's-ago';

    export let comment: Comment;
</script>

<div class="space-y-1">
    <div class="text-xs flex justify-between">
        <div class="text-gray-500">
            <span>{comment.by}</span>
            <span>{ago(new Date(comment.time * 1000))}</span>
        </div>
        
        <p class:text-blue-500={comment.kids?.length}>
            {comment.kids?.length ?? 0} {(comment.kids?.length ?? 0) === 1 ? 'reply' : 'replies'}
        </p>
    </div>

    <p class="prose">{@html comment.text}</p>
</div>