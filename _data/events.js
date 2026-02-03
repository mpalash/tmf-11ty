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
                        dates {
                            dateFrom
                            dateTo
                            dateTimeDisplay
                        }
                        hero {
                            image {
                                mimeType
                                url
                                height
                                width
                                caption
                            }
                            text {
                                textmd
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
                        }
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
                        details(first: 20) {
                            dates {
                                dateFrom
                                dateTo
                                dateTimeDisplay
                            }
                            eventName
                            eventType
                            eventDescription
                            venueName
                            venueAddress
                            googleMapsUrl
                            gallery {
                                videos
                                images(first: 100) {
                                    mimeType
                                    url
                                    height
                                    width
                                    caption
                                }
                                notes
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

        const sortedEvents = sortEventsByDateOnly(events)

        return sortedEvents;

    } catch (error) {
        debug('Error occurred:', error.message);
        return error.message;
    }
}

function sortEventsByDateOnly(events) {
    if (!Array.isArray(events) || events.length === 0) {
        debug('Warning: No events to sort');
        return events;
    }
    
    return events.sort((a, b) => {
        // Get dates - check both possible locations
        const aDates = a.dates || (a.details && a.details[0] && a.details[0].dates);
        const bDates = b.dates || (b.details && b.details[0] && b.details[0].dates);
        
        const aDateFrom = aDates?.dateFrom;
        const bDateFrom = bDates?.dateFrom;
        
        // Handle events without dates
        if (!aDateFrom && !bDateFrom) return 0;
        if (!aDateFrom) return 1;  // Events without dates go to end
        if (!bDateFrom) return -1;
        
        // Convert to Date objects for comparison
        const aDate = new Date(aDateFrom);
        const bDate = new Date(bDateFrom);
        
        // Check for invalid dates
        if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
        if (isNaN(aDate.getTime())) return 1;
        if (isNaN(bDate.getTime())) return -1;
        
        // Latest to earliest (descending)
        return bDate - aDate;
    });
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
