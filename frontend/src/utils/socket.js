import { io } from 'socket.io-client';

let socket = null;

// Derive the socket server URL from the API URL.
// In development the Vite proxy handles '/api' and '/' so we default to '/'.
// In production VITE_API_URL points to the public backend
// (e.g. "https://my-backend.up.railway.app/api"), so we strip the /api path.
function getSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return '/';
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return '/';
  }
}

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(token) {
  const s = getSocket();
  s.auth = { token };
  s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
