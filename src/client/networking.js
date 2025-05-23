// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#4-client-networking
import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';
import { processGameUpdate } from './state';
import { chatForm, inputMessage, chatBox, addChatMessage } from './index';

const Constants = require('../shared/constants');
let chatMessages = [];


const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });
const connectedPromise = new Promise(resolve => {
  socket.on('connect', () => {
    console.log('Connected to server!');
    resolve();
  });
});

export const connect = onGameOver => (
  connectedPromise.then(() => {
    // Register callbacks
    socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
    socket.on(Constants.MSG_TYPES.GAME_OVER, onGameOver);
    socket.on('disconnect', () => {
      console.log('Disconnected from server.');
      document.getElementById('disconnect-modal').classList.remove('hidden');
      document.getElementById('reconnect-button').onclick = () => {
        window.location.reload();
      };
    });

    //chat
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (inputMessage.value.trim()) {
        socket.emit('chat message', inputMessage.value);
        inputMessage.value = '';
      }
    });
    
    socket.on('chat message', (msg) => {
      addChatMessage(msg);
    });
  })
);

export const play = username => {
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export const updateDirection = throttle(20, dir => {
  socket.emit(Constants.MSG_TYPES.DIRECTION, dir);
});

export const updateInput = throttle(20, input => {
  socket.emit(Constants.MSG_TYPES.INPUT, input);
});
