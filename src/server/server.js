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

// Setup socket.io
const io = socketio(server);

// Listen for socket.io connections
io.on('connection', socket => {
  console.log('Player connected!', socket.id);

  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  socket.on(Constants.MSG_TYPES.DIRECTION, handleDirection);
  socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
  socket.on('disconnect', onDisconnect);
});

// Setup the Games
let games = [];
let leastPlayerGame;
const socketToGame = {};

setInterval(() => {
  games = games.filter(game => !game.over);
  sortGames();
  console.log(games.length);
}, 1000); // every second

function sortGames() {
  games.sort((a, b) => a.numberOfPlayers - b.numberOfPlayers);
  leastPlayerGame = games[0];
}

function joinGame(username) {
  //make sure there is a game to join
  if (games.length == 0 || leastPlayerGame.numberOfPlayers >= leastPlayerGame.maxPlayers) {
    games.unshift(new Game());
    leastPlayerGame = games[0];
  }
  //add player to the game with the least players and map the player socket id to the game
  leastPlayerGame.addPlayer(this, username);
  socketToGame[this.id] = leastPlayerGame;
  //sort
  sortGames();
}

function handleDirection(dir) {
  const game = socketToGame[this.id];
  if (game) {
    game.handleDirection(this, dir);
  }
}

function handleInput(input) {
  const game = socketToGame[this.id];
  if (game) {
    game.handleInput(this, input);
  }
}

function onDisconnect() {
  const game = socketToGame[this.id];
  if (game) {
    game.removePlayer(this);
    delete socketToGame[this.id]; //Remove mapping
  }
  sortGames();
}