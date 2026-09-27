const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const progress = document.getElementById('progress');
const currentEl = document.getElementById('current');
const durationEl = document.getElementById('duration');

const SRC = 'http://localhost:40000/api/Music/music/01a0be31-da4d-7eb3-9559-abaffe8292da';

let duration = 0;
let seeking = false;

const fmt = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
};

function render(seconds) {
  currentEl.textContent = fmt(seconds);
  const percent = duration ? (seconds / duration) * 100 : 0;
  progress.value = percent * 10;
  progress.style.setProperty('--p', percent);
}

playBtn.addEventListener('click', () => {
  if (audio.paused) audio.play().catch(() => durationEl.textContent = 'ошибка воспроизведения');
  else audio.pause();
});

audio.addEventListener('play', () => playBtn.textContent = 'pause');
audio.addEventListener('pause', () => playBtn.textContent = 'play');
audio.addEventListener('ended', () => playBtn.textContent = 'play');

audio.addEventListener('loadedmetadata', () => {
  duration = audio.duration;
  durationEl.textContent = fmt(duration);
  render(0);
});

audio.addEventListener('error', () => {
  durationEl.textContent = 'ошибка загрузки';
});

fetch(SRC)
  .then(r => r.blob())
  .then(blob => { audio.src = URL.createObjectURL(blob); })
  .catch(() => { durationEl.textContent = 'ошибка загрузки'; });

audio.addEventListener('timeupdate', () => {
  if (!seeking) render(audio.currentTime);
});

audio.addEventListener('seeking', () => seeking = true);
audio.addEventListener('seeked', () => {
  seeking = false;
  render(audio.currentTime);
});

progress.addEventListener('input', () => {
  if (!duration) return;
  currentEl.textContent = fmt(progress.value / 1000 * duration);
  audio.currentTime = progress.value / 1000 * duration;
});
