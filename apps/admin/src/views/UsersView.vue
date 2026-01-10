<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
}

const users = ref<User[]>([])
const loading = ref(false)
const searchKeyword = ref('')

const handleSearch = () => {
  console.log('검색:', searchKeyword.value)
}

const handleAdd = () => {
  console.log('사용자 추가')
}
</script>

<template>
  <div class="users-page">
    <div class="page-header">
      <h2>사용자 관리</h2>
    </div>

    <!-- 검색 및 버튼 영역 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="이름 또는 이메일 검색"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="16" class="button-group">
          <el-button type="primary" @click="handleSearch">검색</el-button>
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            사용자 추가
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 사용자 테이블 -->
    <el-card>
      <el-table :data="users" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="이름" width="150" />
        <el-table-column prop="email" label="이메일" />
        <el-table-column prop="role" label="역할" width="120" />
        <el-table-column prop="createdAt" label="가입일" width="180" />
        <el-table-column label="관리" width="150" fixed="right">
          <template #default>
            <el-button type="primary" size="small" text>수정</el-button>
            <el-button type="danger" size="small" text>삭제</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 빈 데이터 안내 -->
      <el-empty v-if="users.length === 0 && !loading" description="사용자 데이터가 없습니다" />
    </el-card>
  </div>
</template>

<style scoped>
.users-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.button-group {
  text-align: right;
}
</style>
