import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const proxyUrlString = url.searchParams.get('url');
    if (proxyUrlString === null) throw error(400);

    const proxyUrl = new URL(proxyUrlString);

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error();

        const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
        const finalUrl = new URL(response.url || proxyUrl);
        const isPdf = contentType === 'application/pdf' ||
            ((!contentType || contentType === 'application/octet-stream') && /\.pdf$/i.test(finalUrl.pathname));

        if (isPdf) {
            return new Response(response.body, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'inline',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        const body = `<base href="${proxyUrl.origin}"> ${await response.text()}`;

        return new Response(body, {
            headers: {
                'Content-Type': 'text/html',
                // Sandbox web pages without disabling the browser's PDF viewer.
                'Content-Security-Policy': 'sandbox'
            }
        });
    } catch {
        return Response.redirect(proxyUrl);
    }
}
