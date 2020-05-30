import bcrypt from 'bcrypt'
import bodyParser from 'body-parser'
import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import shortid from 'shortid'
import wildcardSubdomains from 'wildcard-subdomains'
import {Blog, Post} from './models'

const PORT = process.env.PORT || 1234
const DB_URL = 'mongodb://mongo:27017/api'

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(wildcardSubdomains())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (_, res) => res.render('index'))

app.get('/create', (_, res) => res.render('create'))

app.post('/', (req, res) => {
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

app.get('/_sub/:firstSubdomain/_new', (req, res) => {
  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/new', blog)
  })
})

app.get('/_sub/:firstSubdomain/_edit', (req, res) => {
  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/edit', blog)
  })
})

app.post('/_sub/:firstSubdomain/blog/:slug/_edit', (req, res) => {
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

app.post('/_sub/:firstSubdomain/_new', (req, res) => {
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

app.post('/_sub/:firstSubdomain/_edit', (req, res) => {
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

app.get('/_sub/:firstSubdomain', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/index', blog)
  })
})

app.get('/_sub/:firstSubdomain/blog', (req, res) => {
  const {firstSubdomain} = req.params

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/blog', blog)
  })
})

app.get('/_sub/:firstSubdomain/blog/:slug', (req, res) => {
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

app.get('/_sub/:firstSubdomain/blog/:slug/_edit', (req, res) => {
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

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected to mongo database')

    app.listen(PORT, () => {
      console.log(`listening on port ${PORT}`)

      if (process.env.NODE_ENV === 'development')
        console.log(`test local subdomains at http://*.vcap.me:${PORT}/`)
    })
  })
  .catch(err => {
    console.error('unable to connect to mongo database', err.message)
  })
