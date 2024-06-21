import { makeResponseJson } from '../../../helpers/utils.js';
import { ErrorHandler } from '../../../middlewares/index.js';
import { Follow, User } from '../../../schemas/index.js';
import { EPrivacy } from '../../../schemas/PostSchema.js';
import { PostService } from '../../../services/index.js';
import express from 'express';
const { Request, Response, Router }= express
const router = Router({ mergeParams: true });

router.get(
    '/v1/search',
    async (req, res, next) => {
        try {
            const { q, type } = req.query;
            const offset = parseInt(req.query.offset) || 0;
            const limit = parseInt(req.query.limit) || 10;
            const skip = offset * limit;

            if (!q) return next(ErrorHandler(400, 'Search query is required.'));

            let result = [];

            if (type === 'posts') {
                const posts = await PostService
                    .getPosts(
                        req.user,
                        {
                            description: {
                                $regex: q,
                                $options: 'i'
                            },
                            privacy: EPrivacy.public
                        },
                        {
                            sort: { createdAt: -1 },
                            skip,
                            limit
                        }
                    );

                if (posts.length === 0) {
                    return next(ErrorHandler(404, 'No posts found.'));
                }

                result = posts;
                // console.log(posts);
            } else {
                const users = await User
                    .find({
                        $or: [
                            { firstname: { $regex: q, $options: 'i' } },
                            { lastname: { $regex: q, $options: 'i' } },
                            { username: { $regex: q, $options: 'i' } }
                        ]
                    })
                    .limit(limit)
                    .skip(skip);

                if (users.length === 0) {
                    return next(ErrorHandler(404, 'No users found.'));
                }

                const myFollowingDoc = await Follow.find({ user: req.user?._id });
                const myFollowing = myFollowingDoc.map(user => user.target);

                const usersResult = users.map((user) => {
                    return {
                        ...user.toProfileJSON(),
                        isFollowing: myFollowing.includes(user.id)
                    }
                });

                result = usersResult;
            }

            res.status(200).send(makeResponseJson(result));
        } catch (e) {
            console.log('CANT PERFORM SEARCH: ', e);
            next(e);
        }

    }
);

export default router;
