import express from 'express'
import shortid from 'shortid'
import bcrypt from 'bcrypt'
import {Blog, Post} from './models'

const renderErrorView = (res, status) => {
  res.status(status)
  res.render('status', {code: status})
}

const router = express.Router()

router.get('/', (_, res) => res.render('index'))

router.get('/create', (_, res) => res.render('create'))

// TODO: validate req body

router.post('/', (req, res) => {
  const password = shortid.generate()
  const hashedPassword = bcrypt.hashSync(password, 10)
  const {subdomain, title, author, email, description} = req.body

  const newBlog = new Blog({
    subdomain,
    title,
    author,
    email,
    description,
    password: hashedPassword,
  })

  newBlog.save((err, blog) => {
    console.log(blog.password)
    if (err) renderErrorView(res, 500)
    else res.render('success', {subdomain: blog.subdomain, password})
  })
})

router.get('/_sub/:firstSubdomain/_new', (req, res) => {
  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else res.render('blog/new', blog)
  })
})

router.get('/_sub/:firstSubdomain/_edit', (req, res) => {
  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else res.render('blog/edit', blog)
  })
})

router.post('/_sub/:firstSubdomain/blog/:slug/_edit', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else if (
      !bcrypt.compareSync(req.body.password, blog.password) &&
      req.body.password !== blog.password // dev
    )
      // TODO: render auth err view
      res.send('Incorrect password')
    else {
      const postIdx = blog.posts.findIndex(post => post.slug === req.body.slug)
      if (postIdx === -1) renderErrorView(res, 404)
      else {
        blog.posts[postIdx] = {
          ...req.body,
        }
        blog.save()
        res.render('blog/edit-success', blog)
      }
    }
  })
})

router.post('/_sub/:firstSubdomain/_new', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else if (
      !bcrypt.compareSync(blog.password, req.body.password) &&
      !blog.password === req.body.password // dev
    )
      // TODO: render auth err view
      res.send('Incorrect password')
    else {
      const post = new Post({
        ...req.body,
      })
      blog.posts.push(post)
      blog.save()
      res.render('blog/edit-success', blog)
    }
  })
})

router.post('/_sub/:firstSubdomain/_edit', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOneAndUpdate(
    {subdomain: firstSubdomain},
    {
      ...req.body,
    },
    (err, blog) => {
      if (err) renderErrorView(res, 500)
      else if (!blog) renderErrorView(res, 404)
      else if (!bcrypt.compareSync(req.body.password, blog.password))
        // TODO: render auth err view
        res.send('Incorrect password')
      else res.render('blog/edit-success', blog)
    },
  )
})

router.get('/_sub/:firstSubdomain', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else res.render('blog/index', blog)
  })
})

router.get('/_sub/:firstSubdomain/blog', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else res.render('blog/blog', blog)
  })
})

router.get('/_sub/:firstSubdomain/blog/:slug', (req, res) => {
  const {firstSubdomain, slug} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else if (slug === '_edit') res.redirect(307, '/_edit')
    else {
      const post = blog.posts.find(post => post.slug === slug)
      if (!post) renderErrorView(res, 404)
      else {
        const {author, email, title: blogTitle} = blog
        const {title, content} = post

        res.render('blog/post', {
          author,
          email,
          blogTitle,
          title,
          content,
        })
      }
    }
  })
})

router.get('/_sub/:firstSubdomain/blog/:slug/_edit', (req, res) => {
  const {firstSubdomain, slug} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err) renderErrorView(res, 500)
    else if (!blog) renderErrorView(res, 404)
    else {
      const post = blog.posts.find(post => post.slug === slug)
      if (!post) renderErrorView(res, 404)
      else {
        const {author, email, title: blogTitle} = blog
        const {title, content} = post

        res.render('blog/post-edit', {
          author,
          email,
          blogTitle,
          title,
          content,
          slug,
        })
      }
    }
  })
})

export {router}
