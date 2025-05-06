// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#3-client-entrypoints
import { connect, play } from './networking';
import { startRendering, stopRendering } from './render';
import { startCapturingInput, stopCapturingInput } from './input';
import { downloadAssets } from './assets';
import { initState } from './state';
import { setLeaderboardHidden } from './leaderboard';

// I'm using a tiny subset of Bootstrap here for convenience - there's some wasted CSS,
// but not much. In general, you should be careful using Bootstrap because it makes it
// easy to unnecessarily bloat your site.
import './css/bootstrap-reboot.css';
import './css/main.css';

const playMenu = document.getElementById('play-menu');
const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');

export const chatDiv = document.getElementById('chatOverlay');
export const chatForm = document.getElementById('chat-form');
export const inputMessage = document.getElementById('chat-input');
export const chatBox = document.getElementById('chat-box');

window.addEventListener('contextmenu', preventDefaultFunction);

Promise.all([
  connect(onGameOver),
  downloadAssets(),
]).then(() => {
  playMenu.classList.remove('hidden');
  usernameInput.focus();
  playButton.onclick = () => {
    // Play!
    play(usernameInput.value);
    playMenu.classList.add('hidden');
    // chatForm.classList.add('hidden');
    initState();
    startCapturingInput();
    startRendering();
    setLeaderboardHidden(false);
  };
}).catch(console.error);

function onGameOver() {
  stopCapturingInput();
  stopRendering();
  playMenu.classList.remove('hidden');
  // chatDiv.classList.remove('hidden');
  setLeaderboardHidden(true);
}

function preventDefaultFunction (e) {
  e.preventDefault();
}

export function addChatMessage(messageText) {
  const messageElement = document.createElement('p');
  messageElement.textContent = messageText;

  chatBox.appendChild(messageElement);

  // Auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}