// _data/pages.js
import { fetchHygraph, debug, dest, seoImage } from './_lib/hygraph.js';

const query = `{
    pages(first: 50) {
        id
        title
        ${seoImage}
        pageSections {
            layout
            bgColor { hex }
            content(first: 50) {
                __typename
                ... on Hero {
                    image { url caption mimeType height width }
                    linkButton { title url ${dest} }
                    text { textmd }
                }
                ... on Text { textmd }
                ... on Image { images(first: 50) { url caption mimeType height width } }
                ... on LinkButton { title url ${dest} }
            }
        }
    }
}`;

export default async function getPages() {
    try {
        const data = await fetchHygraph(query, 'Pages');
        debug('Pages', 'Pages retrieved successfully');
        return data.pages;
    } catch (error) {
        debug('Pages', 'Error occurred:', error.message);
        return error.message;
    }
}
