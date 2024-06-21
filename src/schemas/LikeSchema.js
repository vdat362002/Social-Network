import mongoose from "mongoose";
const { model, Schema }= mongoose
const LikeSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['Post', 'Comment']
    },
    target: {
        type: Schema.Types.ObjectId,
        refPath: 'type',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { getters: true, virtuals: true } });

export default model('Like', LikeSchema);
