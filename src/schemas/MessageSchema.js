import mongoose from "mongoose";
// import { IUser } from "./UserSchema";
const { model, Schema } = mongoose;

const MessageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    // text: {
    //   type: String,
    //   required: true,
    // },
    // media: {
    //   type: Array,
    //   required: true,
    //   default: [],
    // },
    // audio: {
    //   type: String,
    //   required: false,
    // },
    // files: {
    //   type: Array,
    //   required: false,
    //   default: [],
    // },
    // call: {
    //   type: Object,
    //   required: false,
    // },
    // seen: {
    //   type: Boolean,
    //   default: false,
    // },
    // createdAt: {
    //   type: Date,
    //   required: true,
    // },
    conversation: {
      type: mongoose.Types.ObjectId,
      ref: 'Conversation'
    },
    sender: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    recipient: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    media: Array,
    audio: String,
    files: Array,
    call: Object,
    isRead: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

export default model("Message", MessageSchema);
