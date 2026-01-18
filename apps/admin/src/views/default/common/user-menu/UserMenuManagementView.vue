<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import * as userMenuApi from '@/api/userMenu'
import * as contentsApi from '@/api/contents'
import * as roleApi from '@/api/role'
import type { UserMenuItem, UserMenuCreateRequest, UserMenuUpdateRequest, UserMenuSortItem } from '@/types/userMenu'
import type { ContentsListDto } from '@/types/contents'
import type { Role } from '@/api/role'
import UserMenuTreeItem from '@/components/user-menu/UserMenuTreeItem.vue'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  return (route.params.siteId as string) || 'main'
})

// 상태
const loading = ref(false)
const saving = ref(false)
const menuTree = ref<UserMenuItem[]>([])
const expandedKeys = ref<Set<number>>(new Set())
const hasChanges = ref(false)

// 모달 상태
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingMenu = ref<UserMenuItem | null>(null)
const parentMenu = ref<UserMenuItem | null>(null)
const editingParentId = ref<number | null>(null) // 수정 시 현재 부모 ID 유지

// 컨텐츠 연동 상태
const contentsList = ref<ContentsListDto[]>([])
const loadingContents = ref(false)
const selectedContentsId = ref<number | null>(null)

// 권한 상태
const rolesList = ref<Role[]>([])
const loadingRoles = ref(false)
const selectedRoleIds = ref<number[]>([])

// 폼 데이터
const formData = ref<UserMenuCreateRequest>({
  name: '',
  code: '',
  type: 'INTERNAL',
  url: '',
  icon: '',
  status: 'ACTIVE',
  target: '_self',
  description: '',
})

// 메뉴 타입 옵션
const menuTypes = [
  { value: 'DIRECTORY', label: '디렉토리', description: '하위 메뉴를 가지는 폴더' },
  { value: 'INTERNAL', label: '내부 링크', description: '사이트 내부 페이지' },
  { value: 'EXTERNAL', label: '외부 링크', description: '외부 사이트' },
  { value: 'BOARD', label: '게시판', description: '게시판 페이지' },
  { value: 'PAGE', label: '정적 페이지', description: '정적 페이지' },
]

// 상태 옵션
const statusOptions = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
]

// 메뉴 타입별 아이콘
const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    DIRECTORY: 'mdi-folder-outline',
    INTERNAL: 'mdi-link',
    EXTERNAL: 'mdi-open-in-new',
    BOARD: 'mdi-bulletin-board',
    PAGE: 'mdi-file-document-outline',
  }
  return icons[type] || 'mdi-help'
}


