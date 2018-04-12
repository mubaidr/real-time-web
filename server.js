const dotenv = require('dotenv').config()
const brain = require('brain.js')
const Twitter = require('twitter')
const http = require('http')
const express = require('express')
const app = express()
const socketIO = require('socket.io')
const server = http.createServer(app)
const io = socketIO(server);
const path = require('path')
let dataTweet = []
let result
app.set('view engine', 'ejs')
const publicPath = path.join(__dirname, './public')
app.use(express.static(publicPath))

let net = new brain.NeuralNetwork();
let trainedNet;
let longest;

const tokens = {
	consumer_key: process.env.CONSUMERKEY,
	consumer_secret: process.env.consumer_secret,
	access_token: process.env.access_token,
	access_token_key: process.env.access_token_key,
	access_token_secret: process.env.access_token_secret
}

const client = new Twitter(tokens)

function getTweets(user) {
	const promise = new Promise((resolve, reject) => {
		const params = { screen_name: `${user}`, count: 50, result_type: 'recent', tweet_mode: 'extended' };
		console.log(params)
		client.get('statuses/user_timeline', params)
		.then((data) => {
			if (data) {
				resolve(data)
			}
		})
	})
	
	return promise
}

getTweets('barackobama')
	.then((data) => {
		data.forEach((tweet) => {
			dataTweet.push({
				input: tweet.full_text.split('https:')[0],
				output: {[tweet.user.name.split(' ')[0]]: 1}
			})
		})
	}).then(() => {
		// train(getTrainingData(dataTweet))
		console.log(dataTweet)
	}).then(() => {
		
		getTweets('realdonaldtrump').then((data) => {
			data.forEach((tweet) => {
				dataTweet.push({
					input: tweet.full_text.split('https:')[0],
					output: {[tweet.user.name.split(' ')[0]]: 1}
				})
			})
		}).then(() => {
			train(getTrainingData(dataTweet))
			console.log(trainedNet(encode(adjustSize('Last night, it was my great honor to host America’s senior defense and military leaders for dinner at the White House. America’s military is the GREATEST fighting force in the history of the world. They all have my pledge of unwavering commitment to our men and women in uniform!'))));

			console.log(trainedNet(encode(adjustSize('Incredible to have a Chicago team in the Final Four. I’ll take that over an intact bracket any day! Congratulations to everybody @loyolachicago - let’s keep it going!'))));
		})
	}).catch((e) => {
		console.log(e)
	})

	app.get('/', (req, res) => {
		console.log(dataTweet)
		res.render('index')
	})
	
	io.on('connection', (socket) => {
		socket.on('join', (message) => {
		})
	})
	
	io.on('connection', (socket) => {
		socket.on('new message', (message) => {
			result = trainedNet(encode(adjustSize(`${message}`)))
			console.log(result, 2)
			console.log(trainedNet(encode(adjustSize(`${message}`))));
			socket.emit('result', result)
		})
	})
	
	server.listen(3000, () => {
	  console.log('Example app listening on port 3000!')
	})

// console.log(trainedNet(encode(adjustSize('Last night, it was my great honor to host America’s senior defense and military leaders for dinner at the White House. America’s military is the GREATEST fighting force in the history of the world. They all have my pledge of unwavering commitment to our men and women in uniform! '))));

// console.log(trainedNet(encode(adjustSize('Incredible to have a Chicago team in the Final Four. I’ll take that over an intact bracket any day! Congratulations to everybody @loyolachicago - let’s keep it going!'))));

function train(data) {
    net.train(processTrainingData(data), {
        iterations: 2000,
        log:true,
        learningRate: 0.1,
        timeout: 1000
    });
    trainedNet = net.toFunction();
}

function encode(arg) {
    return arg.split('').map(x => (x.charCodeAt(0) / 400));
}

function processTrainingData(data) {
    const processedValues = data.map(d => {
        return {
            input: encode(d.input),
            output: d.output
        }
    });
    // console.log(processedValues);
    return processedValues;
}

function getTrainingData(data) {
	const trainingData = data
  longest = trainingData.reduce((a, b) =>
    a.input.length > b.input.length ? a : b).input.length;
  for (let i = 0; i < trainingData.length; i++) {
    trainingData[i].input = adjustSize(trainingData[i].input);
  }
  return trainingData;
}

function adjustSize(string) {
  while (string.length < longest) {
    string += ' ';
  }
  return string;  
}