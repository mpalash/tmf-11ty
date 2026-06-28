// _data/timelines.js
import { fetchHygraph, debug, seoImage } from './_lib/hygraph.js';

// Note: timeline hero `destination` intentionally omits __typename (matches the
// original query) — linkButton resolution stays dormant for timeline heroes.
const query = `{
    timelines(first: 25) {
        id
        title
        ${seoImage}
        hero {
            image { url caption mimeType height width }
            linkButton { title url destination { ... on Event { eventTitle:title } ... on Page { pageTitle:title } ... on Timeline { timelineTitle:title } } }
            text { textmd }
        }
        timelineEvents(first: 100) {
            bgColor { hex }
            sectionMarker
            year
            text
            imageLayout
            image { images(first: 50) { url caption width height mimeType } }
        }
    }
}`;

export default async function getTimelines() {
    try {
        const data = await fetchHygraph(query, 'Timelines');
        debug('Timelines', 'Timelines retrieved successfully');
        return data.timelines;
    } catch (error) {
        debug('Timelines', 'Error occurred:', error.message);
        return error.message;
    }
}
