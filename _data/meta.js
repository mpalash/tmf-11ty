// _data/meta.js
import { fetchHygraph, debug, rootURL, dest, seoImage } from './_lib/hygraph.js';

const query = `{
    metas(first: 5, where: {id: "cmhuevoj4aigk07pbnc7bx1ls"}) {
        title
        ${seoImage}
        siteUrl
        emails
        addresses
        headerLogo { url height width caption }
        headerNavLinks(first: 25) { title url ${dest} }
        footerLogo { url height width caption }
        footerNavLinks(first: 25) { title url ${dest} }
        socialMediaLinks(first: 25) { title url }
        homepage { id }
        banner
        copyrightNotice
        subscribeFormText
    }
}`;

export default async function getMeta() {
    try {
        const data = await fetchHygraph(query, 'Meta Data');
        const meta = data.metas[0];
        if (!meta) throw new Error('No meta data returned');

        if (rootURL) {
            debug('Meta Data', 'Overriding siteUrl with rootURL:', rootURL);
            meta.siteUrl = rootURL;
        }
        meta.language = 'en';
        meta.url = '';

        debug('Meta Data', 'Site Name:', meta.seo.title);
        debug('Meta Data', 'Site URL:', meta.siteUrl);
        Object.entries(meta).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                debug('Meta Data', `Warning: ${key} is empty or missing`);
            }
        });

        return meta;
    } catch (error) {
        debug('Meta Data', 'Error occurred, returning fallback:', error.message);
        return {
            title: 'Tyeb Mehta Foundation',
            description: 'Established in 2013, the Foundation endeavours to expand the legacy of Tyeb Mehta by fostering a deeper understanding of his practice and broadening the ongoing discourse on Indian Modern and Contemporary art.',
            siteUrl: rootURL || 'http://localhost:8080',
            language: 'en',
            url: ''
        };
    }
}
