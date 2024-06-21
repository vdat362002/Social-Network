import { Bookmark, Post } from "../schemas/index.js";
// import { IUser } from "@/schemas/UserSchema";

const buildPaginateOptions = (opts) => {
  const arr = [];
  if (opts.sort) arr.push({ $sort: opts.sort });
  if (opts.skip) arr.push({ $skip: opts.skip });
  if (opts.limit) arr.push({ $limit: opts.limit });

  return arr;
};

export const getPosts = (user, query, paginate) => {
  return new Promise(async (resolve, reject) => {
    try {
      const myBookmarks = await Bookmark.find({ _author_id: user?._id });
      const bookmarkPostIDs = myBookmarks.map((bm) => bm._post_id);

      const agg = await Post.aggregate([
        {
          $match: query,
        },
        ...buildPaginateOptions(paginate || {}),
        {
          // lookup from Comments collection to get total
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "_post_id",
            as: "comments",
          },
        },
        {
          // lookup from Likes collection to get total
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "target",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { authorID: "$_author_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$authorID"],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  id: "$_id",
                  email: 1,
                  profilePicture: 1,
                  username: 1,
                  fullname: 1,
                  name: 1,
                  firstname: 1,
                  lastname: 1,
                },
              },
            ],
            as: "author",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { userId: "$oldInfo.user" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$userId"],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  id: "$_id",
                  email: 1,
                  profilePicture: 1,
                  username: 1,
                  fullname: 1,
                  name: 1,
                  firstname: 1,
                  lastname: 1,
                },
              },
            ],
            as: "userOld",
          },
        },
        {
          $addFields: {
            likeIDs: {
              $map: {
                input: "$likes",
                as: "postLike",
                in: "$$postLike.user",
              },
            },
          },
        },
        {
          // add isLiked field by checking if user id exists in $likes array from lookup
          $addFields: {
            isLiked: { $in: [user?._id, "$likeIDs"] },
            isOwnPost: { $eq: ["$$CURRENT._author_id", user?._id] },
            isBookmarked: { $in: ["$_id", bookmarkPostIDs] },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            privacy: 1,
            photos: 1,
            description: 1,
            isEdited: 1,
            createdAt: 1,
            updatedAt: 1,
            author: { $first: "$author" },
            isLiked: 1,
            isOwnPost: 1,
            isBookmarked: 1,
            commentsCount: {
              $size: "$comments",
            },
            likesCount: {
              $size: "$likes",
            },
            oldInfo: {
              user: { $first: "$userOld" },
              createdAt: 1,
            },
          },
        },
      ]);

      resolve(agg);
    } catch (err) {
      reject(err);
    }
  });
};
