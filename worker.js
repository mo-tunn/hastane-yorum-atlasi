'use strict';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store'
};

let manifestPromise;
const chunkCache = new Map();
const chunkLoads = new Map();
const MAX_CACHED_CHUNKS = 2;

async function getManifest(env) {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      const response = await env.ASSETS.fetch('https://assets.local/private-reviews/manifest.json');
      if (!response.ok) throw new Error('Review manifest unavailable');
      const manifest = await response.json();
      if (!Number.isInteger(manifest.count) || !Number.isInteger(manifest.chunkSize) || manifest.chunkSize < 1) {
        throw new Error('Invalid review manifest');
      }
      return manifest;
    })().catch(error => {
      manifestPromise = undefined;
      throw error;
    });
  }
  return manifestPromise;
}

async function getChunk(env, chunkName) {
  if (chunkCache.has(chunkName)) {
    const cached = chunkCache.get(chunkName);
    chunkCache.delete(chunkName);
    chunkCache.set(chunkName, cached);
    return cached;
  }
  if (chunkLoads.has(chunkName)) return chunkLoads.get(chunkName);

  const load = (async () => {
    const response = await env.ASSETS.fetch('https://assets.local/private-reviews/' + chunkName);
    if (!response.ok) throw new Error('Review chunk unavailable');
    const decompressed = response.body.pipeThrough(new DecompressionStream('gzip'));
    const texts = JSON.parse(await new Response(decompressed).text());
    if (!Array.isArray(texts)) throw new Error('Invalid review chunk');

    chunkCache.set(chunkName, texts);
    while (chunkCache.size > MAX_CACHED_CHUNKS) {
      chunkCache.delete(chunkCache.keys().next().value);
    }
    return texts;
  })();

  chunkLoads.set(chunkName, load);
  try {
    return await load;
  } finally {
    chunkLoads.delete(chunkName);
  }
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Private static review chunks are reachable only through this Worker binding.
    if (url.pathname === '/private-reviews' || url.pathname.startsWith('/private-reviews/')) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    if (url.pathname === '/api/review') {
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      const rawId = url.searchParams.get('id');
      if (rawId === null || !/^(0|[1-9]\d*)$/.test(rawId)) {
        return jsonError('Invalid review id', 400);
      }

      try {
        const manifest = await getManifest(env);
        const id = Number(rawId);
        if (!Number.isSafeInteger(id) || id < 0 || id >= manifest.count) {
          return jsonError('Review not found', 404);
        }

        const chunkIndex = Math.floor(id / manifest.chunkSize);
        const offset = id % manifest.chunkSize;
        const chunkName = 'chunk-' + String(chunkIndex).padStart(3, '0') + '.json.gz';
        const reviews = await getChunk(env, chunkName);
        if (typeof reviews[offset] !== 'string') return jsonError('Review not found', 404);

        return new Response(JSON.stringify({ id, review: reviews[offset] }), {
          status: 200,
          headers: JSON_HEADERS
        });
      } catch (error) {
        return jsonError('Review could not be loaded', 503);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
