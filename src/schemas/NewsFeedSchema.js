import mongoose from "mongoose";
// import { IPost } from "./PostSchema";
// import { IUser } from "./UserSchema";
const { model, Schema }= mongoose

const NewsFeedSchema = new Schema({
    follower: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    post: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Post'
    },
    post_owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    createdAt: Date
});

export default model('NewsFeed', NewsFeedSchema);
