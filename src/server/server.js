const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');

const Constants = require('../shared/constants');
const Game = require('./game');
const webpackConfig = require('../../webpack.dev.js');

// Setup an Express server
const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
  // Setup Webpack for development
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  // Static serve the dist/ folder in production
  app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

//chat
const chatMessages = [];
const maxMessages = 10; // Desired list length

// Setup socket.io
const io = socketio(server);

// Listen for socket.io connections
io.on('connection', socket => {
  console.log('Player connected!', socket.id);

  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  socket.on(Constants.MSG_TYPES.DIRECTION, handleDirection);
  socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on("chat message", (msg) => {
    addToList(msg, chatMessages, maxMessages);
    socket.emit("chat message", chatMessages);
  });
  socket.on('disconnect', onDisconnect);
});

// Setup the Game
const game = new Game();

function joinGame(username) {
  game.addPlayer(this, username);
}

function handleDirection(dir) {
  game.handleDirection(this, dir);
}

function handleInput(input) {
  game.handleInput(this, input);
}

function onDisconnect() {
  game.removePlayer(this);
}
// Function to add elements to the list and maintain max length
function addToList(element, list, maxLength) {
  list.push(element); // Add the new element to the list
    if (list.length > maxLength) {
      list.shift(); // Remove the oldest element if list exceeds max length
    }
}