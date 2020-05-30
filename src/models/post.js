import mongoose from 'mongoose'

export const postSchema = new mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  slug: {type: String, required: true},
})

export const Post = mongoose.model('Post', postSchema)
