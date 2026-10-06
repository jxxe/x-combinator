import { tick } from 'svelte';

export function horizontalNewsUrl(href: string): string {
    try {
        const url = new URL(href);
        const id = url.searchParams.get('id');
        if ((url.protocol === 'https:' || url.protocol === 'http:') &&
            url.hostname === 'news.ycombinator.com' && url.pathname === '/item' &&
            id && /^[1-9]\d*$/.test(id)) {
            return `/${id}`;
        }
    } catch {
        // Leave relative links and invalid URLs alone.
    }
    return href;
}

// Re-run after Svelte replaces the HTML when a story or comment changes.
export function rewriteHnLinks(node: HTMLElement, _html: string) {
    async function update() {
        await tick();
        for (const link of node.querySelectorAll<HTMLAnchorElement>('a[href]')) {
            const href = link.getAttribute('href')!;
            const rewritten = horizontalNewsUrl(href);
            if (rewritten !== href) {
                link.setAttribute('href', rewritten);
                link.target = '_blank';
                link.relList.add('noopener');
            }
        }
    }
    void update();
    return { update };
}
