import { defineStore } from 'pinia'
import { Socket } from 'socket.io-client'
import { createWebSocketManager, WebSocketManager } from '@/utils/websocketManager'
import type { SchedulerJob, TaskStatus } from '@/types/api'

// Define the structure for the scheduler status
export interface SchedulerStatus {
  is_running: boolean
  jobs_count: number
  jobs: SchedulerJob[]
  current_time: string
}

export interface SchedulerState {
  socket: Socket | null
  wsManager: WebSocketManager | null
  isConnected: boolean
  status: SchedulerStatus
  taskStatus: Record<string, TaskStatus>
  last_update_times: {
    daily_data?: string
    stock_list?: string
    smart_data?: string
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
      // 如果已经连接，先断开
      if (this.wsManager?.isConnected) {
        this.disconnect();
      }

      // 重置任务状态，确保页面刷新后不会保留旧状态
      this.taskStatus = {};

      this.wsManager = createWebSocketManager({
        url: VITE_API_BASE_URL,
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        connectionName: 'scheduler',
        namespace: '/scheduler',
        onConnect: (socket) => {
          this.socket = socket;
          this.isConnected = true;
          console.log('[SchedulerStore] Socket connected:', socket.id);
          
          // 在连接成功后设置事件监听器
          this.setupEventListeners(socket);
          
          this.requestStatusUpdate(); // Request initial status on connect
          this.checkRunningTasks(); // Check for running tasks
        },
        onDisconnect: () => {
          this.isConnected = false;
          console.log('[SchedulerStore] Socket disconnected');
        },
        onConnectError: (err) => {
          console.error('[SchedulerStore] Connection error:', err);
          this.isConnected = false;
        },
        onReconnect: (attemptNumber) => {
          console.log(`[SchedulerStore] Socket reconnected after ${attemptNumber} attempts`);
          // 重连成功后，重新设置事件监听器
          if (this.socket) {
            this.setupEventListeners(this.socket);
            this.requestStatusUpdate();
            this.checkRunningTasks();
          }
        },
        onReconnectAttempt: (attemptNumber) => {
          console.log(`[SchedulerStore] Socket reconnection attempt ${attemptNumber}`);
        },
        onReconnectFailed: () => {
          console.error('[SchedulerStore] Socket reconnection failed');
          // 重连失败时，尝试强制重新连接
          setTimeout(() => {
            if (this.wsManager) {
              this.wsManager.forceReconnect();
            }
          }, 2000);
        }
      });

      this.wsManager.connect();
    },

    // 设置事件监听器
    setupEventListeners(socket: any) {
      // 先移除所有现有的事件监听器，防止重复监听
      socket.off('scheduler_status');
      socket.off('update_logs');
      socket.off('update_progress');
      socket.off('update_complete');
      socket.off('update_error');
      socket.off('job_status');
      socket.off('job_progress');

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
            } else if (log.task_name === 'update_daily_data_smart') {
              this.last_update_times.smart_data = log.last_update;
            }
          });
        }
      });

      socket.on('update_progress', (data: any) => {
        if (data && data.task) {
          // 将 progress 字段映射到 current_date_progress
          const mappedData = {
            ...data,
            current_date_progress: data.progress || data.current_date_progress || 0
          };
          
          // 更新任务状态，保留现有数据
          this.taskStatus[data.task] = { 
            ...this.taskStatus[data.task], 
            ...mappedData 
          };
          
          console.log(`[SchedulerStore] Progress update for ${data.task}:`, mappedData);
        }
      });

      socket.on('update_complete', (data: any) => {
        if (data && data.task) {
          // 将 progress 字段映射到 current_date_progress
          const mappedData = {
            ...data,
            current_date_progress: data.progress || data.current_date_progress || 100,
            success: data.success !== undefined ? data.success : true // 确保设置成功状态
          };
          this.taskStatus[data.task] = { ...this.taskStatus[data.task], ...mappedData };
          console.log(`[SchedulerStore] Task completed: ${data.task}`, mappedData);
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
            // 触发任务完成事件
            this.$patch((state) => {
              state.taskStatus[data.job_name] = status;
            });
            // 发出自定义事件，通知组件任务完成
            window.dispatchEvent(new CustomEvent('job_completed', {
              detail: { job_name: data.job_name, data }
            }));
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
          
          // 检查progress是否已经是百分比（大于1）
          if (data.progress > 1) {
            // progress已经是百分比，直接使用
            status.current_date_progress = Math.round(data.progress);
          } else if (data.total > 0) {
            // progress是分子，需要计算百分比
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
    },

    checkRunningTasks() {
      if (this.socket?.connected) {
        // 请求检查正在运行的任务
        this.socket.emit('check_running_tasks');
        console.log('[SchedulerStore] Requested check for running tasks');
      } else {
        console.warn('[SchedulerStore] Cannot check running tasks, socket not connected.');
      }
    }
  },
}); 