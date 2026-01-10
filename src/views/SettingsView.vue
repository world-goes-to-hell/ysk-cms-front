<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  siteName: 'YSK CMS',
  siteDescription: 'CMS 관리 시스템',
  adminEmail: 'admin@example.com',
  itemsPerPage: 10,
})

const handleSave = () => {
  console.log('설정 저장:', form.value)
}
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h2>설정</h2>
    </div>

    <el-card>
      <el-form :model="form" label-width="140px" style="max-width: 600px">
        <el-form-item label="사이트 이름">
          <el-input v-model="form.siteName" />
        </el-form-item>

        <el-form-item label="사이트 설명">
          <el-input v-model="form.siteDescription" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="관리자 이메일">
          <el-input v-model="form.adminEmail" type="email" />
        </el-form-item>

        <el-form-item label="페이지당 항목 수">
          <el-input-number v-model="form.itemsPerPage" :min="5" :max="100" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave">저장</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}
</style>
