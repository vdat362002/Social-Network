import mongoose from "mongoose";

export const EPrivacy = {
  private: "private",
  public: "public",
  follower: "follower",
};
const { model, Schema } = mongoose;
const PostSchema = new Schema(
  {
    _author_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    privacy: {
      type: String,
      default: "public",
      enum: ["private", "public", "follower"],
    },
    photos: [Object],
    type_post: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    oldInfo: {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

PostSchema.virtual("author", {
  ref: "User",
  localField: "_author_id",
  foreignField: "_id",
  justOne: true,
});
PostSchema.virtual("old_author", {
  ref: "User",
  localField: "shared",
  foreignField: "_id",
  justOne: true,
});
PostSchema.methods.isPostLiked = function (userID) {
  if (!isValidObjectId(userID)) return false;

  return this.likes.some((user) => {
    return user._id.toString() === userID.toString();
  });
};

export default model("Post", PostSchema);
