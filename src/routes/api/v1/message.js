import { MESSAGES_LIMIT } from "../../../constants/constants.js";
import { makeResponseJson } from "../../../helpers/utils.js";
import {
  ErrorHandler,
  isAuthenticated,
  validateObjectID,
} from "../../../middlewares/index.js";
import { Chat, Message, User, Conversation } from "../../../schemas/index.js";
import { Router } from "express";
import mongoose from "mongoose";
const { Types } = mongoose;
const router = Router({ mergeParams: true });
import { isAuthenticatedCus } from '../../../middlewares/auth.js';
class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  paginate() {
    const page = this.queryStr.page || 1;
    const limit = this.queryStr.limit || 9;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
router.post(
  "/v1/message/:user_id",
  isAuthenticated,
  validateObjectID("user_id"),
  async (req, res, next) => {
    try {
      const { user_id } = req.params;
      const { text, media, audio, files, call } = req.body;
      const user = await User.findById(user_id);
      if (!user) return next(ErrorHandler(400, "Receiver not found."));
      if (!text) return next(ErrorHandler(400, "Text is required."));

      if (req.user._id.toString() === user_id) {
        return next(ErrorHandler(400, "You can\t send message to yourself."));
      }

      const message = new Message({
        from: req.user._id,
        to: Types.ObjectId(user_id),
        text,
        media,
        audio,
        files,
        call,
        seen: false,
        createdAt: Date.now(),
      });

      await Chat.findOneAndUpdate(
        {
          participants: {
            $all: [
              { $elemMatch: { $eq: req.user._id } },
              { $elemMatch: { $eq: Types.ObjectId(user_id) } },
            ],
          },
        },
        {
          $set: {
            lastmessage: message._id,
            participants: [req.user._id, Types.ObjectId(user_id)],
          },
        },
        { upsert: true }
      );

      await message.save();
      await message
        .populate({
          path: "from to",
          select: "username profilePicture fullname",
        })
        .execPopulate();

      // Notify user
      const io = req.app.get("io");

      [user_id, req.user._id.toString()].forEach((user) => {
        io.to(user).emit("newMessage", {
          ...message.toObject(),
          isOwnMessage: user === message.from._id.toString() ? true : false,
        });
      });

      res.status(200).send(makeResponseJson(message));
    } catch (e) {
      console.error(e);
      console.log("CANT SEND MESSAGE: ", e);
      next(e);
    }
  }
);

router.get("/v1/messages", isAuthenticated, async (req, res, next) => {
  try {
    let offset = parseInt(req.query.offset) || 0;

    const limit = MESSAGES_LIMIT;
    const skip = offset * limit;

    const agg = await Chat.aggregate([
      {
        $match: {
          participants: { $in: [req.user._id] },
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "messages",
          localField: "lastmessage",
          foreignField: "_id",
          as: "message",
        },
      },
      {
        $unwind: "$message",
      },
      {
        $project: {
          _id: 0,
          message: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "message.from",
          foreignField: "_id",
          as: "message.from",
        },
      },
      { $unwind: "$message.from" },
      {
        $project: {
          to: "$message.to",
          text: "$message.text",
          id: "$message._id",
          seen: "$message.seen",
          createdAt: "$message.createdAt",
          from: {
            username: "$message.from.username",
            id: "$message.from._id",
            profilePicture: "$message.from.profilePicture",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "to",
          foreignField: "_id",
          as: "message.to",
        },
      },
      { $unwind: "$message.to" },
      {
        $project: {
          id: 1,
          from: 1,
          text: 1,
          seen: 1,
          createdAt: 1,
          to: {
            username: "$message.to.username",
            id: "$message.to._id",
            profilePicture: "$message.to.profilePicture",
          },
          isOwnMessage: {
            $cond: [{ $eq: ["$from.id", req.user._id] }, true, false],
          },
        },
      },
    ]);

    if (agg.length === 0 || typeof agg[0] === "undefined") {
      return next(ErrorHandler(404, "You have no messages."));
    }

    const sorted = agg.sort(
      (a, b) =>
        new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
    );

    res.status(200).send(makeResponseJson(sorted));
  } catch (e) {
    console.log("CANT GET MESSAGES", e);
    next(e);
  }
});

router.get("/v1/messages/unread", isAuthenticated, async (req, res, next) => {
  try {
    const agg = await Message.aggregate([
      {
        $match: {
          to: req.user._id,
        },
      },
      {
        $group: {
          _id: "$from",
          seenCount: {
            $push: {
              $cond: [{ $eq: ["$seen", false] }, "$_id", "$$REMOVE"],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          count: {
            $size: "$seenCount",
          },
        },
      },
    ]);

    const totalUnseen = agg.reduce((acc, obj) => acc + obj.count, 0);

    res.status(200).send(makeResponseJson({ count: totalUnseen }));
  } catch (e) {
    console.log("CANT GET MESSAGES", e);
    next(e);
  }
});

router.patch(
  "/v1/message/read/:from_id",
  isAuthenticated,
  validateObjectID("from_id"),
  async (req, res, next) => {
    try {
      const { from_id } = req.params;

      await Message.updateMany(
        {
          from: Types.ObjectId(from_id),
          to: req.user._id,
          seen: false,
        },
        {
          $set: { seen: true },
        }
      );

      res.status(200).send(makeResponseJson({ state: true }));
    } catch (e) {
      console.log("CANT READ MESSAGES");
      next(e);
    }
  }
);

router.get(
  "/v1/messages/:target_id",
  isAuthenticated,
  validateObjectID("target_id"),
  async (req, res, next) => {
    try {
      const { target_id } = req.params;
      const offset = parseInt(req.query.offset) || 0;
      const limit = MESSAGES_LIMIT;
      const skip = offset * limit;

      const messages = await Message.find({
        $or: [
          { from: req.user._id, to: Types.ObjectId(target_id) },
          { from: Types.ObjectId(target_id), to: req.user._id },
        ],
      })
        .populate("from", "username profilePicture")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const mapped = messages.map((msg) => {
        return {
          ...msg.toObject(),
          isOwnMessage: msg.from.id === req.user._id.toString() ? true : false,
        };
      });

      if (messages.length === 0) {
        return next(ErrorHandler(404, "No messages."));
      }

      res.status(200).send(makeResponseJson(mapped));
    } catch (e) {
      console.log("CANT GET MESSAGES FROM USER", e);
      next(e);
    }
  }
);

router.route('/v1/message').post(isAuthenticatedCus, async (req, res) => {
  try {
    const { sender, recipient, text, media, audio, files, call } = req.body;

    const conversation = await Conversation.findOneAndUpdate({
      $or: [
        { recipients: [sender, recipient] },
        { recipients: [recipient, sender] }
      ]
    }, {
      recipients: [sender, recipient], text, media, audio, files, call
    }, { new: true, upsert: true });

    const prevTotalUnread = conversation.totalUnread;

    await Conversation.findOneAndUpdate({ _id: conversation._id }, {
      totalUnread: prevTotalUnread + 1
    }, { new: true });

    const message = new Message({
      conversation: conversation._id,
      sender,
      recipient,
      text,
      media,
      audio,
      files,
      call
    });

    await message.save();

    return res.status(200).json({ msg: 'Chat created.' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
})
router.route('/v1/message/conversation').get(isAuthenticatedCus, async (req, res) => {
  try {
    const conversation = await Conversation.find({ recipients: req.user._id }).populate('recipients', 'profilePicture username firstname lastname').sort('-updatedAt');
    return res.status(200).json({ conversation });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
})

router.route('/v1/message/:id').get(isAuthenticatedCus, async (req, res) => {
  try {
    const features = new APIFeatures(
      Message.find({
        $or: [
          { sender: req.user._id, recipient: req.params.id },
          { sender: req.params.id, recipient: req.user._id }
        ]
      }),
      req.query
    ).paginate();

    const messages = await features.query.sort('-createdAt').populate('sender recipient', 'profilePicture username firstname lastname');

    return res.status(200).json({ messages, result: messages.length });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
})
router.route('/v1/message/update/:id').patch(isAuthenticatedCus, async (req, res) => {
  try {
    const findMessage = await Message.findOne({
      $or: [
        { sender: req.user._id, recipient: req.params.id },
        { sender: req.params.id, recipient: req.user._id }
      ]
    });

    await Message.updateMany({
      $or: [
        { sender: req.user._id, recipient: req.params.id },
        { sender: req.params.id, recipient: req.user._id }
      ]
    }, { isRead: true });

    await Conversation.findOneAndUpdate({ _id: findMessage.conversation }, {
      totalUnread: 0
    });

    res.status(200).json({ conversation: findMessage.conversation });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
})


export default router;
