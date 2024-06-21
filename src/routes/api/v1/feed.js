import { FEED_LIMIT } from "../../../constants/constants.js";
import { makeResponseJson } from "../../../helpers/utils.js";
import { ErrorHandler } from "../../../middlewares/index.js";
import { EPrivacy } from "../../../schemas/PostSchema.js";
import { NewsFeedService, PostService } from "../../../services/index.js";
import { Router } from "express";

const router = Router({ mergeParams: true });

router.get("/v1/feed", async (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = FEED_LIMIT;
    const skip = offset * limit;

    let result = [];

    if (req.isAuthenticated()) {
      result = await NewsFeedService.getNewsFeed(
        req.user,
        { follower: req.user._id },
        skip,
        limit
      );
    } else {
      result = await PostService.getPosts(
        null,
        { privacy: EPrivacy.public },
        { skip, limit, sort: { createdAt: -1 } }
      );
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({
          data: [],
          status_code: 404,
          error: { message: "No more feed" },
          success: true,
          time_stamp: new Date(),
          message: "No more feed",
        });
      return next(ErrorHandler(404, "No more feed."));
    }

    res.status(200).send(makeResponseJson(result));
  } catch (e) {
    console.log("CANT GET FEED", e);
    next(e);
  }
});

router.get("/v1/feed/video", async (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = FEED_LIMIT;
    const skip = offset * limit;

    let result = [];

    if (req.isAuthenticated()) {
      result = await NewsFeedService.getNewsFeed(
        req.user,
        { follower: req.user._id, "post.type_post": "video" }, // Thêm điều kiện type_post: "video"
        skip,
        limit
      );
    } else {
      result = await PostService.getPosts(
        null,
        { privacy: EPrivacy.public, type_post: "video" },
        { skip, limit, sort: { createdAt: -1 } }
      ); // Thêm điều kiện type_post: "video"
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({
          data: [],
          status_code: 404,
          error: { message: "No more feed" },
          success: true,
          time_stamp: new Date(),
          message: "No more feed",
        });
      return next(ErrorHandler(404, "No more feed."));
    }

    res.status(200).send(makeResponseJson(result));
  } catch (e) {
    console.log("CANT GET FEED", e);
    next(e);
  }
});

router.get("/v1/feed/story", async (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = FEED_LIMIT;
    const skip = offset * limit;

    let result = [];

    if (req.isAuthenticated()) {
      result = await NewsFeedService.getNewsFeed(
        req.user,
        { follower: req.user._id },
        skip,
        limit
      );
    } else {
      result = await PostService.getPosts(
        null,
        { privacy: EPrivacy.public },
        { skip, limit, sort: { createdAt: -1 } }
      );
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({
          data: [],
          status_code: 404,
          error: { message: "No more feed" },
          success: true,
          time_stamp: new Date(),
          message: "No more feed",
        });
      return next(ErrorHandler(404, "No more feed."));
    }

    res.status(200).send(makeResponseJson(result));
  } catch (e) {
    console.log("CANT GET FEED", e);
    next(e);
  }
});


export default router;
