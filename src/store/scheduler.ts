import { defineStore } from 'pinia';
import { Socket } from 'socket.io-client';
import { createWebSocketManager, WebSocketManager } from '@/utils/websocketManager';

// Define the structure for the scheduler status
export interface SchedulerStatus {
  is_running: boolean;
  jobs_count: number;
  jobs: any[];
  current_time: string;
}

export interface SchedulerState {
  socket: Socket | null;
  wsManager: WebSocketManager | null;
  isConnected: boolean;
  status: SchedulerStatus;
  taskStatus: Record<string, {
    progress?: number;
    current_date_progress: number;
    message: string;
    success?: boolean;
    data?: any;
  }>;
  last_update_times: {
    daily_data?: string;
    stock_list?: string;
  }
}

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export const useSchedulerStore = defineStore('scheduler', {
  state: (): SchedulerState => ({
    socket: null,
    wsManager: null as WebSocketManager | null,
    isConnected: false,
    status: {
      is_running: false,
      jobs_count: 0,
      jobs: [],
      current_time: '--:--:--',
    },
    taskStatus: {},
    last_update_times: {},
  }),
  
  actions: {
    connect() {
      if (this.wsManager?.isConnected) return;

      this.wsManager = createWebSocketManager({
        url: `${VITE_API_BASE_URL}/scheduler`,
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        connectionName: 'scheduler',
        onConnect: (socket) => {
          this.socket = socket;
          this.isConnected = true;
          console.log('[SchedulerStore] Socket connected:', socket.id);
          this.requestStatusUpdate(); // Request initial status on connect
        },
        onDisconnect: () => {
          this.isConnected = false;
          console.log('[SchedulerStore] Socket disconnected');
        },
        onConnectError: (err) => {
          console.error('[SchedulerStore] Connection error:', err);
          this.isConnected = false;
        }
      });

      const socket = this.wsManager.connect();

      socket.on('scheduler_status', (data: SchedulerStatus) => {
        console.log('[SchedulerStore] Received status update:', data);
        this.status = data;
      });

      socket.on('update_logs', (data: { logs: any[] }) => {
        console.log('[SchedulerStore] Received logs:', data);
        if (data && data.logs) {
          data.logs.forEach(log => {
            if (log.task_name === 'update_daily_data') {
              this.last_update_times.daily_data = log.last_update;
            } else if (log.task_name === 'update_stock_list') {
              this.last_update_times.stock_list = log.last_update;
            }
          });
        }
      });

      socket.on('update_progress', (data: any) => {
        if (data && data.task) {
          this.taskStatus[data.task] = { ...this.taskStatus[data.task], ...data };
        }
      });

      socket.on('update_complete', (data: any) => {
        if (data && data.task) {
          this.taskStatus[data.task] = { ...this.taskStatus[data.task], ...data };
        }
      });
      
      socket.on('update_error', (data: any) => {
        if (data && data.task) {
           this.taskStatus[data.task] = {
            current_date_progress: 0,
            message: data.message,
            success: false,
          };
        }
      });

      // New listeners for generic job status
      socket.on('job_status', (data: any) => {
        // Example data: { job_name: 'candidate_pool', status: 'started', message: '...' }
        //              { job_name: 'candidate_pool', status: 'completed', message: '...', data: {...} }
        //              { job_name: 'candidate_pool', status: 'failed', message: '...' }
        console.log(`[SchedulerStore] Received job_status for ${data.job_name}:`, data);
        if (data && data.job_name) {
          const status = this.taskStatus[data.job_name] || {};
          status.message = data.message;
          if (data.status === 'started') {
            status.current_date_progress = 0;
            status.success = undefined; // Reset success state
          } else if (data.status === 'completed') {
            status.current_date_progress = 100;
            status.success = true;
          } else if (data.status === 'failed') {
            status.current_date_progress = 0;
            status.success = false;
          }
           if (data.data) {
            status.data = data.data;
          }
          this.taskStatus[data.job_name] = status;
        }
      });

      socket.on('job_progress', (data: any) => {
        // Example data: { job_name: 'candidate_pool', progress: 10, total: 100, message: '...' }
        console.log(`[SchedulerStore] Received job_progress for ${data.job_name}:`, data);
        if (data && data.job_name) {
          const status = this.taskStatus[data.job_name] || {};
          if (data.total > 0) {
            status.current_date_progress = Math.round((data.progress / data.total) * 100);
          }
          status.message = data.message;
          this.taskStatus[data.job_name] = status;
        }
      });
    },

    disconnect() {
      this.wsManager?.disconnect();
    },

    requestStatusUpdate() {
      if (this.socket?.connected) {
        this.socket.emit('request_status_update');
      } else {
        console.warn('[SchedulerStore] Cannot request status update, socket not connected.');
      }
    }
  },
}); 