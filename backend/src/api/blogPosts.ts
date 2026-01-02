
import express from 'express';
import { prisma } from '../db';
import { Prisma, blogpost } from '@prisma/client';

const router = express.Router();

const shapeBlogPostForFrontend = (post: blogpost): any => ({
    ...post,
    comments: [], // Comments handled separately
    linkPath: `/blog/${post.id}`,
    date: post.date ? new Date(post.date).toISOString() : null,
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    likes: post.likes || 0,
    mediaUrls: post.mediaUrls || [],
});

// GET all blog posts
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.blogpost.findMany({
            orderBy: { date: 'desc' },
        });
        res.json(posts.map(shapeBlogPostForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blog posts" });
    }
});

// POST a new blog post
router.post('/', async (req, res) => {
    const { 
        title, 
        description, 
        date, 
        category, 
        imageUrl, 
        mediaUrls, 
        location, 
        taggedFriends, 
        feelingActivity, 
        backgroundTheme, 
        videoUrl, 
        audioUrl 
    } = req.body;

    const id = crypto.randomUUID();              // ✅ generate missing id
    const linkPath = `/blog/${id}`;              // ✅ generate missing linkPath
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();

    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';

    try {
        const newPost = await prisma.blogpost.create({
            data: {
                id,
                title,
                description,
                linkPath,                          // ✅ required by Prisma
                updatedAt: new Date(),
                date: postDate,
                category,
                imageUrl,
                videoUrl,
                audioUrl,
                mediaUrls,
                location,
                taggedFriends,
                feelingActivity,
                backgroundTheme,
                postedByOwnerId,
                postedByOwnerName,
            },
        });

        res.status(201).json(shapeBlogPostForFrontend(newPost));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

// PUT (update) a blog post
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, imageUrl, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, videoUrl, audioUrl } = req.body;
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : undefined;
    
    try {
        const updatedPost = await prisma.blogpost.update({
            where: { id },
            data: {
                title,
                description,
                date: postDate,
                category,
                imageUrl,
                videoUrl,
                audioUrl,
                mediaUrls: mediaUrls || undefined,
                location,
                taggedFriends,
                feelingActivity,
                backgroundTheme,
                updatedAt: new Date(),
            }
        });
        res.json(shapeBlogPostForFrontend(updatedPost));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.status(500).json({ error: 'Failed to update blog post' });
    }
});

// DELETE a blog post
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.blogpost.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});

export default router;
