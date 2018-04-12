const Twitter = require('twitter')
const brain = require('brain.js')
const http = require('http')
const express = require('express')
const app = express()
const socketIO = require('socket.io')
const server = http.createServer(app)
const io = socketIO(server);
const path = require('path')
app.set('view engine', 'ejs')
const publicPath = path.join(__dirname, './public')
app.use(express.static(publicPath))
let trainedNet
let net = new brain.NeuralNetwork()

let dataTweet = []
const trainingdata = require('./js/training-data.js')

function train(data) {
    console.log('training')
    net.trainAsync(processTrainingData(data, {
        iterations: 1,
        log:true,
        learningRate: 0.1,
        timeout: 500
    }))
    trainedNet = net.toFunction();
}

const tokens = {
	consumer_key:        'MoQRp4aI92U3pxkbemrBBCfjc',
	consumer_secret:     '1Tp6lGIll9FsYSZQXVLLgJQZG46mpStmKq0teUm7PwpXG7o888',
	access_token:        '3077967255-P1POfezTGX6I6zt8f9sIneGcXFhw9gMIHpu4kiE',
	access_token_key:    '3077967255-P1POfezTGX6I6zt8f9sIneGcXFhw9gMIHpu4kiE',
	access_token_secret: 'jJ64F09TIi9rnixldoBenWW5xBhyg3gJgOvUO7t0e0tNM'
  }

const client = new Twitter(tokens)
const params = { screen_name: 'realdonaldtrump', count: 10, result_type: 'recent', tweet_mode: 'extended' };
const paramsObama = { screen_name: 'barackobama', count: 10, result_type: 'recent', tweet_mode: 'extended' };

async function getTweets () {

    const promise1 = await client.get('statuses/user_timeline', paramsObama)
    const promise2 = await client.get('statuses/user_timeline', params)
    
    Promise.all([promise1, promise2]).then((data) => {
        const obama = data[0];
        const trump = data[1];
        obama.forEach(tweet => {
            dataTweet.push({
                input: tweet.full_text.split('https:')[0],
                output: {[tweet.user.name.split(' ')[0]]: 1}
            })
        });
        trump.forEach(tweet => {
            dataTweet.push({
                input: tweet.full_text.split('https:')[0],
                output: {[tweet.user.name.split(' ')[0]]: 1}
            })
        });
    }).then(() => {
        console.log(dataTweet, 'here')
        // train(trainingdata)
    }).catch((e) => {
        console.log(e)
    })
    
}

getTweets()

io.on('connection', (socket) => {
    socket.on('join', (message) => {
    })
})

io.on('connection', (socket) => {
    socket.on('new message', (message) => {
    })
})

function encode(arg) {
    return arg.split('').map(x => (x.charCodeAt(0) / 400));
}

function processTrainingData(data) {
    return data.map(d => {
        return {
            input: encode(d.input),
            output: d.output
        }
    })
}

function execute(input) {
    console.log(input, 'input')
    let results = trainedNet(encode(input));
    let output;
    let certainty;
    console.log(results)
    console.log(results.Donald)
    if (results.Donald > results.Barack) {
        output = 'Donald Trump'
        certainty = Math.floor(results.Donald * 100)
    } else { 
        output = 'Barack Obama'
        certainty = Math.floor(results.Barack * 100)
    }

    return "I'm " + certainty + "% sure that tweet was written by " + output;
}

app.get('/', (req, res) => {
    train(trainingdata)
    
    console.log(execute("After years of rebuilding OTHER nations, we are finally rebuilding OUR nation - and we are restoring our confidence and our pride!"));
    res.render('index')
})

server.listen(3000, () => {
    console.log('Example app listening on port 3000!')
})