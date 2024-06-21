import { Bookmark, NewsFeed } from "../schemas/index.js";
// import { IUser } from "../schemas/UserSchema";

export const getNewsFeed = (user, query, skip, limit) => {
  return new Promise(async (resolve, reject) => {
    try {
      const myBookmarks = await Bookmark.find({ _author_id: user?._id });
      const bookmarkPostIDs = myBookmarks.map((bm) => bm._post_id);

      const agg = await NewsFeed.aggregate([
        {
          $match: query,
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "post",
          },
        },
        {
          $project: {
            post: { $first: "$post" },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$post._id",
            privacy: "$post.privacy",
            photos: "$post.photos",
            description: "$post.description",
            type_post: "$post.type_post",
            isEdited: "$post.isEdited",
            _author_id: "$post._author_id",
            createdAt: "$post.createdAt",
            updatedAt: "$post.updatedAt",
            oldInfo: "$post.oldInfo",
          },
        },
        {
          // lookup from Comments collection to get total
          $lookup: {
            from: "comments",
            localField: "id",
            foreignField: "_post_id",
            as: "comments",
          },
        },
        {
          // lookup from Likes collection to get total
          $lookup: {
            from: "likes",
            localField: "id",
            foreignField: "target",
            as: "likes",
          },
        },
        {
          // lookup from Likes collection to get total
          $lookup: {
            from: "bookmarks",
            localField: "id",
            foreignField: "_post_id",
            as: "bookmarks",
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
            isBookmarked: { $in: ["$id", bookmarkPostIDs] },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
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
            commentsCount: { $size: "$comments" },
            likesCount: { $size: "$likes" },
            type_post: 1,
            oldInfo: {
              user: { $first: "$userOld" },
              createdAt: 1,
            },
          },
        },
      ]);

      const filtered = [];

      agg.forEach((post) => {
        // make sure to not include private posts of users
        if (!post.isOwnPost && post.privacy === "private") {
          return;
        }

        filtered.push(post);
      });

      resolve(filtered);
    } catch (err) {
      reject(err);
    }
  });
};
