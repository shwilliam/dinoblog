import bodyParser from 'body-parser'
import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import wildcardSubdomains from 'wildcard-subdomains'
import {router} from './router'

const PORT = process.env.PORT || 1234
const DB_URL = 'mongodb://mongo:27017/api'

const app = express()

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(wildcardSubdomains())

// templating
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// routes
app.use('/', router)

// 404
app.use((_, res) => {
  res.status(404)
  res.render('status', {code: '404'})
})

// 500
app.use((_, __, res, ___) => {
  res.status(500)
  res.render('status', {code: '500'})
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
