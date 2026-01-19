



















import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, blogpost, blogpost_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

const isMissingLocationColumnError = (error: unknown): boolean => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
        const message = typeof error.message === 'string' ? error.message : '';
        return message.includes('location');
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return error.message.includes('location');
    }
    return false;
};

const buildBlogPostSelect = (includeLocation: boolean) => ({
    id: true,
    title: true,
    description: true,
    imageUrl: true,
    linkPath: true,
    category: true,
    date: true,
    postedByAdminId: true,
    postedByAdminName: true,
    createdAt: true,
    updatedAt: true,
    likes: true,
    audioUrl: true,
    mediaUrls: true,
    ...(includeLocation ? { location: true } : {}),
    videoUrl: true,
    comment: true,
});

const shapeBlogPostForFrontend = (p: any): any => {
    const { comment, ...post } = p;
    const comments = Array.isArray(comment) ? comment.map((c: any) => ({
        id: c.id,
        itemId: post.id,
        itemType: 'blogPost',
        userId: c.userId ?? null,
        userName: c.userName,
        userProfileImageUrl: c.userProfileImageUrl ?? null,
        isGuest: c.isGuest ?? false,
        guestEmail: c.guestEmail ?? null,
        guestPhone: c.guestPhone ?? null,
        text: c.text,
        timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
        editedAt: c.editedAt ? new Date(c.editedAt).toISOString() : null,
    })) : [];
    comments.sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    return {
        ...post,
        comments,
        linkPath: `/blog/${post.id}`,
        date: post.date ? new Date(post.date).toISOString() : null,
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        likes: post.likes || 0,
        mediaUrls: post.mediaUrls || [],
    };
};

// GET all blog posts
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.blogpost.findMany({
            select: buildBlogPostSelect(true),
            orderBy: { date: 'desc' },
        });
        res.json(posts.map(shapeBlogPostForFrontend));
    } catch (error) {
        if (isMissingLocationColumnError(error)) {
            try {
                const posts = await prisma.blogpost.findMany({
                    select: buildBlogPostSelect(false),
                    orderBy: { date: 'desc' },
                });
                res.json(posts.map(shapeBlogPostForFrontend));
                return;
            } catch (fallbackError) {
                if (handleDatabaseFallback(req, res, fallbackError)) {
                    return;
                }
                console.error("Error fetching blog posts without location:", fallbackError);
                res.status(500).json({ error: "Failed to fetch blog posts" });
                return;
            }
        }
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
        audioUrl,
        postedByAdminId,
        postedByAdminName,
    } = req.body;

    const id = crypto.randomUUID();              // ✅ generate missing id
    const linkPath = `/blog/${id}`;              // ✅ generate missing linkPath
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
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
                postedByAdminId,
                postedByAdminName,
                },
        });

    publishContentUpdate({ type: 'blogPost', action: 'created', id: newPost.id, timestamp: new Date().toISOString() });  
        res.status(201).json(shapeBlogPostForFrontend(newPost));
    } catch (error) {
        if (isMissingLocationColumnError(error)) {
            try {
                const newPost = await prisma.blogpost.create({
                    data: {
                        id,
                        title,
                        description,
                        linkPath,
                        updatedAt: new Date(),
                        date: postDate,
                        category: normalizedCategory,
                        imageUrl,
                        videoUrl,
                        audioUrl,
                        mediaUrls,
                        postedByAdminId,
                        postedByAdminName,
                    },
                });
                publishContentUpdate({ type: 'blogPost', action: 'created', id: newPost.id, timestamp: new Date().toISOString() });
                res.status(201).json(shapeBlogPostForFrontend(newPost));
                return;
            } catch (fallbackError) {
                console.error("Error creating blog post without location:", fallbackError);
                if (fallbackError instanceof Prisma.PrismaClientKnownRequestError) {
                    return res.status(400).json({ error: 'Database error creating blog post.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to create blog post' });
                return;
            }
        }
        console.error(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating blog post.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

// PUT (update) a blog post
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, imageUrl, mediaUrls, location, videoUrl, audioUrl, postedByAdminId, postedByAdminName } = req.body;
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
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
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            }
        });
    publishContentUpdate({ type: 'blogPost', action: 'updated', id: updatedPost.id, timestamp: new Date().toISOString() });
        res.json(shapeBlogPostForFrontend(updatedPost));
    } catch (error) {
        if (isMissingLocationColumnError(error)) {
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
                        postedByAdminId,
                        postedByAdminName,
                        updatedAt: new Date(),
                    }
                });
                publishContentUpdate({ type: 'blogPost', action: 'updated', id: updatedPost.id, timestamp: new Date().toISOString() });
                res.json(shapeBlogPostForFrontend(updatedPost));
                return;
            } catch (fallbackError) {
                console.error(`Error updating blog post with id "${id}" without location:`, fallbackError);
                if (fallbackError instanceof Prisma.PrismaClientKnownRequestError) {
                    if (fallbackError.code === 'P2025') {
                        return res.status(404).json({ error: 'Blog post not found.' });
                    }
                    return res.status(400).json({ error: 'Database error updating blog post.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to update blog post' });
                return;
            }
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error updating blog post.', details: error.message });
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
