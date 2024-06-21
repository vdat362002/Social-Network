import { makeResponseJson } from '../../../helpers/utils.js';
import { ErrorHandler, isAuthenticated } from '../../../middlewares/index.js';
import { Follow, User } from '../../../schemas/index.js';
import { multer, uploadImageToStorage } from '../../../storage/cloudinary.js';
import { schemas, validateBody } from '../../../validations/validations.js';
import express from 'express';
const { Router } = express
const router = Router({ mergeParams: true });

import { isAuthenticatedCus } from '../../../middlewares/auth.js'

router.get(
    '/v1/:username',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const { username } = req.params;
            const user = await User.findOne({ username });

            if (!user) return next(ErrorHandler(404, 'User not found.'));

            const myFollowingDoc = await Follow.find({ user: req.user._id });
            const myFollowing = myFollowingDoc.map(user => user.target);

            const agg = await User.aggregate([
                {
                    $match: { _id: user._id }
                },
                {
                    $lookup: { // lookup for followers
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'target',
                        as: 'followers'
                    }
                },
                {
                    $lookup: { // lookup for following
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'user',
                        as: 'following'
                    }
                },
                {
                    $addFields: {
                        isFollowing: { $in: ['$_id', myFollowing] },
                        isOwnProfile: {
                            $eq: ['$$CURRENT.username', req.user.username]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        info: 1,
                        isEmailValidated: 1,
                        email: 1,
                        profilePicture: 1,
                        coverPhoto: 1,
                        username: 1,
                        firstname: 1,
                        lastname: 1,
                        dateJoined: 1,
                        followingCount: { $size: '$following' },
                        followersCount: { $size: '$followers' },
                        isFollowing: 1,
                        isOwnProfile: 1
                    }
                },
            ]);

            if (agg.length === 0) return next(ErrorHandler(404, 'User not found.'));

            res.status(200).send(makeResponseJson({ ...agg[0], fullname: user.fullname }));
        } catch (e) {
            console.log(e)
            next(e);
        }
    }
)


router.patch(
    '/v1/:username/edit',
    isAuthenticated,
    validateBody(schemas.editProfileSchema),
    async (req, res, next) => {
        try {
            const { username } = req.params;
            const { firstname, lastname, bio, birthday, gender } = req.body;
            const update = { info: {} };
            if (username !== (req.user).username) return next(ErrorHandler(401));


            if (typeof firstname !== 'undefined') update.firstname = firstname;
            if (typeof lastname !== 'undefined') update.lastname = lastname;
            if (bio) update.info.bio = bio;
            if (birthday) update.info.birthday = birthday;
            if (gender) update.info.gender = gender;

            const newUser = await User
                .findOneAndUpdate({ username }, {
                    $set: update
                }, {
                    new: true
                });

            res.status(200).send(makeResponseJson(newUser.toUserJSON()));
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
)

router.post(
    '/v1/upload/:field',
    isAuthenticated,
    multer.single('photo'),
    async (req, res, next) => {
        try {
            const { field } = req.params;
            const file = req.file;

            if (!file) return next(ErrorHandler(400, 'File not provided.'));
            if (!['picture', 'cover'].includes(field)) return next(ErrorHandler(400, `Unexpected field ${field}`));


            const image = await uploadImageToStorage(file, `${req.user.username}/profile`);
            const fieldToUpdate = field === 'picture' ? 'profilePicture' : 'coverPhoto';

            await User.findByIdAndUpdate((req.user)._id, {
                $set: {
                    [fieldToUpdate]: image
                }
            });

            res.status(200).send(makeResponseJson({ image }));
        } catch (e) {
            console.log('CANT UPLOAD FILE: ', e);
            next(e);
        }
    }
);

router.route('/v1/user/search/:keyword').get(isAuthenticatedCus, async (req, res) => {
    try {
        const { keyword } = req.params;
        const users = await User.find({
            $or: [
                { fullname: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { username: { $regex: keyword, $options: 'i' } }
            ]
        }).select('-rf_token -password')
        if (users.length === 0)
            return res.status(404).json({ msg: 'User not found.' });

        return res.status(200).json(users);
    } catch (err) {
        console.error(err)
        return res.status(500).json({ msg: err.message });
    }
})


export default router;
