<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import * as menuApi from '@/api/menu'
import type { MenuItem, MenuCreateRequest, MenuUpdateRequest, MenuSortItem, RelatedRoute } from '@/types/menu'
import { viewPaths, getViewFileName } from '@/utils/viewModules'
import MenuTreeItem from '@/components/menu/MenuTreeItem.vue'

// 상태
const loading = ref(false)
const saving = ref(false)
const menuTree = ref<MenuItem[]>([])
const expandedKeys = ref<Set<number>>(new Set())
const hasChanges = ref(false)

// 모달 상태
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingMenu = ref<MenuItem | null>(null)
const parentMenu = ref<MenuItem | null>(null)
const editingParentId = ref<number | null>(null) // 수정 시 현재 부모 ID 유지

// 폼 데이터
const formData = ref<MenuCreateRequest>({
  name: '',
  code: '',
  type: 'INTERNAL',
  url: '',
  icon: '',
  status: 'ACTIVE',
  target: '_self',
  roles: '',
  description: '',
  componentPath: '',
  relatedRoutes: '',
})

// 관련 라우트 (UI용 배열)
const relatedRoutesArray = ref<RelatedRoute[]>([])

// 관련 라우트 추가
const addRelatedRoute = () => {
  relatedRoutesArray.value.push({
    path: '',
    name: '',
    componentPath: '',
  })
}

// 관련 라우트 삭제
const removeRelatedRoute = (index: number) => {
  relatedRoutesArray.value.splice(index, 1)
}

// 관련 라우트 배열을 JSON 문자열로 변환
const serializeRelatedRoutes = (): string => {
  const validRoutes = relatedRoutesArray.value.filter(
    (r) => r.path && r.name && r.componentPath
  )
  return validRoutes.length > 0 ? JSON.stringify(validRoutes) : ''
}

// JSON 문자열을 관련 라우트 배열로 파싱
const parseRelatedRoutes = (json: string | null): RelatedRoute[] => {
  if (!json) return []
  try {
    return JSON.parse(json) as RelatedRoute[]
  } catch {
    return []
  }
}

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

// 권한 옵션
const roleOptions = [
  { value: 'SUPER_ADMIN', label: '최고 관리자', color: '#ef4444' },
  { value: 'SITE_ADMIN', label: '사이트 관리자', color: '#f59e0b' },
  { value: 'CONTENT_MANAGER', label: '콘텐츠 관리자', color: '#10b981' },
  { value: 'EDITOR', label: '편집자', color: '#3b82f6' },
  { value: 'VIEWER', label: '뷰어', color: '#8b5cf6' },
]

// 선택된 역할 (배열로 관리)
const selectedRoles = ref<string[]>([])

// 역할 토글
const toggleRole = (role: string) => {
  const index = selectedRoles.value.indexOf(role)
  if (index === -1) {
    selectedRoles.value.push(role)
  } else {
    selectedRoles.value.splice(index, 1)
  }
  // formData.roles에 쉼표로 구분된 문자열로 저장
  formData.value.roles = selectedRoles.value.join(',')
}

// 역할 선택 여부 확인
const isRoleSelected = (role: string) => selectedRoles.value.includes(role)

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

// 아이콘 목록 (자주 사용되는 MDI 아이콘)
const iconOptions = [
  'mdi-view-dashboard',
  'mdi-file-document-multiple',
  'mdi-bulletin-board',
  'mdi-post',
  'mdi-file-document',
  'mdi-image-multiple',
  'mdi-cog',
  'mdi-menu',
  'mdi-account-group',
  'mdi-account',
  'mdi-shield-account',
  'mdi-server',
  'mdi-history',
  'mdi-web',
  'mdi-help-circle',
  'mdi-home',
  'mdi-folder',
  'mdi-link',
  'mdi-chart-bar',
  'mdi-bell',
]

