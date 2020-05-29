const express = require('express')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const path = require('path')
const shortid = require('shortid')
const wildcardSubdomains = require('wildcard-subdomains')

const mongoose = require('mongoose')
const Blog = require('./models/Blog')

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
  const body = req.body
  const subdomain = body.subdomain
  const title = body.title
  const description = body.description
  const email = body.email
  const author = body.author
  const password = shortid.generate()
  const hashedPassword = bcrypt.hashSync(password, 10)

  const newBlog = new Blog({
    subdomain,
    title,
    description,
    email,
    author,
    password: hashedPassword,
  })

  newBlog.save((err, blog) => {
    if (err) {
      res.status(422).send({error: 'error creating blog', detail: err.message})
    }
    res.send(password)
  })
})

app.get('/_sub/:firstSubdomain/_edit', function (req, res) {
  const firstSubdomain = req.params.firstSubdomain
  // const originalUrl = req.params.originalUrl
  // const queryString = JSON.stringify(req.query)

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/edit', blog)
  })
})

app.post('/_sub/:firstSubdomain', function (req, res) {
  const body = req.body
  const title = body.title
  const description = body.description
  const email = body.email
  const author = body.author
  const password = body.password

  const firstSubdomain = req.params.firstSubdomain

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    if (!bcrypt.compareSync(password, blog.password)) res.send('🔐')
    else
      Blog.findOneAndUpdate(
        {subdomain: firstSubdomain},
        {
          title,
          description,
          email,
          author,
        },
        (err, blog) => {
          if (err || !blog) res.send('🤷‍♀️')
          else res.render('blog/index', blog)
        },
      )
  })
})

app.get('/_sub/:firstSubdomain', function (req, res) {
  const firstSubdomain = req.params.firstSubdomain
  // const originalUrl = req.params.originalUrl
  // const queryString = JSON.stringify(req.query)

  Blog.findOne({subdomain: firstSubdomain}, (err, blog) => {
    if (err || !blog) res.send('🤷‍♀️')
    else res.render('blog/index', blog)
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
