import { BOOKMARKS_LIMIT } from '../../../constants/constants.js';
import { makeResponseJson } from '../../../helpers/utils.js';
import { ErrorHandler } from '../../../middlewares/error.middleware.js';
import { isAuthenticated, validateObjectID } from '../../../middlewares/middlewares.js';
import { Bookmark, Post } from '../../../schemas/index.js';
import { Router } from 'express';
import mongoose from 'mongoose';
const { Types }= mongoose
const router = Router({ mergeParams: true });

router.post('/v1/bookmark/post/:post_id', isAuthenticated, validateObjectID('post_id'), async (req, res, next) => {
    try {
        const { post_id } = req.params;
        const userID = req.user._id;

        const post = await Post.findById(post_id);
        if (!post) return res.sendStatus(404);

        if (userID.toString() === post._author_id.toString()) {
            return next(ErrorHandler(400, "You can't bookmark your own post."));
        }

        const isPostBookmarked = await Bookmark.findOne({
            _author_id: userID,
            _post_id: Types.ObjectId(post_id)
        });

        if (isPostBookmarked) {
            await Bookmark.findOneAndDelete({ _author_id: userID, _post_id: Types.ObjectId(post_id) });

            res.status(200).send(makeResponseJson({ state: false }));
        } else {
            const bookmark = new Bookmark({
                _post_id: post_id,
                _author_id: userID,
                createdAt: Date.now()
            });
            await bookmark.save();

            res.status(200).send(makeResponseJson({ state: true }));
        }
    } catch (e) {
        console.log('CANT BOOKMARK POST ', e);
        next(e);
    }
});

router.get('/v1/bookmarks', isAuthenticated, async (req, res, next) => {
    try {
        const userID = req.user._id;
        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = BOOKMARKS_LIMIT;
        const skip = offset * limit;

        const bookmarks = await Bookmark.find({ _author_id: userID })
            .populate({
                path: 'post',
                select: 'photos description',
                populate: {
                    path: 'likesCount commentsCount'
                }
            })
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });

        if (bookmarks.length === 0) {
            return next(ErrorHandler(404, "You don't have any bookmarks."));
        }

        const result = bookmarks.map(item => ({
            ...item.toObject(),
            isBookmarked: true
        }));

        res.status(200).send(makeResponseJson(result));
    } catch (e) {
        console.log('CANT GET BOOKMARKS ', e);
        next(e);
    }
});

export default router;