// 메뉴 불러오기
const fetchMenus = async () => {
  loading.value = true
  try {
    const response = await menuApi.getMenuTree('main')
    menuTree.value = response.data.data
    // 기본적으로 전체 접기 상태
    expandedKeys.value.clear()
  } catch (error) {
    ElMessage.error('메뉴를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

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
  const collectIds = (items: MenuItem[]) => {
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
  const countExpandable = (items: MenuItem[]): number => {
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
const findParentId = (targetId: number, items: MenuItem[], parentId: number | null = null): number | null => {
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
  return undefined as unknown as number | null // not found in this branch
}

// 새 메뉴 추가 다이얼로그
const openCreateDialog = (parent?: MenuItem) => {
  dialogMode.value = 'create'
  parentMenu.value = parent || null
  editingMenu.value = null
  editingParentId.value = null
  selectedRoles.value = [] // 역할 초기화
  relatedRoutesArray.value = [] // 관련 라우트 초기화
  formData.value = {
    name: '',
    code: '',
    type: parent ? 'INTERNAL' : 'DIRECTORY',
    url: '',
    icon: '',
    status: 'ACTIVE',
    target: '_self',
    roles: '',
    description: '',
    componentPath: '',
    relatedRoutes: '',
  }
  dialogVisible.value = true
}

// 메뉴 수정 다이얼로그
const openEditDialog = (menu: MenuItem) => {
  dialogMode.value = 'edit'
  editingMenu.value = menu
  parentMenu.value = null
  // 현재 부모 ID 찾아서 저장 (수정 시 구조 유지를 위해)
  editingParentId.value = findParentId(menu.id, menuTree.value)
  // 역할 배열 초기화
  selectedRoles.value = menu.roles ? menu.roles.split(',').filter(r => r.trim()) : []
  // 관련 라우트 배열 초기화
  relatedRoutesArray.value = parseRelatedRoutes(menu.relatedRoutes)
  formData.value = {
    name: menu.name,
    code: menu.code,
    type: menu.type,
    url: menu.url || '',
    icon: menu.icon || '',
    status: menu.status,
    target: menu.target || '_self',
    roles: menu.roles || '',
    description: '',
    componentPath: menu.componentPath || '',
    relatedRoutes: menu.relatedRoutes || '',
  }
  dialogVisible.value = true
}

// 메뉴 저장
const saveMenu = async () => {
  if (!formData.value.name) {
    ElMessage.warning('메뉴 이름을 입력해주세요.')
    return
  }

  saving.value = true
  try {
    // 관련 라우트 직렬화
    const relatedRoutesJson = serializeRelatedRoutes()

    if (dialogMode.value === 'create') {
      const request: MenuCreateRequest = {
        ...formData.value,
        parentId: parentMenu.value?.id,
        relatedRoutes: relatedRoutesJson,
      }
      await menuApi.createMenu('main', request)
      ElMessage.success('메뉴가 생성되었습니다.')
    } else if (editingMenu.value) {
      const request: MenuUpdateRequest = {
        ...formData.value,
        parentId: editingParentId.value, // 기존 부모 구조 유지
        relatedRoutes: relatedRoutesJson,
      }
      await menuApi.updateMenu('main', editingMenu.value.id, request)
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
const deleteMenu = async (menu: MenuItem) => {
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
    await menuApi.deleteMenu('main', menu.id)
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
    const items: MenuSortItem[] = []
    let order = 0

    const collectItems = (menus: MenuItem[], parentId: number | null) => {
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

    await menuApi.sortMenus('main', { items })
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
  <div class="menu-management">
    <!-- 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title-row">
          <div class="page-icon">
            <i class="mdi mdi-menu"></i>
          </div>
          <div>
            <h1 class="page-title">메뉴 관리</h1>
            <p class="page-description">사이드바 메뉴를 관리합니다. 드래그하여 순서를 변경할 수 있습니다.</p>
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
        <i class="mdi mdi-menu"></i>
        <p>등록된 메뉴가 없습니다.</p>
        <el-button type="primary" @click="openCreateDialog()">첫 메뉴 추가</el-button>
      </div>

      <draggable
        v-else
        v-model="menuTree"
        group="menus"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost"
        @change="onDragChange"
        class="menu-tree"
      >
        <template #item="{ element: menu, index }">
          <MenuTreeItem
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
            <i v-else class="mdi mdi-menu"></i>
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
                placeholder="예: 대시보드"
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
                placeholder="예: dashboard"
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
          <div class="form-field">
            <label class="field-label">URL 경로</label>
            <el-input
              v-model="formData.url"
              placeholder="/dashboard 또는 https://example.com"
              size="large"
            >
              <template #prefix>
                <i class="mdi mdi-web"></i>
              </template>
            </el-input>
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

          <!-- 컴포넌트 선택 (INTERNAL 타입인 경우) -->
          <div v-if="formData.type !== 'EXTERNAL'" class="form-field" style="margin-top: 12px">
            <label class="field-label required">Vue 컴포넌트</label>
            <el-select
              v-model="formData.componentPath"
              placeholder="연결할 컴포넌트를 선택하세요"
              size="large"
              filterable
              clearable
              style="width: 100%"
              popper-class="component-select-dropdown"
            >
              <el-option
                v-for="path in viewPaths"
                :key="path"
                :label="path"
                :value="path"
              >
                <div class="component-option">
                  <span class="component-name">{{ getViewFileName(path) }}</span>
                  <span class="component-path">{{ path }}</span>
                </div>
              </el-option>
            </el-select>
            <p class="field-hint">
              <i class="mdi mdi-information-outline"></i>
              선택한 컴포넌트가 해당 URL에서 렌더링됩니다
            </p>
          </div>
        </div>

        <!-- 관련 라우트 (등록/수정/상세 페이지 등) -->
        <div v-if="formData.type !== 'DIRECTORY' && formData.type !== 'EXTERNAL'" class="form-section">
          <div class="section-title">
            <i class="mdi mdi-routes"></i>
            관련 라우트
          </div>
          <p class="section-desc">
            메뉴에는 표시되지 않지만 라우터에 등록되는 하위 페이지들입니다.<br>
            경로는 상대 경로로 입력하세요. (예: <code>create</code>, <code>:id</code>, <code>:id/edit</code>)
          </p>

          <!-- 관련 라우트 목록 -->
          <div v-if="relatedRoutesArray.length > 0" class="related-routes-list">
            <div
              v-for="(route, index) in relatedRoutesArray"
              :key="index"
              class="related-route-item"
            >
              <div class="related-route-header">
                <span class="route-number">#{{ index + 1 }}</span>
                <button class="remove-route-btn" @click="removeRelatedRoute(index)">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>
              <div class="related-route-fields">
                <div class="form-field">
                  <label class="field-label">경로</label>
                  <el-input
                    v-model="route.path"
                    placeholder="예: create, :id, :id/edit"
                    size="default"
                  >
                    <template #prefix>
                      <i class="mdi mdi-link-variant"></i>
                    </template>
                  </el-input>
                </div>
                <div class="form-field">
                  <label class="field-label">이름</label>
                  <el-input
                    v-model="route.name"
                    placeholder="예: 사용자 등록"
                    size="default"
                  >
                    <template #prefix>
                      <i class="mdi mdi-format-title"></i>
                    </template>
                  </el-input>
                </div>
                <div class="form-field full-width">
                  <label class="field-label">컴포넌트</label>
                  <el-select
                    v-model="route.componentPath"
                    placeholder="컴포넌트 선택"
                    size="default"
                    filterable
                    style="width: 100%"
                    popper-class="component-select-dropdown"
                  >
                    <el-option
                      v-for="path in viewPaths"
                      :key="path"
                      :label="path"
                      :value="path"
                    >
                      <div class="component-option">
                        <span class="component-name">{{ getViewFileName(path) }}</span>
                        <span class="component-path">{{ path }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </div>
              <div v-if="formData.url && route.path" class="route-preview">
                <i class="mdi mdi-arrow-right"></i>
                <span>{{ route.path.startsWith('/') ? route.path : `${formData.url}/${route.path}` }}</span>
              </div>
            </div>
          </div>

          <!-- 추가 버튼 -->
          <button class="add-route-btn" @click="addRelatedRoute">
            <i class="mdi mdi-plus"></i>
            <span>관련 라우트 추가</span>
          </button>
        </div>

        <!-- 아이콘 선택 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-emoticon-outline"></i>
            아이콘 선택
          </div>
          <div class="icon-grid">
            <div
              class="icon-option"
              :class="{ active: !formData.icon }"
              @click="formData.icon = ''"
            >
              <i class="mdi mdi-cancel"></i>
              <span>없음</span>
            </div>
            <div
              v-for="icon in iconOptions"
              :key="icon"
              class="icon-option"
              :class="{ active: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              <i :class="['mdi', icon]"></i>
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

        <!-- 접근 권한 -->
        <div class="form-section">
          <div class="section-title">
            <i class="mdi mdi-shield-account-outline"></i>
            접근 권한
          </div>
          <p class="section-desc">이 메뉴에 접근할 수 있는 역할을 선택하세요. 선택하지 않으면 모든 사용자가 접근할 수 있습니다.</p>
          <div class="role-chips">
            <div
              v-for="role in roleOptions"
              :key="role.value"
              class="role-chip"
              :class="{ active: isRoleSelected(role.value) }"
              :style="isRoleSelected(role.value) ? { '--role-color': role.color } : {}"
              @click="toggleRole(role.value)"
            >
              <i class="mdi" :class="isRoleSelected(role.value) ? 'mdi-check-circle' : 'mdi-circle-outline'"></i>
              <span>{{ role.label }}</span>
            </div>
          </div>
          <div v-if="selectedRoles.length > 0" class="selected-roles-info">
            <i class="mdi mdi-information-outline"></i>
            <span>선택된 역할: {{ selectedRoles.map(r => roleOptions.find(o => o.value === r)?.label).join(', ') }}</span>
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
.menu-management {
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
  background: linear-gradient(135deg, var(--accent-primary) 0%, #8b5cf6 100%);
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

.action-group {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
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
  background: linear-gradient(135deg, var(--accent-primary) 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.header-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
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
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
  color: var(--accent-primary);
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

.menu-item-wrapper {
  margin-bottom: 4px;
}

.menu-item-wrapper.parent {
  margin-bottom: 6px;
}

/* ==================== */
/* 주메뉴 아이템 */
/* ==================== */
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.menu-item.parent-item {
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  border-left: 3px solid var(--accent-primary);
}

.menu-item.parent-item:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.12);
  transform: translateY(-1px);
}

.menu-item.parent-item.is-inactive {
  opacity: 0.6;
  border-left-color: #9ca3af;
}

.menu-item.ghost {
  opacity: 0.5;
  background: rgba(99, 102, 241, 0.1);
}

/* ==================== */
/* 하위메뉴 아이템 */
/* ==================== */
.menu-children {
  margin-top: 4px;
  margin-left: 20px;
  padding-left: 16px;
  border-left: 2px dashed var(--border-color);
}

.menu-item-wrapper.child {
  margin-bottom: 3px;
}

.menu-item.child-item {
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: 8px;
}

.menu-item.child-item:hover {
  background: var(--bg-primary);
  border-color: var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.menu-item.child-item.is-inactive {
  opacity: 0.5;
}

/* 메뉴 아이템 레이아웃 */
.menu-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.menu-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 드래그 핸들 */
.drag-handle {
  cursor: grab;
  color: var(--text-tertiary);
  padding: 4px;
  display: flex;
  align-items: center;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.menu-item:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  color: var(--accent-primary);
}

.drag-handle:active {
  cursor: grabbing;
}

/* 펼침/접힘 버튼 */
.expand-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-size: 14px;
}

.expand-btn:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.expand-placeholder {
  width: 22px;
}

/* 하위 메뉴 연결선 */
.child-connector {
  display: flex;
  align-items: center;
  width: 20px;
}

.connector-line {
  width: 12px;
  height: 2px;
  background: var(--border-color);
  border-radius: 1px;
}

/* 메뉴 아이콘 */
.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.menu-icon.parent-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: var(--accent-primary);
  font-size: 16px;
}

.menu-icon.child-icon {
  width: 26px;
  height: 26px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 14px;
}

/* 메뉴 정보 */
.menu-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.menu-info-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 13px;
}

.parent-item .menu-name {
  font-size: 14px;
}

.children-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  background: var(--accent-primary);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
}

.menu-info-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 메뉴 타입 배지 */
.menu-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.menu-type-badge .mdi {
  font-size: 11px;
}

.menu-type-badge.small {
  font-size: 10px;
  padding: 2px 5px;
}

.menu-type-badge.small .mdi {
  display: none;
}

.menu-type-badge.directory {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.menu-type-badge.internal {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.menu-type-badge.external {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.menu-type-badge.board {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.menu-type-badge.page {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

/* URL 표시 */
.menu-url {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-tertiary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-url .mdi {
  font-size: 11px;
  flex-shrink: 0;
}

/* 상태 배지 */
.menu-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.menu-status-badge .mdi {
  font-size: 12px;
}

.menu-status-badge.small {
  font-size: 10px;
  padding: 2px 6px;
}

.menu-status-badge.small .mdi {
  display: none;
}

.menu-status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.menu-status-badge.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* 액션 버튼 */
.menu-item-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: all 0.2s ease;
}

.menu-item:hover .menu-item-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-size: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.add {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.action-btn.add:hover {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-btn.edit {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.action-btn.edit:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn.delete {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
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

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: var(--accent-primary);
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
  color: var(--accent-primary);
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

.field-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-hint .mdi {
  font-size: 13px;
}

/* 컴포넌트 선택 드롭다운 */
.component-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.component-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.component-path {
  font-size: 11px;
  color: #6b7280;
}

/* 다크모드에서 el-select 드롭다운 스타일 */
:deep(.el-select-dropdown__item) {
  color: #1f2937;
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background-color: #f3f4f6;
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
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.05);
}

.menu-type-card.active {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
}

.menu-type-card .mdi {
  font-size: 22px;
  color: var(--text-tertiary);
  transition: color 0.2s ease;
}

.menu-type-card.active .mdi {
  color: var(--accent-primary);
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
  border-color: var(--accent-primary);
}

.target-option.active {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
}

.target-option .mdi {
  font-size: 18px;
}

/* 아이콘 그리드 */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 22px;
  color: var(--text-tertiary);
}

.icon-option span {
  font-size: 10px;
}

.icon-option:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.icon-option.active {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
}

/* 섹션 설명 */
.section-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 12px;
  line-height: 1.5;
}

.section-desc code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: var(--accent-primary);
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

/* 역할 선택 칩 */
.role-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.role-chip:hover {
  border-color: var(--text-tertiary);
  background: var(--bg-tertiary);
}

.role-chip.active {
  border-color: var(--role-color, var(--accent-primary));
  background: color-mix(in srgb, var(--role-color, var(--accent-primary)) 10%, transparent);
  color: var(--role-color, var(--accent-primary));
}

.role-chip .mdi {
  font-size: 16px;
}

.selected-roles-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: var(--accent-primary);
}

.selected-roles-info .mdi {
  font-size: 16px;
}

/* 관련 라우트 */
.related-routes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.related-route-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.related-route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.route-number {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.remove-route-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s ease;
}

.remove-route-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.related-route-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.related-route-fields .form-field.full-width {
  grid-column: 1 / -1;
}

.related-route-fields .form-field {
  gap: 4px;
}

.related-route-fields .field-label {
  font-size: 11px;
}

.route-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: #10b981;
}

.route-preview .mdi {
  font-size: 14px;
}

.add-route-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-route-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.05);
}

.add-route-btn .mdi {
  font-size: 18px;
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.dialog-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
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
  border-color: var(--accent-primary);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
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
</style>

<!-- 드롭다운은 body에 렌더링되므로 전역 스타일 필요 -->
<style>
.component-select-dropdown .el-select-dropdown__item {
  height: auto;
  padding: 8px 12px;
  line-height: 1.4;
}

.component-select-dropdown .component-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.component-select-dropdown .component-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.component-select-dropdown .component-path {
  font-size: 11px;
  color: #6b7280;
}

.component-select-dropdown .el-select-dropdown__item.hover .component-name,
.component-select-dropdown .el-select-dropdown__item.selected .component-name {
  color: #6366f1;
}
</style>
