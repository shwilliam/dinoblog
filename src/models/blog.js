const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  subdomain: {type: String, required: true, unique: true}, // pk
  title: {type: String, required: true},
  description: String,
  email: {type: String, required: true},
  author: {type: String, required: true},
  password: {type: String, required: true},
})

const Blog = mongoose.model('Blog', blogSchema)

module.exports = Blog
