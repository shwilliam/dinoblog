import express from 'express'
import shortid from 'shortid'
import bcrypt from 'bcrypt'
import {Blog, Post} from './models'

const router = express.Router()

router.get('/', (_, res) => res.render('index'))

router.get('/create', (_, res) => res.render('create'))

router.post('/', (req, res) => {
  const password = shortid.generate()
  const hashedPassword = bcrypt.hashSync(password, 10)

  const newBlog = new Blog({
    ...req.body,
    password: hashedPassword,
  })

  newBlog.save((err, blog) => {
    if (err)
      res.status(422).send({error: 'error creating blog', detail: err.message})
    else res.render('success', {subdomain: blog.subdomain, password})
  })
})

router.get('/_sub/:firstSubdomain/_new', (req, res) => {
  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/new', blog)
  })
})

router.get('/_sub/:firstSubdomain/_edit', (req, res) => {
  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/edit', blog)
  })
})

router.post('/_sub/:firstSubdomain/blog/:slug/_edit', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    if (!bcrypt.compareSync(req.body.password, blog.password)) res.send('🔐')
    else {
      Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
        if (err || !blog) res.send('🤷‍♀️')
        else {
          const postIdx = blog.posts.findIndex(
            post => post.slug === req.body.slug,
          )
          if (postIdx === -1) res.send('🤷‍♀️')
          else {
            blog.posts[postIdx] = {
              ...req.body,
            }
            blog.save()
            res.send('🎊')
          }
        }
      })
    }
  })
})

router.post('/_sub/:firstSubdomain/_new', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    if (!bcrypt.compareSync(req.body.password, blog.password)) res.send('🔐')
    else {
      const post = new Post({
        ...req.body,
      })
      blog.posts.push(post)
      blog.save()
      res.send('🎊')
    }
  })
})

router.post('/_sub/:firstSubdomain/_edit', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    if (!bcrypt.compareSync(req.body.password, blog.password)) res.send('🔐')
    else
      Blog.findOneAndUpdate(
        {subdomain: firstSubdomain},
        {
          ...req.body,
        },
        (err, blog) => {
          if (err || !blog) res.send('🤷‍♀️')
          else res.render('blog/index', blog)
        },
      )
  })
})

router.get('/_sub/:firstSubdomain', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/index', blog)
  })
})

router.get('/_sub/:firstSubdomain/blog', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/blog', blog)
  })
})

router.get('/_sub/:firstSubdomain/blog/:slug', (req, res) => {
  const {firstSubdomain, slug} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog || slug === '_edit') res.send('🤷‍♀️')
    else {
      const post = blog.posts.find(post => post.slug === slug)
      if (!post) res.send('🤷‍♀️')
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
    if (err || !blog) res.send('🤷‍♀️')
    else {
      const post = blog.posts.find(post => post.slug === slug)
      if (!post) res.send('🤷‍♀️')
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
