// _data/events.js
import { fetchHygraph, debug, dest, seoImage } from './_lib/hygraph.js';

const query = `{
    events(first: 50) {
        id
        title
        dates { dateFrom dateTo dateTimeDisplay }
        hero {
            image { url caption mimeType height width }
            text { textmd }
            linkButton { title url ${dest} }
        }
        ${seoImage}
        details(first: 20) {
            dates { dateFrom dateTo dateTimeDisplay }
            eventName
            eventType
            eventDescription
            venueName
            venueAddress
            googleMapsUrl
            gallery {
                videos
                images(first: 50) { url caption mimeType height width }
                notes
            }
        }
    }
}`;

function sortEventsByDateOnly(events) {
    if (!Array.isArray(events) || events.length === 0) {
        debug('Events', 'Warning: No events to sort');
        return events;
    }
    return events.sort((a, b) => {
        const aDateFrom = (a.dates || a.details?.[0]?.dates)?.dateFrom;
        const bDateFrom = (b.dates || b.details?.[0]?.dates)?.dateFrom;
        if (!aDateFrom && !bDateFrom) return 0;
        if (!aDateFrom) return 1;
        if (!bDateFrom) return -1;
        const aDate = new Date(aDateFrom);
        const bDate = new Date(bDateFrom);
        if (isNaN(aDate) && isNaN(bDate)) return 0;
        if (isNaN(aDate)) return 1;
        if (isNaN(bDate)) return -1;
        return bDate - aDate; // latest first
    });
}

export default async function getEvents() {
    try {
        const data = await fetchHygraph(query, 'Events');
        debug('Events', 'Events retrieved successfully');
        return sortEventsByDateOnly(data.events);
    } catch (error) {
        debug('Events', 'Error occurred:', error.message);
        return error.message;
    }
}
