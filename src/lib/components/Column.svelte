<script lang="ts">
    export let index: number;
</script>

<div
    class="shrink-0 w-[400px] max-w-[90vw] overflow-y-scroll overflow-x-hidden scrollbar-none"
    class:bg-blue-50={index % 2 === 0}
    class:bg-white={index % 2 === 1}
>
    <slot/>
</div>