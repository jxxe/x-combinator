export const prerender = false;
export const ssr = false;

export async function load({ params }) {
    const ids = params.ids
        ? params.ids.split('/').map(Number).filter(n => n > 0)
        : [];
    return { ids };
}
