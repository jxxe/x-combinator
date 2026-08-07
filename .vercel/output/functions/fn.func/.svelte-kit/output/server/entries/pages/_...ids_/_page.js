const prerender = false;
const ssr = false;
async function load({ params }) {
  const ids = params.ids ? params.ids.split("/").map(Number).filter((n) => n > 0) : [];
  return { ids };
}
export {
  load,
  prerender,
  ssr
};
