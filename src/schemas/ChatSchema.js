import mongoose from "mongoose";
const  {  model, Schema }= mongoose

const ChatSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastmessage: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { getters: true, virtuals: true } });

export default model('Chat', ChatSchema);
