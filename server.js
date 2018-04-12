const dotenv = require('dotenv').config()
const brain = require('brain.js')
const Twitter = require('twitter')
let net = new brain.NeuralNetwork();
let trainedNet;
let longest;
const http = require('http')
const express = require('express')
const app = express()
const socketIO = require('socket.io')
const server = http.createServer(app)
const io = socketIO(server);
const path = require('path')
let dataTweet = []
app.set('view engine', 'ejs')
const publicPath = path.join(__dirname, './public')
app.use(express.static(publicPath))


const params = { screen_name: 'realdonaldtrump', count: 10, result_type: 'recent', tweet_mode: 'extended' };
const paramsObama = { screen_name: 'barackobama', count: 10, result_type: 'recent', tweet_mode: 'extended' };

const tokens = {
	consumer_key: process.env.CONSUMERKEY,
	consumer_secret: process.env.consumer_secret,
	access_token: process.env.access_token,
	access_token_key: process.env.access_token_key,
	access_token_secret: process.env.access_token_secret
  }

app.get('/', (req, res) => {
	console.log(trainedNet(encode(adjustSize('Last night, it was my great honor to host America’s senior defense and military leaders for dinner at the White House. America’s military is the GREATEST fighting force in the history of the world. They all have my pledge of unwavering commitment to our men and women in uniform! '))));
	res.render('index')
})

io.on('connection', (socket) => {
    socket.on('join', (message) => {
    })
})

io.on('connection', (socket) => {
    socket.on('new message', (message) => {
		console.log(message)
    })
})

server.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

const client = new Twitter(tokens)

getTweets( () => {

	train(getTrainingData())

	console.log(trainedNet(encode(adjustSize('Incredible to have a Chicago team in the Final Four. I’ll take that over an intact bracket any day! Congratulations to everybody @loyolachicago - let’s keep it going!'))));
	console.log(trainedNet(encode(adjustSize('Last night, it was my great honor to host America’s senior defense and military leaders for dinner at the White House. America’s military is the GREATEST fighting force in the history of the world. They all have my pledge of unwavering commitment to our men and women in uniform! '))));

} )

async function getTweets ( cb ) {

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
		train(dataTweet, cb)
    }).catch((e) => {
		console.log(e)
	})
}

function train(data, cb) {
    net.train(processTrainingData(data), {
        iterations: 20,
        log:true,
		learningRate: 0.1,
		logPeriod:10,
        timeout: 1000
    });
	trainedNet = net.toFunction();
	
	if ( cb ) {
		cb()
	}
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
    return processedValues;
}

function getTrainingData(data) {
  console.log(dataTweet,'now')
	const trainingData = [{
    input: 'RT @ObamaFoundation: This week—50 years since Dr. Martin Luther King, Jr. was killed—@BarackObama and @repjohnlewis sat down with a group o…',
    output: {
        Barack: 1
    }
  },
    {
      input: 'Incredible to have a Chicago team in the Final Four. I’ll take that over an intact bracket any day! Congratulations to everybody @loyolachicago - let’s keep it going!',
      output: {
        Barack: 1
      }
    },
    {
      input: 'In Singapore with young people who are advocating for education, empowering young women, and getting involved all over Southeast Asia with a profoundly optimistic commitment to building the world they want to see. ',
      output: {
        Barack: 1
      }
    },
    {
      input: 'Very thankful for President Xi of China’s kind words on tarrifs and automobile barriers...also, his enlightenment on intellectual property and technology transfers. We will make great progress together!',
      output: {
        Donald: 1
      }
    },
    {
      input: 'Last night, it was my great honor to host America’s senior defense and military leaders for dinner at the White House. America’s military is the GREATEST fighting force in the history of the world. They all have my pledge of unwavering commitment to our men and women in uniform! ',
      output: {
        Donald: 1
      }
    },
    {
      input: 'A TOTAL WITCH HUNT!!!',
      output: {
        Donald: 1
      }
    }
  ];
  longest = dataTweet.reduce((a, b) =>
    a.input.length > b.input.length ? a : b).input.length;
  for (let i = 0; i < dataTweet.length; i++) {
    dataTweet[i].input = adjustSize(dataTweet[i].input);
  }
  return dataTweet;
}

function adjustSize(string) {
  while (string.length < longest) {
    string += ' ';
  }
  return string;  
}