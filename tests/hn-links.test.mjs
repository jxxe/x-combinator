import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const { horizontalNewsUrl } = await server.ssrLoadModule('/src/lib/hn-links.ts');
const { load } = await server.ssrLoadModule('/src/routes/[...ids]/+page.js');

test('rewrites only valid HN item URLs', () => {
    assert.equal(horizontalNewsUrl('https://news.ycombinator.com/item?id=49972730'), '/49972730');
    assert.equal(horizontalNewsUrl('http://news.ycombinator.com/item?foo=bar&id=123#comment'), '/123');
    for (const href of [
        'https://news.ycombinator.com/user?id=123',
        'https://news.ycombinator.com/item',
        'https://news.ycombinator.com/item?id=0',
        'https://news.ycombinator.com/item?id=12no',
        'https://news.ycombinator.com.evil.test/item?id=123',
        'https://example.com/item?id=123',
        'javascript:alert(1)',
        '/123'
    ]) assert.equal(horizontalNewsUrl(href), href);
});

const items = {
    10: { id: 10, type: 'story', title: 'Story', kids: [25] },
    25: { id: 25, type: 'comment', parent: 10, kids: [37] },
    37: { id: 37, type: 'comment', parent: 25 },
    48: { id: 48, type: 'comment', parent: 10 }
};

test('resolves a bare comment ID to its story and ordered ancestor path', async (t) => {
    t.mock.method(globalThis, 'fetch', async (url) => ({
        json: async () => items[Number(url.match(/item\/(\d+)\.json/)[1])]
    }));
    await assert.rejects(load({ params: { ids: '37' } }), (error) => {
        assert.equal(error.status, 307);
        assert.equal(error.location, '/10/25/37');
        return true;
    });
});

test('preserves valid column paths and truncates unrelated comments', async (t) => {
    t.mock.method(globalThis, 'fetch', async (url) => ({
        json: async () => items[Number(url.match(/item\/(\d+)\.json/)[1])]
    }));
    for (const [ids, expected] of [['10', [10]], ['10/25/37', [10, 25, 37]], ['10/25/48', [10, 25]]]) {
        const result = await load({ params: { ids } });
        assert.equal(result.story.id, 10);
        assert.deepEqual(result.selectedIds, expected);
        await Promise.all(result.columns.map(column => column.comments));
    }
});
