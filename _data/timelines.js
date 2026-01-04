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
        console.log('\x1b[36m%s\x1b[0m', '[Timelines]', ...args);
    }
}

async function getTimelines() {
    debug('Fetching timelines from CMS...');
    debug('Using endpoint:', path);

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
                    timelines(first: 100) {
                        id
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
                        hero {
                            image {
                                mimeType
                                url
                                height
                                width
                                caption
                            }
                            linkButton {
                                title
                                url
                                destination {
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
                            text {
                                textmd
                            }
                        }
                        timelineEvents {
                            bgColor {
                                hex
                            }
                            year
                            text
                            imageLayout
                            image {
                                images(first: 50) {
                                    mimeType
                                    url
                                    height
                                    width
                                    caption
                                    mimeType
                                }
                            }
                        }
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

        debug('Timelines retrieved successfully');

        const timelines = response.data.timelines

        // console.log(JSON.stringify(timelines, null, 4))

        return timelines;

    } catch (error) {
        debug('Error occurred:', error.message);
        return error.message;
    }
}

// Development mode: Add timestamp for cache busting
const getData = isDevelopment ?
    async () => {
        const data = await getTimelines();
        data._timestamp = new Date().toISOString();
        return data;
    } :
    getTimelines;

export default getData;
