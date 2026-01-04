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
        console.log('\x1b[36m%s\x1b[0m', '[Events]', ...args);
    }
}

async function getEvents() {
    debug('Fetching events from CMS...');
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
                    events(first: 100) {
                        id
                        title
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
                            text {
                                textmd
                            }
                        }
                        dateFrom
                        dateTo
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

        debug('Events retrieved successfully');

        const events = response.data.events

        // console.log(JSON.stringify(events, null, 4))

        return events;

    } catch (error) {
        debug('Error occurred:', error.message);
        return error.message;
    }
}

// Development mode: Add timestamp for cache busting
const getData = isDevelopment ?
    async () => {
        const data = await getEvents();
        data._timestamp = new Date().toISOString();
        return data;
    } :
    getEvents;

export default getData;
