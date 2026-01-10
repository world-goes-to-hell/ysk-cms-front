<script setup lang="ts">
</script>

<template>
  <div class="about">
    <div class="about-container">
      <h1>YSK CMS 소개</h1>
      <p class="lead">
        YSK CMS는 현대적이고 유연한 콘텐츠 관리 시스템입니다.
      </p>

      <section class="section">
        <h2>우리의 비전</h2>
        <p>
          누구나 쉽게 콘텐츠를 관리하고 공유할 수 있는 플랫폼을 만들고자 합니다.
          복잡한 기술 지식 없이도 강력한 기능을 활용할 수 있도록 설계되었습니다.
        </p>
      </section>

      <section class="section">
        <h2>기술 스택</h2>
        <div class="tech-grid">
          <div class="tech-item">Vue 3</div>
          <div class="tech-item">TypeScript</div>
          <div class="tech-item">Spring Boot</div>
          <div class="tech-item">PostgreSQL</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about {
  padding: 64px 24px;
}

.about-container {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 40px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.lead {
  font-size: 20px;
  color: #6b7280;
  margin: 0 0 48px 0;
}

.section {
  margin-bottom: 48px;
}

.section h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.section p {
  font-size: 16px;
  color: #4b5563;
  line-height: 1.8;
  margin: 0;
}

.tech-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tech-item {
  background: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
</style>
