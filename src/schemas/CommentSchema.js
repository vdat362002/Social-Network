import mongoose from "mongoose";
const { model, Schema }= mongoose

const options = {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret, opt) {
            delete ret.parents;
            return ret;
        }
    },
    toObject: {
        getters: true,
        virtuals: true,
        transform: function (doc, ret, opt) {
            delete ret.parents;
            return ret;
        }
    }
}

const CommentSchema = new Schema({
    _post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    parents: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    depth: {
        type: Number,
        default: 1
    },
    body: String,
    _author_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    createdAt: Date,
    updatedAt: Date
}, options);

CommentSchema.virtual('author', {
    ref: 'User',
    localField: '_author_id',
    foreignField: '_id',
    justOne: true
});

export default model('Comment', CommentSchema);
