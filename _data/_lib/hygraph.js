// _data/_lib/hygraph.js
// Shared Hygraph (GraphQL) fetch helper for all _data/*.js files.
// Handles env-var loading, POST, TTL caching, error handling and debug logging.

import * as dotenv from 'dotenv';
import EleventyFetch from '@11ty/eleventy-fetch';

dotenv.config();

const token = process.env.GRAPH_TOKEN;
const path = process.env.GRAPH_PATH;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Cache duration. Defaults: 1h in dev (fast rebuilds after first hit),
// always-fresh in production. Override with GRAPH_CACHE_DURATION (e.g. "0s", "5m", "1d").
const cacheDuration =
    process.env.GRAPH_CACHE_DURATION || (isDevelopment ? '1h' : '0s');

export const rootURL = process.env.ROOT_URL;

// Reusable GraphQL snippets shared across queries.
// `dest` — the LinkButton destination union (includes __typename).
// `seoImage` — the SEO block (templates render `jmd`; mimeType/height/width retained).
export const dest = `destination { __typename ... on Event { eventTitle:title } ... on Page { pageTitle:title } ... on Timeline { timelineTitle:title } }`;
export const seoImage = `seo { title description image { jmd: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: jpg}}}) mimeType height width } }`;

// Cyan debug logger, dev-only. Exported so data files can add context lines.
export function debug(label, ...args) {
    if (isDevelopment) {
        console.log('\x1b[36m%s\x1b[0m', `[${label}]`, ...args);
    }
}

/**
 * Run a GraphQL query against Hygraph with TTL caching via @11ty/eleventy-fetch.
 * @param {string} query  GraphQL query string.
 * @param {string} label  Human-readable label for debug logs (e.g. "Events").
 * @returns {Promise<object>} The `data` object from the GraphQL response.
 * @throws if the request fails or the API returns `errors`.
 */
export async function fetchHygraph(query, label) {
    debug(label, 'Fetching from CMS...');
    debug(label, 'Using endpoint:', path);

    const startTime = Date.now();

    // EleventyFetch caches keyed on URL + fetchOptions body, so each distinct
    // query gets its own cache entry. duration:'0s' disables caching.
    const response = await EleventyFetch(path, {
        type: 'json',
        duration: cacheDuration,
        fetchOptions: {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ query })
        }
    });

    debug(label, `Fetch completed in ${Date.now() - startTime}ms`);

    if (response.errors) {
        debug(label, 'CMS Errors:', response.errors);
        throw new Error(`Error fetching ${label} data`);
    }

    return response.data;
}
