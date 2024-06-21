import { Follow } from "../schemas/index.js";
// import { IUser } from "@/schemas/UserSchema";

export const getFollow = (
    query,
    type = 'followers',
    user,
    skip,
    limit
) => {
    return new Promise(async (resolve, reject) => {
        try {
            const myFollowingDoc = await Follow.find({ user: user._id });
            const myFollowing = myFollowingDoc.map(user => user.target); // map to array of user IDs

            const agg = await Follow.aggregate([
                {
                    $match: query
                },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: type === 'following' ? 'target' : 'user',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $addFields: {
                        isFollowing: { $in: ['$user._id', myFollowing] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id: '$user._id',
                        username: '$user.username',
                        email: '$user.email',
                        profilePicture: '$user.profilePicture',
                        firstname: '$user.firstname',
                        lastname: '$user.lastname',
                        name: '$user.name',
                        isFollowing: 1
                    }
                }
            ]);

            resolve(agg);
        } catch (err) {
            reject(err);
        }
    });
}