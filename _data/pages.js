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
        console.log('\x1b[36m%s\x1b[0m', '[Pages]', ...args);
    }
}

async function getPages() {
    debug('Fetching pages from CMS...');
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
                    pages(first: 1000) {
                        id
                        title
                        seo {
                            title
                            description
                            image {
                                id
                                sm: url(transformation: {image: {resize: {width: 800}}, document: {output: {format: webp}}})
                                md: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: webp}}})
                                lg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: webp}}})
                                xlg: url(transformation: {image: {resize: {width: 2000}}, document: {output: {format: webp}}})
                                jsm: url(transformation: {image: {resize: {width: 800}}, document: {output: {format: jpg}}})
                                jmd: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: jpg}}})
                                jlg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: jpg}}})
                                jxlg: url(transformation: {image: {resize: {width: 2000}}, document: {output: {format: jpg}}})
                                mimeType
                                url
                                height
                                width
                                caption
                            }
                        }
                        hero {
                            id
                            image {
                                id
                                makeIntoGallery
                                image {
                                    id
                                    sm: url(transformation: {image: {resize: {width: 800}}, document: {output: {format: webp}}})
                                    md: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: webp}}})
                                    lg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: webp}}})
                                    xlg: url(transformation: {image: {resize: {width: 2000}}, document: {output: {format: webp}}})
                                    jsm: url(transformation: {image: {resize: {width: 800}}, document: {output: {format: jpg}}})
                                    jmd: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: jpg}}})
                                    jlg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: jpg}}})
                                    jxlg: url(transformation: {image: {resize: {width: 2000}}, document: {output: {format: jpg}}})
                                    mimeType
                                    url
                                    height
                                    width
                                    caption
                                }
                            }
                            link {
                                id
                                title
                                url
                                page {
                                    id
                                    title
                                }
                            }
                            text {
                                id
                                text
                            }
                        }
                        pageSections {
                            numColumns
                            columns {
                                content(first: 100) {
                                    ... on Subtitle {
                                        id
                                        subtitle
                                    }
                                    ... on Text {
                                        id
                                        text
                                    }
                                    ... on Image {
                                        id
                                        makeIntoGallery
                                        image(first: 1000) {
                                            id
                                            sm: url(transformation: {image: {resize: {width: 800}}, document: {output: {format: webp}}})
                                            md: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: webp}}})
                                            lg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: webp}}})
                                            xlg: url(transformation: {image: {resize: {width: 2000}}, document: {output: {format: webp}}})
                                            jsm: url(transformation: {image: {resize: {width: 800}}, document: {output: {format: jpg}}})
                                            jmd: url(transformation: {image: {resize: {width: 1200}}, document: {output: {format: jpg}}})
                                            jlg: url(transformation: {image: {resize: {width: 1600}}, document: {output: {format: jpg}}})
                                            jxlg: url(transformation: {image: {resize: {width: 2000}}, document: {output: {format: jpg}}})
                                            mimeType
                                            url
                                            height
                                            width
                                            caption
                                            mimeType
                                        }
                                    }
                                    ... on Link {
                                        id
                                        title
                                        url
                                        page {
                                            id
                                            title
                                        }
                                    }
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

        debug('Pages retrieved successfully');

        const pages = response.data.pages

        // console.log(JSON.stringify(pages, null, 4))

        return pages;

    } catch (error) {
        debug('Error occurred:', error.message);
        return error.message;
    }
}

// Development mode: Add timestamp for cache busting
const getData = isDevelopment ?
    async () => {
        const data = await getPages();
        data._timestamp = new Date().toISOString();
        return data;
    } :
    getPages;

export default getData;
