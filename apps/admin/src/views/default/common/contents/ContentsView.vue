<script setup lang="ts">
import { ref } from 'vue'

interface Content {
  id: number
  title: string
  category: string
  status: string
  author: string
  createdAt: string
}

const contents = ref<Content[]>([])
const loading = ref(false)
const searchKeyword = ref('')

const handleSearch = () => {
  console.log('검색:', searchKeyword.value)
}

const handleAdd = () => {
  console.log('콘텐츠 추가')
}
</script>

<template>
  <div class="contents-page">
    <div class="page-header">
      <h2>콘텐츠 관리</h2>
    </div>

    <!-- 검색 및 버튼 영역 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="제목 검색"
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
            콘텐츠 추가
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 콘텐츠 테이블 -->
    <el-card>
      <el-table :data="contents" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="제목" />
        <el-table-column prop="category" label="카테고리" width="120" />
        <el-table-column prop="status" label="상태" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'published' ? 'success' : 'info'">
              {{ scope.row.status === 'published' ? '게시됨' : '임시저장' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="작성자" width="120" />
        <el-table-column prop="createdAt" label="작성일" width="180" />
        <el-table-column label="관리" width="150" fixed="right">
          <template #default>
            <el-button type="primary" size="small" text>수정</el-button>
            <el-button type="danger" size="small" text>삭제</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 빈 데이터 안내 -->
      <el-empty v-if="contents.length === 0 && !loading" description="콘텐츠 데이터가 없습니다" />
    </el-card>
  </div>
</template>

<style scoped>
.contents-page {
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
