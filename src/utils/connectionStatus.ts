import { reactive, ref } from 'vue';
import { io, Socket } from 'socket.io-client';

// 全局 WebSocket 连接状态表，key 为连接名称，value 为是否连接
export const connectionStatus = reactive<Record<string, boolean>>({});

// 外部调用此方法更新连接状态
export function setConnectionStatus(name: string, connected: boolean) {
  connectionStatus[name] = connected;
}

// 全局WebSocket连接
const socket = ref<Socket | null>(null);
const isConnected = ref(false);

// 创建WebSocket连接
export function useWebSocket() {
  if (!socket.value) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    
    socket.value = io(baseUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.value.on('connect', () => {
      console.log('WebSocket连接成功');
      isConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      console.log('WebSocket连接断开');
      isConnected.value = false;
    });

    socket.value.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error);
      isConnected.value = false;
    });
  }

  return {
    socket,
    isConnected
  };
} 