// 메뉴 불러오기
const fetchMenus = async () => {
  loading.value = true
  try {
    const response = await userMenuApi.getUserMenuTree(currentSiteCode.value)
    menuTree.value = response.data.data
    // 기본적으로 전체 접기 상태
    expandedKeys.value.clear()
  } catch (error) {
    ElMessage.error('메뉴를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 권한 목록 불러오기
const fetchRoles = async () => {
  if (rolesList.value.length > 0) return // 이미 로드됨
  loadingRoles.value = true
  try {
    const response = await roleApi.getRoles()
    if (response.data.success && response.data.data) {
      rolesList.value = response.data.data
    }
  } catch (error) {
    console.error('권한 목록 조회 실패:', error)
  } finally {
    loadingRoles.value = false
  }
}

// 발행된 컨텐츠 목록 불러오기
const fetchPublishedContents = async () => {
  loadingContents.value = true
  try {
    const response = await contentsApi.getPublishedContents(currentSiteCode.value)
    if (response.data.success && response.data.data) {
      contentsList.value = response.data.data
    }
  } catch (error) {
    console.error('컨텐츠 목록 조회 실패:', error)
  } finally {
    loadingContents.value = false
  }
}

// 컨텐츠 선택 시 URL 자동 설정
const onContentsSelect = (contentsId: number | null) => {
  selectedContentsId.value = contentsId
  if (contentsId) {
    const selected = contentsList.value.find(c => c.id === contentsId)
    if (selected) {
      formData.value.url = `/page/${selected.slug}`
      // 메뉴 이름이 비어있으면 컨텐츠 제목으로 자동 설정
      if (!formData.value.name) {
        formData.value.name = selected.title
      }
    }
  }
}

// 메뉴 타입 변경 시 컨텐츠 목록 로드
watch(() => formData.value.type, (newType) => {
  if (newType === 'PAGE' && contentsList.value.length === 0) {
    fetchPublishedContents()
  }
  // 타입이 PAGE가 아니면 컨텐츠 선택 초기화
  if (newType !== 'PAGE') {
    selectedContentsId.value = null
  }
})

// 메뉴 펼침/접힘
const toggleExpand = (menuId: number) => {
  if (expandedKeys.value.has(menuId)) {
    expandedKeys.value.delete(menuId)
  } else {
    expandedKeys.value.add(menuId)
  }
}

const isExpanded = (menuId: number) => expandedKeys.value.has(menuId)

// 모든 메뉴 펼치기/접기
const expandAll = () => {
  const collectIds = (items: UserMenuItem[]) => {
    items.forEach((item) => {
      expandedKeys.value.add(item.id)
      if (item.children?.length) {
        collectIds(item.children)
      }
    })
  }
  collectIds(menuTree.value)
}

const collapseAll = () => {
  expandedKeys.value.clear()
}

// 메뉴가 모두 펼쳐져 있는지 확인
const isAllExpanded = computed(() => {
  const countExpandable = (items: UserMenuItem[]): number => {
    let count = 0
    items.forEach((item) => {
      if (item.children?.length) {
        count++
        count += countExpandable(item.children)
      }
    })
    return count
  }
  const expandableCount = countExpandable(menuTree.value)
  return expandableCount > 0 && expandedKeys.value.size >= expandableCount
})

// 전체 펼치기/접기 토글
const toggleExpandAll = () => {
  if (isAllExpanded.value) {
    collapseAll()
  } else {
    expandAll()
  }
}

// 메뉴의 부모 ID 찾기
const findParentId = (targetId: number, items: UserMenuItem[], parentId: number | null = null): number | null | undefined => {
  for (const item of items) {
    if (item.id === targetId) {
      return parentId
    }
    if (item.children?.length) {
      const found = findParentId(targetId, item.children, item.id)
      if (found !== undefined) {
        return found
      }
    }
  }
  return undefined // not found in this branch
}

// 새 메뉴 추가 다이얼로그
const openCreateDialog = async (parent?: UserMenuItem) => {
  dialogMode.value = 'create'
  parentMenu.value = parent || null
  editingMenu.value = null
  editingParentId.value = null
  selectedContentsId.value = null
  selectedRoleIds.value = []
  formData.value = {
    name: '',
    code: '',
    type: parent ? 'INTERNAL' : 'DIRECTORY',
    url: '',
    icon: '',
    status: 'ACTIVE',
    target: '_self',
    description: '',
  }
  // 권한 목록 로드
  await fetchRoles()
  dialogVisible.value = true
}

// 메뉴 수정 다이얼로그
const openEditDialog = async (menu: UserMenuItem) => {
  dialogMode.value = 'edit'
  editingMenu.value = menu
  parentMenu.value = null
  // 현재 부모 ID 찾아서 저장 (수정 시 구조 유지를 위해)
  editingParentId.value = findParentId(menu.id, menuTree.value)
  selectedContentsId.value = null
  // 기존 권한 설정
  selectedRoleIds.value = menu.roles ? menu.roles.map(r => r.id) : []
  formData.value = {
    name: menu.name,
    code: menu.code,
    type: menu.type,
    url: menu.url || '',
    icon: menu.icon || '',
    status: menu.status,
    target: menu.target || '_self',
    description: menu.description || '',
  }

  // 권한 목록 로드
  await fetchRoles()

  // PAGE 타입이면 컨텐츠 목록 로드 후 URL로 매칭된 컨텐츠 선택
  if (menu.type === 'PAGE' && menu.url) {
    if (contentsList.value.length === 0) {
      await fetchPublishedContents()
    }
    // URL에서 slug 추출하여 컨텐츠 매칭 (예: /page/about -> about)
    const slugMatch = menu.url.match(/^\/page\/(.+)$/)
    if (slugMatch) {
      const slug = slugMatch[1]
      const matched = contentsList.value.find(c => c.slug === slug)
      if (matched) {
        selectedContentsId.value = matched.id
      }
    }
  }

  dialogVisible.value = true
}

// 메뉴 저장
const saveMenu = async () => {
  if (!formData.value.name) {
    ElMessage.warning('메뉴 이름을 입력해주세요.')
    return
  }

  // PAGE 타입인데 컨텐츠를 선택하지 않았고 URL도 없는 경우 경고
  if (formData.value.type === 'PAGE' && !selectedContentsId.value && !formData.value.url) {
    ElMessage.warning('컨텐츠를 선택하거나 URL을 입력해주세요.')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      const request: UserMenuCreateRequest = {
        ...formData.value,
        parentId: parentMenu.value?.id,
        roleIds: selectedRoleIds.value.length > 0 ? selectedRoleIds.value : undefined,
      }
      await userMenuApi.createUserMenu(currentSiteCode.value, request)
      ElMessage.success('메뉴가 생성되었습니다.')
    } else if (editingMenu.value) {
      const request: UserMenuUpdateRequest = {
        ...formData.value,
        parentId: editingParentId.value ?? null, // 기존 부모 구조 유지 (undefined일 경우 null로 처리)
        roleIds: selectedRoleIds.value,
      }
      await userMenuApi.updateUserMenu(currentSiteCode.value, editingMenu.value.id, request)
      ElMessage.success('메뉴가 수정되었습니다.')
    }
    dialogVisible.value = false
    await fetchMenus()
  } catch (error) {
    ElMessage.error('저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// 메뉴 삭제
const deleteMenu = async (menu: UserMenuItem) => {
  try {
    await ElMessageBox.confirm(
      `"${menu.name}" 메뉴를 삭제하시겠습니까?${menu.children?.length ? '\n하위 메뉴도 함께 삭제됩니다.' : ''}`,
      '메뉴 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )
    await userMenuApi.deleteUserMenu(currentSiteCode.value, menu.id)
    ElMessage.success('메뉴가 삭제되었습니다.')
    await fetchMenus()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

// 드래그 변경 처리
const onDragChange = () => {
  hasChanges.value = true
}

// 순서 저장
const saveOrder = async () => {
  saving.value = true
  try {
    const items: UserMenuSortItem[] = []
    let order = 0

    const collectItems = (menus: UserMenuItem[], parentId: number | null) => {
      menus.forEach((menu) => {
        items.push({
          id: menu.id,
          parentId: parentId,
          sortOrder: order++,
        })
        if (menu.children?.length) {
          collectItems(menu.children, menu.id)
        }
      })
    }

    collectItems(menuTree.value, null)

    await userMenuApi.sortUserMenus(currentSiteCode.value, { items })
    ElMessage.success('순서가 저장되었습니다.')
    hasChanges.value = false
    await fetchMenus()
  } catch (error) {
    ElMessage.error('순서 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// 순서 변경 취소
const cancelOrder = async () => {
  hasChanges.value = false
  await fetchMenus()
}

onMounted(() => {
  fetchMenus()
})
</script>

<template>
  <div class="user-menu-management">
    <!-- 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title-row">
          <div class="page-icon">
            <i class="mdi mdi-sitemap"></i>
          </div>
          <div>
            <h1 class="page-title">사용자 메뉴 관리</h1>
            <p class="page-description">사용자 사이트의 메뉴를 관리합니다. 드래그하여 순서를 변경할 수 있습니다.</p>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="header-btn toggle"
          :class="{ expanded: isAllExpanded }"
          @click="toggleExpandAll"
        >
          <i class="mdi" :class="isAllExpanded ? 'mdi-unfold-less-horizontal' : 'mdi-unfold-more-horizontal'"></i>
          <span>{{ isAllExpanded ? '모두 접기' : '모두 펼치기' }}</span>
        </button>
        <button class="header-btn primary" @click="openCreateDialog()">
          <i class="mdi mdi-plus"></i>
          <span>새 메뉴 추가</span>
        </button>
      </div>
    </div>

    <!-- 변경 사항 알림 -->
    <transition name="fade">
      <div v-if="hasChanges" class="changes-bar">
        <span><i class="mdi mdi-alert-circle"></i> 순서가 변경되었습니다. 저장하시겠습니까?</span>
        <div class="changes-actions">
          <el-button size="small" @click="cancelOrder">취소</el-button>
          <el-button size="small" type="primary" :loading="saving" @click="saveOrder">
            순서 저장
          </el-button>
        </div>
      </div>
    </transition>

    <!-- 메뉴 트리 -->
    <div class="menu-tree-container" v-loading="loading">
      <div v-if="menuTree.length === 0 && !loading" class="empty-state">
        <i class="mdi mdi-sitemap"></i>
        <p>등록된 메뉴가 없습니다.</p>
        <el-button type="primary" @click="openCreateDialog()">첫 메뉴 추가</el-button>
      </div>

      <draggable
        v-else
        v-model="menuTree"
        group="user-menus"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost"
        @change="onDragChange"
        class="menu-tree"
      >
        <template #item="{ element: menu, index }">
          <UserMenuTreeItem
            :menu="menu"
            :depth="0"
            :expanded-keys="expandedKeys"
            :menu-types="menuTypes"
            @toggle-expand="toggleExpand"
            @open-create-dialog="openCreateDialog"
            @open-edit-dialog="openEditDialog"
            @delete-menu="deleteMenu"
            @drag-change="onDragChange"
            @update:children="(children) => { menuTree[index] = { ...menuTree[index], children }; onDragChange() }"
          />
        </template>
      </draggable>
    </div>

    <!-- 메뉴 추가/수정 다이얼로그 -->
    <el-dialog
      v-model="dialogVisible"
      width="680px"
      :close-on-click-modal="false"
      class="menu-dialog"
      :show-close="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-icon" :class="dialogMode">
            <i class="mdi" :class="dialogMode === 'create' ? 'mdi-plus' : 'mdi-pencil'"></i>
          </div>
          <div class="dialog-header-text">
            <h3>{{ dialogMode === 'create' ? '새 메뉴 추가' : '메뉴 수정' }}</h3>
            <p v-if="dialogMode === 'create' && parentMenu">
              <i class="mdi mdi-subdirectory-arrow-right"></i>
              {{ parentMenu.name }}의 하위 메뉴
            </p>
            <p v-else-if="dialogMode === 'edit' && editingMenu">
              {{ editingMenu.name }} 메뉴 정보를 수정합니다
            </p>
          </div>
          <button class="dialog-close-btn" @click="dialogVisible = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
      </template>

      <div class="dialog-body">
        <!-- 아이콘 미리보기 -->
        <div class="icon-preview-section">
          <div class="icon-preview" :class="{ 'has-icon': formData.icon }">
            <i v-if="formData.icon" :class="['mdi', formData.icon]"></i>
            <i v-else class="mdi mdi-sitemap"></i>
          </div>
          <div class="icon-preview-info">
            <span class="preview-name">{{ formData.name || '메뉴 이름' }}</span>
            <span class="preview-type" :class="formData.type.toLowerCase()">
              {{ menuTypes.find((t) => t.value === formData.type)?.label }}
            </span>
          </div>
        </div>

        <!-- 기본 정보 섹션 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-information-outline"></i>
            기본 정보
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label class="field-label required">메뉴 이름</label>
              <el-input
                v-model="formData.name"
                placeholder="예: 회사소개"
                size="large"
              >
                <template #prefix>
                  <i class="mdi mdi-format-title"></i>
                </template>
              </el-input>
            </div>
            <div class="form-field">
              <label class="field-label">메뉴 코드</label>
              <el-input
                v-model="formData.code"
                placeholder="예: about"
                size="large"
              >
                <template #prefix>
                  <i class="mdi mdi-code-tags"></i>
                </template>
              </el-input>
            </div>
          </div>
        </div>

        <!-- 메뉴 타입 섹션 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-shape-outline"></i>
            메뉴 타입
          </div>
          <div class="menu-type-grid">
            <div
              v-for="type in menuTypes"
              :key="type.value"
              class="menu-type-card"
              :class="{ active: formData.type === type.value }"
              @click="formData.type = type.value"
            >
              <i class="mdi" :class="getTypeIcon(type.value)"></i>
              <span class="type-label">{{ type.label }}</span>
              <span class="type-desc">{{ type.description }}</span>
            </div>
          </div>
        </div>

        <!-- URL 입력 (DIRECTORY가 아닌 경우) -->
        <div v-if="formData.type !== 'DIRECTORY'" class="form-section">
          <div class="section-title">
            <i class="mdi mdi-link-variant"></i>
            링크 설정
          </div>

          <!-- PAGE 타입: 컨텐츠 선택 -->
          <div v-if="formData.type === 'PAGE'" class="form-field">
            <label class="field-label">컨텐츠 연동</label>
            <div class="contents-select-wrapper" v-loading="loadingContents">
              <el-select
                v-model="selectedContentsId"
                placeholder="등록된 컨텐츠를 선택하세요"
                size="large"
                clearable
                filterable
                style="width: 100%"
                @change="onContentsSelect"
              >
                <el-option
                  v-for="content in contentsList"
                  :key="content.id"
                  :value="content.id"
                  :label="content.title"
                >
                  <div class="contents-option">
                    <span class="contents-option-title">{{ content.title }}</span>
                    <span class="contents-option-slug">/{{ content.slug }}</span>
                  </div>
                </el-option>
              </el-select>
              <div v-if="contentsList.length === 0 && !loadingContents" class="no-contents-hint">
                <i class="mdi mdi-information-outline"></i>
                <span>발행된 컨텐츠가 없습니다. 컨텐츠 관리에서 먼저 페이지를 등록해주세요.</span>
              </div>
            </div>
          </div>

          <!-- URL 직접 입력 -->
          <div class="form-field" :style="{ marginTop: formData.type === 'PAGE' ? '16px' : '0' }">
            <label class="field-label">
              {{ formData.type === 'PAGE' ? 'URL 직접 입력 (선택)' : 'URL 경로' }}
            </label>
            <el-input
              v-model="formData.url"
              :placeholder="formData.type === 'PAGE' ? '컨텐츠 선택 시 자동 설정됩니다' : '/about 또는 https://example.com'"
              size="large"
              :disabled="formData.type === 'PAGE' && !!selectedContentsId"
            >
              <template #prefix>
                <i class="mdi mdi-web"></i>
              </template>
            </el-input>
            <div v-if="formData.type === 'PAGE' && selectedContentsId" class="url-auto-hint">
              <i class="mdi mdi-check-circle"></i>
              <span>컨텐츠에서 URL이 자동 설정되었습니다</span>
            </div>
          </div>

          <div v-if="formData.type === 'EXTERNAL'" class="form-field" style="margin-top: 12px">
            <label class="field-label">링크 타겟</label>
            <div class="target-options">
              <div
                class="target-option"
                :class="{ active: formData.target === '_self' }"
                @click="formData.target = '_self'"
              >
                <i class="mdi mdi-arrow-right"></i>
                <span>현재 창</span>
              </div>
              <div
                class="target-option"
                :class="{ active: formData.target === '_blank' }"
                @click="formData.target = '_blank'"
              >
                <i class="mdi mdi-open-in-new"></i>
                <span>새 창</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 권한 선택 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-shield-account-outline"></i>
            접근 권한
          </div>
          <div class="roles-select-wrapper" v-loading="loadingRoles">
            <el-select
              v-model="selectedRoleIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="권한을 선택하세요 (미선택 시 전체 공개)"
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="role in rolesList"
                :key="role.id"
                :value="role.id"
                :label="role.name"
              >
                <div class="role-option">
                  <span class="role-option-name">{{ role.name }}</span>
                  <span v-if="role.description" class="role-option-desc">{{ role.description }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="roles-hint">
              <i class="mdi mdi-information-outline"></i>
              <span>권한을 선택하지 않으면 모든 사용자가 이 메뉴에 접근할 수 있습니다.</span>
            </div>
          </div>
        </div>

        <!-- 상태 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-toggle-switch-outline"></i>
            메뉴 상태
          </div>
          <div class="status-toggle-large">
            <div
              class="status-option-large"
              :class="{ active: formData.status === 'ACTIVE' }"
              @click="formData.status = 'ACTIVE'"
            >
              <i class="mdi mdi-check-circle"></i>
              <div class="status-text">
                <span class="status-label">활성</span>
                <span class="status-desc">메뉴가 사용자에게 표시됩니다</span>
              </div>
            </div>
            <div
              class="status-option-large inactive"
              :class="{ active: formData.status === 'INACTIVE' }"
              @click="formData.status = 'INACTIVE'"
            >
              <i class="mdi mdi-close-circle"></i>
              <div class="status-text">
                <span class="status-label">비활성</span>
                <span class="status-desc">메뉴가 숨겨집니다</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 설명 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-text"></i>
            설명 (선택사항)
          </div>
          <div class="form-field">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="메뉴에 대한 설명을 입력하세요"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="dialogVisible = false">
            <i class="mdi mdi-close"></i>
            취소
          </el-button>
          <el-button type="primary" size="large" :loading="saving" @click="saveMenu">
            <i v-if="!saving" class="mdi" :class="dialogMode === 'create' ? 'mdi-plus' : 'mdi-check'"></i>
            {{ dialogMode === 'create' ? '메뉴 추가' : '변경사항 저장' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-menu-management {
  padding: 0;
}

/* ==================== */
/* 헤더 스타일 */
/* ==================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.header-btn .mdi {
  font-size: 18px;
}

.header-btn.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.header-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.header-btn.toggle {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.header-btn.toggle:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-tertiary);
}

.header-btn.toggle.expanded {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

/* 변경 사항 알림 */
.changes-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
  color: #b45309;
  font-weight: 500;
}

.changes-bar .mdi {
  margin-right: 8px;
}

.changes-actions {
  display: flex;
  gap: 8px;
}

/* ==================== */
/* 메뉴 트리 컨테이너 */
/* ==================== */
.menu-tree-container {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  color: var(--text-tertiary);
}

.empty-state .mdi {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

/* 메뉴 트리 */
.menu-tree {
  padding: 12px;
}

/* 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ==================== */
/* 다이얼로그 스타일 */
/* ==================== */

/* 다이얼로그 기본 */
:deep(.menu-dialog .el-dialog) {
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
}

:deep(.menu-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.menu-dialog .el-dialog__body) {
  padding: 0;
}

:deep(.menu-dialog .el-dialog__footer) {
  padding: 0;
}

/* 다이얼로그 헤더 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);
  border-bottom: 1px solid var(--border-color);
}

.dialog-header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 24px;
}

.dialog-header-icon.create {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.dialog-header-icon.edit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.dialog-header-text {
  flex: 1;
}

.dialog-header-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-header-text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dialog-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;
}

.dialog-close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* 다이얼로그 바디 */
.dialog-body {
  padding: 24px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

/* 아이콘 미리보기 */
.icon-preview-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.icon-preview {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 12px;
  font-size: 28px;
  color: var(--text-tertiary);
  transition: all 0.3s ease;
}

.icon-preview.has-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #10b981;
}

.icon-preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.preview-type.directory {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.preview-type.internal {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.preview-type.external {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.preview-type.board {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.preview-type.page {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

/* 폼 섹션 */
.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-title .mdi {
  font-size: 16px;
  color: #10b981;
}

/* 폼 그리드 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 폼 필드 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.field-label.required::after {
  content: ' *';
  color: #ef4444;
}

/* 메뉴 타입 그리드 */
.menu-type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.menu-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.menu-type-card:hover {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.menu-type-card.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.menu-type-card .mdi {
  font-size: 22px;
  color: var(--text-tertiary);
  transition: color 0.2s ease;
}

.menu-type-card.active .mdi {
  color: #10b981;
}

.menu-type-card .type-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.menu-type-card .type-desc {
  font-size: 10px;
  color: var(--text-tertiary);
  line-height: 1.3;
}

/* 링크 타겟 옵션 */
.target-options {
  display: flex;
  gap: 8px;
}

.target-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: var(--text-secondary);
}

.target-option:hover {
  border-color: #10b981;
}

.target-option.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.target-option .mdi {
  font-size: 18px;
}

/* 권한 선택 스타일 */
.roles-select-wrapper {
  position: relative;
}

/* 권한 select 입력창 스타일 */
.roles-select-wrapper :deep(.el-select) {
  width: 100%;
}

.roles-select-wrapper :deep(.el-select .el-input__wrapper) {
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  min-height: 44px;
  padding: 4px 12px;
}

.roles-select-wrapper :deep(.el-select .el-input__wrapper:hover) {
  border-color: #10b981;
}

.roles-select-wrapper :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

/* 선택된 태그 스타일 */
.roles-select-wrapper :deep(.el-select .el-tag) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #059669;
  border-radius: 6px;
  font-weight: 500;
  padding: 0 10px;
  height: 28px;
  line-height: 26px;
}

.roles-select-wrapper :deep(.el-select .el-tag .el-tag__close) {
  color: #059669;
  background: transparent;
}

.roles-select-wrapper :deep(.el-select .el-tag .el-tag__close:hover) {
  background: rgba(16, 185, 129, 0.2);
  color: #047857;
}

/* collapse-tags 카운터 스타일 */
.roles-select-wrapper :deep(.el-select .el-tag.el-tag--info) {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

/* placeholder 스타일 */
.roles-select-wrapper :deep(.el-select .el-input__inner) {
  color: var(--text-primary);
}

.roles-select-wrapper :deep(.el-select .el-input__inner::placeholder) {
  color: var(--text-tertiary);
}

/* 드롭다운 화살표 스타일 */
.roles-select-wrapper :deep(.el-select .el-input__suffix) {
  color: var(--text-tertiary);
}

.role-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.role-option-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary, #303133);
}

.role-option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.4;
}

.roles-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  color: #059669;
  font-size: 13px;
}

.roles-hint .mdi {
  font-size: 18px;
  flex-shrink: 0;
}

/* 상태 토글 (큰 버전) */
.status-toggle-large {
  display: flex;
  gap: 12px;
}

.status-option-large {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-option-large:hover {
  border-color: #10b981;
}

.status-option-large.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}

.status-option-large.inactive:hover {
  border-color: #6b7280;
}

.status-option-large.inactive.active {
  border-color: #6b7280;
  background: rgba(107, 114, 128, 0.08);
}

.status-option-large .mdi {
  font-size: 28px;
  color: var(--text-tertiary);
  transition: color 0.2s ease;
}

.status-option-large.active .mdi {
  color: #10b981;
}

.status-option-large.inactive.active .mdi {
  color: #6b7280;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 다이얼로그 푸터 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.dialog-footer .el-button {
  min-width: 140px;
  height: 44px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.dialog-footer .el-button .mdi {
  margin-right: 8px;
  font-size: 18px;
}

/* 취소 버튼 */
.dialog-footer .el-button:not(.el-button--primary) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.dialog-footer .el-button:not(.el-button--primary):hover {
  background: var(--bg-tertiary);
  border-color: var(--text-tertiary);
  color: var(--text-primary);
}

/* 저장/추가 버튼 */
.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.dialog-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.dialog-footer .el-button--primary:active {
  transform: translateY(0);
}

/* 인풋 스타일 */
:deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #10b981;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

:deep(.el-input__inner) {
  color: var(--text-primary);
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-tertiary);
}

:deep(.el-input__prefix) {
  color: var(--text-tertiary);
}

:deep(.el-input--large .el-input__wrapper) {
  padding: 8px 12px;
}

:deep(.el-textarea__inner) {
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

:deep(.el-textarea__inner:hover) {
  border-color: #10b981;
}

:deep(.el-textarea__inner:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* 컨텐츠 선택 스타일 */
.contents-select-wrapper {
  position: relative;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: #10b981;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

.contents-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.contents-option-title {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contents-option-slug {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.no-contents-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  color: #b45309;
  font-size: 13px;
}

.no-contents-hint .mdi {
  font-size: 18px;
}

.url-auto-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #10b981;
}

.url-auto-hint .mdi {
  font-size: 14px;
}
</style>
