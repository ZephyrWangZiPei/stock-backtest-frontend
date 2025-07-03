import { reactive } from 'vue';

// 全局 WebSocket 连接状态表，key 为连接名称，value 为是否连接
export const connectionStatus = reactive<Record<string, boolean>>({});

// 外部调用此方法更新连接状态
export function setConnectionStatus(name: string, connected: boolean) {
  connectionStatus[name] = connected;
} 