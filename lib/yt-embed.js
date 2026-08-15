const API_SCRIPT_URL = 'https://www.youtube.com/iframe_api';

let apiPromise = null;
let playerPromise = null;
let player = null;
let hostElement = null;
let isReady = false;
const stateListeners = new Set();
const readyListeners = new Set();

function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const settle = () => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return true;
      }
      return false;
    };

    if (settle()) return;

    const script = document.createElement('script');
    script.src = API_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (settle()) return;

      let attempts = 0;
      const waitForPlayer = () => {
        if (settle()) return;
        attempts += 1;
        if (attempts >= 50) {
          reject(new Error('IFrame API loaded but YT.Player is missing'));
          return;
        }
        setTimeout(waitForPlayer, 100);
      };
      waitForPlayer();
    };
    script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    document.head.appendChild(script);
  });
  return apiPromise;
}

function ensureHostElement() {
  if (hostElement) return hostElement;
  hostElement = document.createElement('div');
  hostElement.id = 'next-satrang-yt-embed-host';
  hostElement.setAttribute('aria-hidden', 'true');
  hostElement.setAttribute('tabindex', '-1');
  hostElement.style.cssText =
    'position:fixed;width:320px;height:180px;left:-9999px;top:-9999px;opacity:0.01;pointer-events:none;z-index:-1;border:0;';
  document.body.appendChild(hostElement);
  return hostElement;
}

function emitState(state) {
  stateListeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('[ytEmbed] state listener error:', error);
    }
  });
}

function initPlayer() {
  if (playerPromise) return playerPromise;
  playerPromise = loadApi()
    .then(() => new Promise((resolve, reject) => {
      let settled = false;
      const host = ensureHostElement();
      const widget = new window.YT.Player(host, {
        width: '320',
        height: '180',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            isReady = true;
            player = widget;
            const frame = widget.getIframe?.();
            if (frame && !frame.getAttribute('allow')) {
              frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
            }
            emitState({ type: 'ready' });
            readyListeners.forEach((listener) => listener());
            if (!settled) {
              settled = true;
              resolve(widget);
            }
          },
          onStateChange: (event) => {
            emitState({ type: 'state', data: event.data });
          },
          onError: (event) => {
            emitState({ type: 'error', code: event.data });
          },
        },
      });
      setTimeout(() => {
        if (!settled) {
          settled = true;
          hostElement?.remove();
          hostElement = null;
          player = null;
          isReady = false;
          reject(new Error('IFrame player not ready in time'));
        }
      }, 20000);
    }));
  playerPromise.catch(() => {
    playerPromise = null;
  });
  return playerPromise;
}

export async function ensurePlayer() {
  return initPlayer();
}

export function onReady(callback) {
  if (player) {
    callback(player);
    return () => {};
  }
  readyListeners.add(callback);
  return () => readyListeners.delete(callback);
}

export function onStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

export async function loadTrack(videoId, autoplay = false) {
  const p = await ensurePlayer();
  if (autoplay) {
    p.loadVideoById(videoId, 0, 'default');
  } else {
    p.cueVideoById(videoId, 0, 'default');
  }
  return p;
}

export async function cuePlaylistDirect(playlistId) {
  const p = await ensurePlayer();
  p.cuePlaylist({ list: playlistId, listType: 'playlist', index: 0 });
  return p;
}

export async function getPlaylist() {
  if (!player || !isReady) return [];
  try {
    return player.getPlaylist?.() || [];
  } catch {
    return [];
  }
}

export async function playVideo() {
  const p = await initPlayer();
  p.playVideo();
}

export async function pauseVideo() {
  const p = await initPlayer();
  p.pauseVideo();
}

export async function nextVideo() {
  const p = await initPlayer();
  p.nextVideo();
}

export async function previousVideo() {
  const p = await initPlayer();
  p.previousVideo();
}

export async function seekTo(seconds) {
  const p = await initPlayer();
  p.seekTo(seconds, true);
}

export async function setEmbedVolume(volume) {
  const p = await initPlayer();
  p.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100));
}

export async function setEmbedMuted(muted) {
  const p = await initPlayer();
  if (muted) p.mute();
  else p.unMute();
}

export async function getCurrentTime() {
  if (!player || !isReady) return 0;
  try {
    const value = player.getCurrentTime();
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export async function getDuration() {
  if (!player || !isReady) return 0;
  try {
    const value = player.getDuration();
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export async function getVideoData() {
  if (!player || !isReady) return null;
  try {
    return player.getVideoData?.() || null;
  } catch {
    return null;
  }
}

export function isPlayerReady() {
  return Boolean(player && isReady);
}

export const ytEmbed = {
  ensurePlayer,
  cuePlaylistDirect,
  loadTrack,
  playVideo,
  pauseVideo,
  nextVideo,
  previousVideo,
  seekTo,
  setVolume: setEmbedVolume,
  setMuted: setEmbedMuted,
  getCurrentTime,
  getDuration,
  getVideoData,
  getPlaylist,
  onReady,
  onStateChange,
  isPlayerReady,
};
