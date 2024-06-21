import { USERS_LIMIT } from '../../../constants/constants.js';
import { makeResponseJson } from '../../../helpers/utils.js';
import { ErrorHandler, isAuthenticated, validateObjectID } from '../../../middlewares/index.js';
import { Follow, NewsFeed, Notification, Post, User } from '../../../schemas/index.js';
import { FollowService } from '../../../services/index.js';
import express from 'express';
import mongoose from 'mongoose';
const { Request, Response, Router } = express
const { Types } = mongoose
const router = Router({ mergeParams: true });

router.post(
    '/v1/follow/:follow_id',
    isAuthenticated,
    validateObjectID('follow_id'),
    async (req, res, next) => {
        try {
            const { follow_id } = req.params;

            const user = User.findById(follow_id);
            // CHECK IF FOLLOWING USER EXIST
            if (!user) return next(ErrorHandler(400, 'The person you\'re trying to follow doesn\'t exist.'));
            // CHECK IF FOLLOWING IS NOT YOURSELF
            if (follow_id === req.user._id.toString()) return next(ErrorHandler(400, 'You can\'t follow yourself.'));

            //  CHECK IF ALREADY FOLLOWING
            const isFollowing = await Follow
                .findOne({
                    user: req.user._id,
                    target: Types.ObjectId(follow_id)
                });

            if (isFollowing) {
                return next(ErrorHandler(400, 'Already following.'))
            } else {
                const newFollower = new Follow({
                    user: req.user._id,
                    target: Types.ObjectId(follow_id)
                });

                await newFollower.save();
            }

            // TODO ---- FILTER OUT DUPLICATES
            const io = req.app.get('io');
            const notification = new Notification({
                type: 'follow',
                initiator: req.user._id,
                target: Types.ObjectId(follow_id),
                link: `/user/${req.user.username}`,
                createdAt: Date.now()
            });

            notification
                .save()
                .then(async (doc) => {
                    await doc
                        .populate({
                            path: 'target initiator',
                            select: 'fullname profilePicture username'
                        }).execPopulate();

                    io.to(follow_id).emit('newNotification', { notification: doc, count: 1 });
                });

            // SUBSCRIBE TO USER'S FEED
            const subscribeToUserFeed = await Post
                .find({ _author_id: Types.ObjectId(follow_id) })
                .sort({ createdAt: -1 })
                .limit(10);

            if (subscribeToUserFeed.length !== 0) {
                const feeds = subscribeToUserFeed.map((post) => {
                    return {
                        follower: req.user._id,
                        post: post._id,
                        post_owner: post._author_id,
                        createdAt: post.createdAt
                    }
                });

                await NewsFeed.insertMany(feeds);
            }
            res.status(200).send(makeResponseJson({ state: true }));
        } catch (e) {
            console.log('CANT FOLLOW USER, ', e);
            next(e);
        }
    }
);

router.post(
    '/v1/unfollow/:follow_id',
    isAuthenticated,
    validateObjectID('follow_id'),
    async (req, res, next) => {
        try {
            const { follow_id } = req.params;

            const user = User.findById(follow_id);
            if (!user) return next(ErrorHandler(400, 'The person you\'re trying to unfollow doesn\'t exist.'));
            if (follow_id === req.user._id.toString()) return next(ErrorHandler(400));

            await Follow.deleteOne({
                target: Types.ObjectId(follow_id),
                user: req.user._id
            });

            // UNSUBSCRIBE TO PERSON'S FEED
            await NewsFeed
                .deleteMany({
                    post_owner: Types.ObjectId(follow_id),
                    follower: req.user._id
                })

            res.status(200).send(makeResponseJson({ state: false }));
        } catch (e) {
            console.log('CANT FOLLOW USER, ', e);
            next(e);
        }
    }
);

router.get(
    '/v1/:username/following',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const { username } = req.params;
            const offset = parseInt(req.query.offset) || 0;
            const limit = USERS_LIMIT;
            const skip = offset * limit;

            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ data: [], status_code: 404, error: { message: "User not found." }, success: true, time_stamp: new Date(), message: "User not found." })

                return next(ErrorHandler(404, 'User not found.'))
            }

            const following = await FollowService.getFollow(
                { user: user._id },
                'following',
                req.user,
                skip,
                limit
            )

            if (following.length === 0) {
                return res.status(404).json({ data: [], status_code: 404, error: { message: `${username} isn't following anyone.` }, success: true, time_stamp: new Date(), message: `${username} isn't following anyone.` })

                return next(ErrorHandler(404, `${username} isn't following anyone.`));
            }

            res.status(200).send(makeResponseJson(following));
        } catch (e) {

            next(e);
        }
    });

router.get(
    '/v1/:username/followers',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const { username } = req.params;
            const offset = parseInt(req.query.offset) || 0;
            const limit = USERS_LIMIT;
            const skip = offset * limit;

            const user = await User.findOne({ username });
            if (!user) return next(ErrorHandler(404, 'User not found.'))

            const followers = await FollowService.getFollow(
                { target: user._id },
                'followers',
                req.user,
                skip,
                limit
            )

            if (followers.length === 0) {
                return next(ErrorHandler(404, `${username} has no followers.`));
            }

            res.status(200).send(makeResponseJson(followers));
        } catch (e) {
            console.log('CANT GET FOLLOWERS', e);
            next(e);
        }
    });

router.get(
    '/v1/people/suggested',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const offset = parseInt(req.query.offset) || 0;
            const skipParam = parseInt(req.query.skip) || 0;

            const limit = parseInt(req.query.limit) || USERS_LIMIT;
            const skip = skipParam || offset * limit;

            const myFollowingDoc = await Follow.find({ user: req.user._id });
            const myFollowing = myFollowingDoc.map(user => user.target);

            const people = await User.aggregate([
                {
                    $match: {
                        _id: {
                            $nin: [...myFollowing, req.user._id]
                        }
                    }
                },
                ...(limit < 10 ? ([{ $sample: { size: limit } }]) : []),
                { $skip: skip },
                { $limit: limit },
                {
                    $addFields: {
                        isFollowing: false
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        username: '$username',
                        profilePicture: '$profilePicture',
                        fullname: '$fullname',
                        name: '$name',
                        firstname: '$firstname',
                        lastname: '$lastname',
                        isFollowing: 1
                    }
                }
            ]);

            if (people.length === 0) return next(ErrorHandler(404, 'No suggested people.'));

            res.status(200).send(makeResponseJson(people));
        } catch (e) {
            return res.status(200).json({ data: [], status_code: 200, success: true, time_stamp: new Date() })
            console.log('CANT GET SUGGESTED PEOPLE', e);
            next(e);
        }
    }
)

export default router;
