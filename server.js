const brain = require('brain.js')
const Twitter = require('twitter')
const http = require('http')
const express = require('express')
// eslint-disable-next-line
const dotenv = require('dotenv').config()

const app = express()
const socketIO = require('socket.io')

const server = http.createServer(app)
const io = socketIO(server)
const fs = require('fs')
const path = require('path')

const dataTweet = []
let result
app.set('view engine', 'ejs')
const publicPath = path.join(__dirname, './public')
app.use(express.static(publicPath))

// const net = new brain.NeuralNetwork();
const net = new brain.recurrent.LSTM()

const tokens = {
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
}

const client = new Twitter(tokens)
const params = {
  screen_name: 'realdonaldtrump',
  count: 50,
  result_type: 'recent',
  tweet_mode: 'extended'
}
const paramsObama = {
  screen_name: 'barackobama',
  count: 50,
  result_type: 'recent',
  tweet_mode: 'extended'
}

function testTweets() {
  console.log('Running some quick tests : ')
  console.log(
    net.run(
      'Last night, it was my great honor to host America’s senior defense and military leaders for dinner at the White House. America’s military is the GREATEST fighting force in the history of the world. They all have my pledge of unwavering commitment to our men and women in uniform!'
    )
  )
  console.log(
    net.run(
      'Incredible to have a Chicago team in the Final Four. I’ll take that over an intact bracket any day! Congratulations to everybody @loyolachicago - let’s keep it going!'
    )
  )
}

function train(data) {
  console.log('Training...')

  net.train(data, {
    iterations: 2000,
    log: true,
    // learningRate: 0.1,
    // timeout: 60
  })

  fs.writeFile(
    path.join('.', 'training-data.json'),
    JSON.stringify(net.toJSON()),
    err => {
      console.log(err)
    }
  )

  testTweets()
}

async function getTweets() {
  const promise1 = await client.get('statuses/user_timeline', paramsObama)
  const promise2 = await client.get('statuses/user_timeline', params)

  Promise.all([promise1, promise2])
    .then(data => {
      const obama = data[0]
      const trump = data[1]

      obama.forEach(tweet => {
        dataTweet.push({
          input: tweet.full_text.split('https:')[0],
          output: {
            barackobama: 1
          }
        })
      })

      trump.forEach(tweet => {
        dataTweet.push({
          input: tweet.full_text.split('https:')[0],
          output: {
            realdonaldtrump: 1
          }
        })
      })
    })
    .then(() => {
      train(dataTweet)

    })
    .catch(e => {
      console.log(e)
    })
}

app.get('/', (req, res) => {
  res.render('index')
})

io.on('connection', socket => {
  socket.on('join', message => {
    console.log(message)
  })
})

io.on('connection', socket => {
  socket.on('new message', message => {
    result = net.run(message)
    console.log(result, 2)
    socket.emit('result', result)
  })
})

server.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

try {
  const trainedData = fs.readFileSync(path.join('.', 'training-data.json'))
  net.fromJSON(JSON.parse(trainedData))
  console.log('Trained data found! Ready to work... :p')
  testTweets()
} catch (err) {
  console.log(`${err.code} Trained data not found!`)

  getTweets()
}
