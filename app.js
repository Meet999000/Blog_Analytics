const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3002; // Set your desired port

let blogData

// Middleware to fetch and analyze blog data
app.get('/api/blog-stats', async (req, res) => {
    try {
        const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
            headers: {
                'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
            },
        });

        blogData = response.data.blogs;
        // Perform data analysis using Lodash
        const totalBlogs = blogData.length;
        const longestBlog = _.maxBy(blogData, 'title.length');
        const blogsWithPrivacy = _.filter(blogData, (blog) =>
            _.includes(_.toLower(blog.title), 'privacy')
        );
        const uniqueTitles = _.uniqBy(blogData, 'title');
        const analyticsResult = {
            totalBlogs,
            longestBlog: longestBlog !== 'N/A' ? longestBlog.title : 'N/A',
            blogsWithPrivacy: blogsWithPrivacy.length,
            uniqueTitles,
        };

        res.json(analyticsResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching or analyzing blog data.' });
    }
});

// Blog search endpoint
app.get('/api/blog-search', (req, res) => {
    const query = req.query?.query?.toLowerCase();
    
    if (!query) {
        return res.status(400).json({ error: 'Please provide a valid query parameter.' });
    }

    const filteredBlogs = _.filter(blogData, (blog) => _.includes(_.toLower(blog.title), query));

    res.json(filteredBlogs);
});

const memoizedAnalytics = _.memoize(async () => {
    try {
        const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
            headers: {
                'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
            },
        });

        blogData = response.data.blogs;

        // Perform data analysis using Lodash
        const totalBlogs = blogData.length;
        const longestBlog = _.maxBy(blogData, 'title.length');
        const blogsWithPrivacy = _.filter(blogData, (blog) =>
            _.includes(_.toLower(blog.title), 'privacy')
        );
        const uniqueTitles = _.uniqBy(blogData, 'title');

        const analyticsResult = {
            totalBlogs,
            longestBlog: longestBlog.title,
            blogsWithPrivacy: blogsWithPrivacy.length,
            uniqueTitles,
        };

        return analyticsResult;
    } catch (error) {
        console.error(error);
        throw new Error('An error occurred while fetching or analyzing blog data.');
    }
});

// Middleware to fetch and return cached analytics results
app.get('/api/cached-blog-stats', async (req, res) => {
    try {
        const cachedResult = await memoizedAnalytics();
        res.json(cachedResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching or analyzing blog data.' });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
});

// Start the Express app
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
