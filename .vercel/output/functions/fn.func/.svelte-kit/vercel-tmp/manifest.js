export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["assets/icon.svg","assets/logo.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {"start":"_app/immutable/entry/start.004a5734.js","app":"_app/immutable/entry/app.85a367a3.js","imports":["_app/immutable/entry/start.004a5734.js","_app/immutable/chunks/index.6469b430.js","_app/immutable/chunks/singletons.26712ab1.js","_app/immutable/entry/app.85a367a3.js","_app/immutable/chunks/index.6469b430.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('../output/server/nodes/0.js'),
			() => import('../output/server/nodes/1.js'),
			() => import('../output/server/nodes/2.js')
		],
		routes: [
			{
				id: "/embed-proxy",
				pattern: /^\/embed-proxy\/?$/,
				params: [],
				page: null,
				endpoint: () => import('../output/server/entries/endpoints/embed-proxy/_server.js')
			},
			{
				id: "/[...ids]",
				pattern: /^(?:\/(.*))?\/?$/,
				params: [{"name":"ids","optional":false,"rest":true,"chained":true}],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
