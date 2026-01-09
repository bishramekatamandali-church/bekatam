"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const contentUpdates_1 = require("../services/contentUpdates");
const enumNormalization_1 = require("../utils/enumNormalization");
const router = express_1.default.Router();
const shapeBlogPostForFrontend = (post) => ({
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
        const posts = await db_1.prisma.blogpost.findMany({
            orderBy: { date: 'desc' },
        });
        res.json(posts.map(shapeBlogPostForFrontend));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch blog posts" });
    }
});
// POST a new blog post
router.post('/', async (req, res) => {
    const { title, description, date, category, imageUrl, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, videoUrl, audioUrl } = req.body;
    const id = crypto_1.default.randomUUID(); // ✅ generate missing id
    const linkPath = `/blog/${id}`; // ✅ generate missing linkPath
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.blogpost_category);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid blog category.' });
    }
    try {
        const newPost = await db_1.prisma.blogpost.create({
            data: {
                id,
                title,
                description,
                linkPath, // ✅ required by Prisma
                updatedAt: new Date(),
                date: postDate,
                category: normalizedCategory,
                imageUrl,
                videoUrl,
                audioUrl,
                mediaUrls,
                location,
                taggedFriends,
                feelingActivity,
                backgroundTheme,
            },
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'blogPost', action: 'created', id: newPost.id, timestamp: new Date().toISOString() });
        res.status(201).json(shapeBlogPostForFrontend(newPost));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});
// PUT (update) a blog post
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, imageUrl, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, videoUrl, audioUrl } = req.body;
    const postDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : undefined;
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.blogpost_category);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid blog category.' });
    }
    try {
        const updatedPost = await db_1.prisma.blogpost.update({
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
                taggedFriends,
                feelingActivity,
                backgroundTheme,
                updatedAt: new Date(),
            }
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'blogPost', action: 'updated', id: updatedPost.id, timestamp: new Date().toISOString() });
        res.json(shapeBlogPostForFrontend(updatedPost));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.status(500).json({ error: 'Failed to update blog post' });
    }
});
// DELETE a blog post
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.blogpost.delete({ where: { id } });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'blogPost', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});
exports.default = router;
