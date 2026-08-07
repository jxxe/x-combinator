import { e as error } from "../../../chunks/index.js";
async function GET({ url }) {
  const proxyUrlString = url.searchParams.get("url");
  if (proxyUrlString === null)
    throw error(400);
  const proxyUrl = new URL(proxyUrlString);
  try {
    const response = await fetch(proxyUrl);
    const body = `<base href="${proxyUrl.origin}"> ${await response.text()}`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/html"
      }
    });
  } catch {
    return Response.redirect(proxyUrl);
  }
}
export {
  GET
};
