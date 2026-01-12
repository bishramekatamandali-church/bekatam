
import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, blogpost, blogpost_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

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
if (handleDatabaseFallback(req, res, error)) {
            return;
        }
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
        videoUrl, 
        audioUrl 
    } = req.body;

    const id = crypto.randomUUID();              // ✅ generate missing id
    const linkPath = `/blog/${id}`;              // ✅ generate missing linkPath
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
    const normalizedCategory = normalizeEnumValue(category, blogpost_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid blog category.' });
    }

    try {
        const newPost = await prisma.blogpost.create({
            data: {
                id,
                title,
                description,
                linkPath,                          // ✅ required by Prisma
                updatedAt: new Date(),
                date: postDate,
                category: normalizedCategory,
                imageUrl,
                videoUrl,
                audioUrl,
                mediaUrls,
                location,
                },
        });

    publishContentUpdate({ type: 'blogPost', action: 'created', id: newPost.id, timestamp: new Date().toISOString() });  
        res.status(201).json(shapeBlogPostForFrontend(newPost));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

// PUT (update) a blog post
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, imageUrl, mediaUrls, location, videoUrl, audioUrl } = req.body;
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : undefined;
    const normalizedCategory = normalizeEnumValue(category, blogpost_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid blog category.' });
    }

    try {
        const updatedPost = await prisma.blogpost.update({
            where: { id },
            data: {
                title,
                description,
                date: postDate,
                category: normalizedCategory,
                imageUrl,
                videoUrl,
                audioUrl,
                mediaUrls: mediaUrls || undefined,
                location,
                updatedAt: new Date(),
            }
        });
    publishContentUpdate({ type: 'blogPost', action: 'updated', id: updatedPost.id, timestamp: new Date().toISOString() });
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
    publishContentUpdate({ type: 'blogPost', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});

export default router;
