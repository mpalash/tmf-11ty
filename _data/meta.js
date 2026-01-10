// _data/meta.js

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.GRAPH_TOKEN;
const path = process.env.GRAPH_PATH;
const rootURL = process.env.ROOT_URL;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Debug logging function
function debug(...args) {
    if (isDevelopment) {
        console.log('\x1b[36m%s\x1b[0m', '[Meta Data]', ...args);
    }
}

async function getMeta() {
    debug('Fetching meta data from CMS...');
    // debug('Using endpoint:', path);
    // debug('Using token:', token);
    try {
        const startTime = Date.now();

        const data = await fetch(path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `{
                    metas(first: 1000, where: {id: "cmhuevoj4aigk07pbnc7bx1ls"}) {
                        title
                        seo {
                            title
                            description
                            image {
                                jmd: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: jpg}}})
                                jlg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: jpg}}})
                                mimeType
                                url
                                height
                                width
                                caption
                            }
                        }
                        siteUrl
                        emails
                        addresses
                        headerLogo {
                            url
                            height
                            width
                            caption
                        }
                        headerNavLinks {
                            title
                            url
                            destination {
                                __typename
                                ... on Event {
                                    eventTitle:title
                                }
                                ... on Page {
                                    pageTitle:title
                                }
                                ... on Timeline {
                                    timelineTitle:title
                                }
                            }
                        }
                        footerLogo {
                            url
                            height
                            width
                            caption
                        }
                        footerNavLinks {
                            title
                            url
                            destination {
                                __typename
                                ... on Event {
                                    eventTitle:title
                                }
                                ... on Page {
                                    pageTitle:title
                                }
                                ... on Timeline {
                                    timelineTitle:title
                                }
                            }
                        }
                        socialMediaLinks {
                            title
                            url
                        }
                        homepage {
                            id
                        }
                        banner
                        copyrightNotice
                        subscribeFormText
                    }
                }`
            })
        });

        const response = await data.json();
        const fetchTime = Date.now() - startTime;
        debug(`Fetch completed in ${fetchTime}ms`);

        if (response.errors) {
            debug('CMS Errors:', response.errors);
            throw new Error("Error fetching meta data");
        }

        const meta = response.data.metas[0];

        if (!meta) {
            debug('No meta data found!');
            throw new Error("No meta data returned");
        }

        debug('Meta data retrieved successfully');
        debug('Site Name:', meta.seo.title);
        debug('Description:', meta.seo.description);
        debug('Site URL:', meta.siteUrl);

        if (rootURL) {
            debug('Overriding siteUrl with rootURL:', rootURL);
            meta.siteUrl = rootURL;
        }

        // Log empty or missing fields
        Object.entries(meta).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                debug(`Warning: ${key} is empty or missing`);
            }
        });

        return meta;

    } catch (error) {
        debug('Error occurred:', error.message);
        debug('Returning fallback data');

        const fallbackData = {
            title: "Tyeb Mehta Foundation",
            description: "Established in 2013, the Foundation endeavours to expand the legacy of Tyeb Mehta by fostering a deeper understanding of his practice and broadening the ongoing discourse on Indian Modern and Contemporary art.Established in 2013, the Foundation endeavours to expand the legacy of Tyeb Mehta by fostering a deeper understanding of his practice and broadening the ongoing discourse on Indian Modern and Contemporary art.",
            siteUrl: rootURL || "http://localhost:8080",
        };

        debug('Fallback data:', fallbackData);
        return fallbackData;
    }
}

// Development mode: Add timestamp for cache busting
const getData = isDevelopment ?
    async () => {
        const data = await getMeta();
        data._timestamp = new Date().toISOString();
        return data;
    } :
    getMeta;

export default getData;
