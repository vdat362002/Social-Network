import mongoose from "mongoose";
const { model, Schema } = mongoose;
const ConversationSchema = new Schema({
  recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  text: String,
  media: Array,
  audio: String,
  files: Array,
  call: Object,
  totalUnread: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { getters: true, virtuals: true },
})

export default model('Conversation', ConversationSchema)