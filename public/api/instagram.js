// Instagram Feed API with 6-hour caching
// /api/instagram.js

const axios = require('axios');

// In-memory cache (resets when function cold starts)
const cache = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, count = 5 } = req.query;

    if (!username) {
        return res.status(400).json({
            success: false,
            error: 'Username parameter is required'
        });
    }

    const cacheKey = `${username}-${count}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Cache hit for ${username}`);
        // Set cache headers for browser/CDN
        res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
        return res.status(200).json({
            ...cached.data,
            cached: true,
            cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000 / 60) // minutes
        });
    }

    try {
        console.log(`Fetching fresh data for ${username}`);
        
        // Fetch Instagram profile
        const response = await axios.get(`https://www.instagram.com/${username}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 10000
        });

        const html = response.data;

        // Extract Instagram data
        const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/);
        
        if (!sharedDataMatch) {
            return res.status(404).json({
                success: false,
                error: 'Could not extract Instagram data. Account may be private.'
            });
        }

        const instagramData = JSON.parse(sharedDataMatch[1]);
        
        // Extract posts
        let posts = [];
        if (instagramData?.entry_data?.ProfilePage?.[0]?.graphql?.user) {
            const userData = instagramData.entry_data.ProfilePage[0].graphql.user;
            posts = userData.edge_owner_to_timeline_media.edges
                .slice(0, parseInt(count))
                .map(edge => ({
                    shortcode: edge.node.shortcode,
                    url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
                    thumbnail: edge.node.thumbnail_src,
                    imageUrl: edge.node.display_url,
                    caption: edge.node.edge_media_to_caption.edges[0]?.node.text || '',
                    likes: edge.node.edge_liked_by.count,
                    comments: edge.node.edge_media_to_comment.count,
                    timestamp: edge.node.taken_at_timestamp,
                    isVideo: edge.node.is_video
                }));
        }

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No posts found or account is private'
            });
        }

        const responseData = {
            success: true,
            username: username,
            posts: posts,
            cached: false
        };

        // Store in cache
        cache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        // Set cache headers (6 hours = 21600 seconds)
        res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
        
        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching Instagram data:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Instagram data',
            message: error.message
        });
    }
}
