<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Feature {
  icon: string
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: 'edit',
    title: '직관적인 콘텐츠 편집',
    description: '드래그 앤 드롭으로 손쉽게 콘텐츠를 구성하고, 실시간 미리보기로 결과를 즉시 확인하세요.',
    color: 'indigo'
  },
  {
    icon: 'users',
    title: '권한 기반 사용자 관리',
    description: '세분화된 역할과 권한 시스템으로 팀원들의 접근 권한을 효과적으로 관리하세요.',
    color: 'cyan'
  },
  {
    icon: 'chart',
    title: '실시간 분석 대시보드',
    description: '방문자 통계, 콘텐츠 성과, 사용자 행동을 한눈에 파악하고 인사이트를 얻으세요.',
    color: 'purple'
  },
  {
    icon: 'bolt',
    title: '초고속 성능',
    description: '최적화된 캐싱과 CDN을 통해 어디서든 빠른 로딩 속도를 경험하세요.',
    color: 'amber'
  },
  {
    icon: 'shield',
    title: '엔터프라이즈급 보안',
    description: 'SSL 암호화, 2FA 인증, 정기적인 보안 업데이트로 데이터를 안전하게 보호합니다.',
    color: 'emerald'
  },
  {
    icon: 'puzzle',
    title: '무한한 확장성',
    description: 'API와 플러그인 시스템으로 필요한 기능을 자유롭게 추가하고 커스터마이즈하세요.',
    color: 'rose'
  }
]

const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const checkVisibility = () => {
  if (!sectionRef.value) return

  const rect = sectionRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight

  if (rect.top < windowHeight * 0.75) {
    isVisible.value = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', checkVisibility)
  checkVisibility()
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkVisibility)
})
</script>

<template>
  <section ref="sectionRef" class="features" :class="{ 'is-visible': isVisible }">
    <div class="features__container">
      <!-- Header -->
      <div class="features__header">
        <span class="features__label">주요 기능</span>
        <h2 class="features__title">
          성공적인 웹사이트를 위한<br />
          <span class="features__title-gradient">모든 도구를 제공합니다</span>
        </h2>
        <p class="features__description">
          복잡한 설정 없이 바로 시작하세요. 필요한 모든 기능이 이미 준비되어 있습니다.
        </p>
      </div>

      <!-- Grid -->
      <div class="features__grid">
        <article
          v-for="(feature, index) in features"
          :key="feature.title"
          class="feature-card"
          :class="`feature-card--${feature.color}`"
          :style="{ '--delay': `${index * 100}ms` }"
        >
          <div class="feature-card__icon-wrapper">
            <div class="feature-card__icon">
              <!-- Edit Icon -->
              <svg v-if="feature.icon === 'edit'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <!-- Users Icon -->
              <svg v-else-if="feature.icon === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <!-- Chart Icon -->
              <svg v-else-if="feature.icon === 'chart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
              <!-- Bolt Icon -->
              <svg v-else-if="feature.icon === 'bolt'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <!-- Shield Icon -->
              <svg v-else-if="feature.icon === 'shield'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <!-- Puzzle Icon -->
              <svg v-else-if="feature.icon === 'puzzle'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
              </svg>
            </div>
            <div class="feature-card__glow"></div>
          </div>

          <h3 class="feature-card__title">{{ feature.title }}</h3>
          <p class="feature-card__description">{{ feature.description }}</p>

          <div class="feature-card__link">
            <span>자세히 보기</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: var(--space-24) var(--space-6);
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
}

.features::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
}

.features__container {
  max-width: var(--container-xl);
  margin: 0 auto;
}

/* Header */
.features__header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto var(--space-16);
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s var(--ease-out);
}

.features.is-visible .features__header {
  opacity: 1;
  transform: translateY(0);
}

.features__label {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-primary-600);
  background: var(--color-primary-50);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-4);
}

html.dark .features__label {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary-400);
}

.features__title {
  font-size: clamp(1.875rem, 4vw, 2.5rem);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-4);
}

.features__title-gradient {
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features__description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* Grid */
.features__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

/* Feature Card */
.feature-card {
  position: relative;
  padding: var(--space-8);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-2xl);
  transition: all var(--transition-normal) var(--ease-out);
  opacity: 0;
  transform: translateY(30px);
  cursor: pointer;
}

.features.is-visible .feature-card {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--delay);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: transparent;
}

/* Color variants */
.feature-card--indigo { --card-color: var(--color-primary-500); --card-bg: var(--color-primary-50); }
.feature-card--cyan { --card-color: var(--color-secondary-500); --card-bg: var(--color-secondary-50); }
.feature-card--purple { --card-color: var(--color-accent-500); --card-bg: var(--color-accent-50); }
.feature-card--amber { --card-color: #f59e0b; --card-bg: #fffbeb; }
.feature-card--emerald { --card-color: #10b981; --card-bg: #ecfdf5; }
.feature-card--rose { --card-color: #f43f5e; --card-bg: #fff1f2; }

html.dark .feature-card--indigo { --card-bg: rgba(99, 102, 241, 0.1); }
html.dark .feature-card--cyan { --card-bg: rgba(6, 182, 212, 0.1); }
html.dark .feature-card--purple { --card-bg: rgba(168, 85, 247, 0.1); }
html.dark .feature-card--amber { --card-bg: rgba(245, 158, 11, 0.1); }
html.dark .feature-card--emerald { --card-bg: rgba(16, 185, 129, 0.1); }
html.dark .feature-card--rose { --card-bg: rgba(244, 63, 94, 0.1); }

/* Icon */
.feature-card__icon-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-5);
}

.feature-card__icon {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  color: var(--card-color);
  transition: all var(--transition-normal);
}

.feature-card__icon svg {
  width: 28px;
  height: 28px;
}

.feature-card:hover .feature-card__icon {
  background: var(--card-color);
  color: white;
  transform: scale(1.05);
}

.feature-card__glow {
  position: absolute;
  inset: -10px;
  background: var(--card-color);
  border-radius: var(--radius-2xl);
  opacity: 0;
  filter: blur(20px);
  transition: opacity var(--transition-normal);
}

.feature-card:hover .feature-card__glow {
  opacity: 0.15;
}

/* Title */
.feature-card__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

/* Description */
.feature-card__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-5);
}

/* Link */
.feature-card__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--card-color);
  opacity: 0;
  transform: translateX(-10px);
  transition: all var(--transition-fast);
}

.feature-card__link svg {
  width: 16px;
  height: 16px;
  transition: transform var(--transition-fast);
}

.feature-card:hover .feature-card__link {
  opacity: 1;
  transform: translateX(0);
}

.feature-card:hover .feature-card__link svg {
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 1024px) {
  .features__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .features {
    padding: var(--space-16) var(--space-4);
  }

  .features__header {
    margin-bottom: var(--space-10);
  }

  .features__grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .feature-card {
    padding: var(--space-6);
  }
}
</style>
