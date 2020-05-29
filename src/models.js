const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  slug: {type: String, required: true},
})

const Post = mongoose.model('Post', postSchema)

const blogSchema = new mongoose.Schema({
  subdomain: {type: String, required: true, unique: true}, // pk
  title: {type: String, required: true},
  description: String,
  email: {type: String, required: true},
  author: {type: String, required: true},
  password: {type: String, required: true},
  posts: [postSchema]
})

const Blog = mongoose.model('Blog', blogSchema)

module.exports = {Blog, Post}
