<template>
  <div class="navbar">
    <div class="hamburger-container" @click="toggleSideBar">
      <el-button type="text">
        {{ sidebar.opened ? '收起' : '展开' }}
      </el-button>
    </div>

    <div class="breadcrumb-container">
      <span class="title">股票回测系统</span>
    </div>

    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <img src="/favicon.svg" class="user-avatar">
          <span>管理员</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/">
              <el-dropdown-item>首页</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">
              <span style="display:block;">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../store/modules/app'

const appStore = useAppStore()

const sidebar = computed(() => appStore.sidebar)

const toggleSideBar = () => {
  appStore.toggleSideBar()
}

const logout = () => {
  console.log('退出登录')
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .hamburger-container {
    flex-shrink: 0;
  }

  .breadcrumb-container {
    flex: 1;
    margin-left: 20px;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .right-menu {
    display: flex;
    align-items: center;

    .avatar-container {
      .avatar-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 4px;
        transition: background-color 0.3s;

        &:hover {
          background-color: #f5f7fa;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          margin-right: 8px;
        }
      }
    }
  }
}
</style> 