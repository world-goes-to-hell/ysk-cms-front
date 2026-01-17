<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards, createBoard, updateBoard, deleteBoard, getBoardTypes } from '@/api/board'
import * as menuApi from '@/api/menu'
import type { BoardDto, BoardCreateRequest, BoardUpdateRequest, BoardStatus, BoardTypeDto } from '@/types/board'
import type { MenuItem, RelatedRoute } from '@/types/menu'
import { viewPaths, getViewFileName } from '@/utils/viewModules'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 상태
const boards = ref<BoardDto[]>([])
const boardTypes = ref<BoardTypeDto[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const filterTypeCode = ref('')
const filterStatus = ref<BoardStatus | ''>('')

// 다이얼로그
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingBoard = ref<BoardDto | null>(null)

// 폼 데이터
const formData = ref<BoardCreateRequest & { status?: BoardStatus }>({
  code: '',
  name: '',
  description: '',
  typeCode: '',
  useComment: true,
  useAttachment: true,
  attachmentLimit: 5,
  useSecret: false,
  usePinned: false,
  sortOrder: 0,
  routeConfig: {
    listUrl: '',
    listComponent: '',
    detailUrl: '',
    detailComponent: '',
    formUrl: '',
    formComponent: '',
  },
})

// 컴포넌트 파일명 가져오기
const getComponentName = (path: string): string => {
  return getViewFileName(path)
}

// 게시판용 필터링된 뷰 경로 (board/board-${typeCode} 폴더)
const filteredViewPaths = computed(() => {
  const typeCode = formData.value.typeCode
  if (!typeCode) return []

  const siteCode = currentSiteCode.value
  const boardFolder = `board-${typeCode.toLowerCase()}`

  // sites/{siteCode}/board/board-{typeCode}/ 또는 default/board/board-{typeCode}/ 경로만 필터링
  return viewPaths.filter(path => {
    const sitePattern = `@/views/sites/${siteCode}/board/${boardFolder}/`
    const defaultPattern = `@/views/default/board/${boardFolder}/`
    return path.startsWith(sitePattern) || path.startsWith(defaultPattern)
  })
})

// 게시판 타입 목록 조회
const fetchBoardTypes = async () => {
  try {
    const response = await getBoardTypes(currentSiteCode.value)
    boardTypes.value = response.data.data
  } catch (error) {
    console.error('[Board] 게시판 타입 목록 조회 실패:', error)
  }
}

// 필터링된 게시판 목록
const filteredBoards = computed(() => {
  let result = boards.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (board) =>
        board.name.toLowerCase().includes(query) ||
        board.code.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query),
    )
  }

  if (filterTypeCode.value) {
    result = result.filter((board) => board.typeCode === filterTypeCode.value)
  }

  if (filterStatus.value) {
    result = result.filter((board) => board.status === filterStatus.value)
  }

  return result
})

// 게시판 목록 조회
const fetchBoards = async () => {
  isLoading.value = true
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data
  } catch (error) {
    ElMessage.error('게시판 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 새 게시판 폼 열기
const openCreateDialog = () => {
  isEditing.value = false
  editingBoard.value = null
  formData.value = {
    code: '',
    name: '',
    description: '',
    typeCode: boardTypes.value.length > 0 ? boardTypes.value[0]?.code || '' : '',
    useComment: true,
    useAttachment: true,
    attachmentLimit: 5,
    useSecret: false,
    usePinned: false,
    sortOrder: boards.value.length,
    routeConfig: {
      listUrl: '',
      listComponent: '',
      detailUrl: '',
      detailComponent: '',
      formUrl: '',
      formComponent: '',
    },
  }
  showFormDialog.value = true
}

// 메뉴에서 라우트 정보 가져오기
const fetchMenuRouteConfig = async (boardCode: string) => {
  try {
    const response = await menuApi.getMenus(currentSiteCode.value)
    const menus: MenuItem[] = response.data.data
    const menu = menus.find(m => m.code === boardCode)

    if (!menu) {
      console.log('[Board] 해당 코드의 메뉴가 없습니다:', boardCode)
      return null
    }

    // relatedRoutes 파싱
    let relatedRoutes: RelatedRoute[] = []
    if (menu.relatedRoutes) {
      try {
        relatedRoutes = JSON.parse(menu.relatedRoutes)
      } catch {
        console.warn('[Board] relatedRoutes 파싱 실패')
      }
    }

    // 상세 페이지 찾기
    const detailRoute = relatedRoutes.find(r => r.name === '상세' || r.path.includes(':id'))
    // 작성 페이지 찾기
    const formRoute = relatedRoutes.find(r => r.name === '작성' || r.path.includes('write') || r.path.includes('create'))

    return {
      listUrl: menu.url || '',
      listComponent: menu.componentPath || '',
      detailUrl: detailRoute?.path || '',
      detailComponent: detailRoute?.componentPath || '',
      formUrl: formRoute?.path || '',
      formComponent: formRoute?.componentPath || '',
    }
  } catch (error) {
    console.error('[Board] 메뉴 라우트 정보 조회 실패:', error)
    return null
  }
}

// 게시판 수정 폼 열기
const openEditDialog = async (board: BoardDto) => {
  isEditing.value = true
  editingBoard.value = board

  // 메뉴에서 라우트 정보 가져오기
  const routeConfig = await fetchMenuRouteConfig(board.code)

  formData.value = {
    code: board.code,
    name: board.name,
    description: board.description || '',
    typeCode: board.typeCode || '',
    useComment: board.useComment ?? true,
    useAttachment: board.useAttachment ?? true,
    attachmentLimit: board.attachmentLimit ?? 5,
    useSecret: board.useSecret ?? false,
    usePinned: board.usePinned ?? false,
    sortOrder: board.sortOrder ?? 0,
    status: board.status || 'ACTIVE',
    routeConfig: routeConfig || {
      listUrl: '',
      listComponent: '',
      detailUrl: '',
      detailComponent: '',
      formUrl: '',
      formComponent: '',
    },
  }
  showFormDialog.value = true
}

// routeConfig를 RelatedRoute[] 형식으로 변환
const convertRouteConfigToRelatedRoutes = (): RelatedRoute[] => {
  const routes: RelatedRoute[] = []
  const config = formData.value.routeConfig

  if (!config) return routes

  // 목록 페이지
  if (config.listUrl && config.listComponent) {
    routes.push({
      path: config.listUrl,
      name: '목록',
      componentPath: config.listComponent,
    })
  }

  // 상세 페이지
  if (config.detailUrl && config.detailComponent) {
    routes.push({
      path: config.detailUrl,
      name: '상세',
      componentPath: config.detailComponent,
    })
  }

  // 작성/수정 페이지
  if (config.formUrl && config.formComponent) {
    routes.push({
      path: config.formUrl,
      name: '작성',
      componentPath: config.formComponent,
    })
  }

  return routes
}

// 게시판관리 부모 메뉴 코드 (하드코딩 또는 설정에서 가져올 수 있음)
const BOARD_MANAGEMENT_MENU_CODE = 'boards'

// 메뉴 생성 또는 업데이트
const createOrUpdateBoardMenu = async (boardCode: string, boardName: string, isNew: boolean) => {
  const relatedRoutes = convertRouteConfigToRelatedRoutes()
  const config = formData.value.routeConfig

  try {
    // 메뉴 목록 조회
    const response = await menuApi.getMenus(currentSiteCode.value)
    const menus: MenuItem[] = response.data.data

    // 게시판관리 부모 메뉴 찾기
    const parentMenu = menus.find(menu => menu.code === BOARD_MANAGEMENT_MENU_CODE)
    if (!parentMenu) {
      console.warn('[Board] 게시판관리 부모 메뉴를 찾을 수 없습니다. 코드:', BOARD_MANAGEMENT_MENU_CODE)
      return
    }

    // 해당 게시판 코드의 메뉴가 이미 있는지 확인
    const existingMenu = menus.find(menu => menu.code === boardCode)

    // 선택된 게시판 타입에서 아이콘 가져오기
    const selectedType = boardTypes.value.find(t => t.code === formData.value.typeCode)
    const typeIcon = selectedType?.icon || 'mdi-file-document-outline'

    if (existingMenu) {
      // 기존 메뉴 업데이트
      await menuApi.updateMenu(currentSiteCode.value, existingMenu.id, {
        name: boardName,
        type: 'BOARD',
        url: config?.listUrl || `/boards/${boardCode}`,
        icon: typeIcon,
        parentId: existingMenu.parentId ?? null, // 기존 부모 구조 유지
        componentPath: config?.listComponent || '',
        relatedRoutes: relatedRoutes.length > 0 ? JSON.stringify(relatedRoutes) : '',
      })
      console.log('[Board] 메뉴 업데이트 완료:', boardCode)
    } else if (isNew) {
      // 새 메뉴 생성 (게시판관리 하위에)
      await menuApi.createMenu(currentSiteCode.value, {
        name: boardName,
        code: boardCode,
        type: 'BOARD',
        url: config?.listUrl || `/boards/${boardCode}`,
        icon: typeIcon,
        parentId: parentMenu.id,
        status: 'ACTIVE',
        componentPath: config?.listComponent || '',
        relatedRoutes: relatedRoutes.length > 0 ? JSON.stringify(relatedRoutes) : '',
      })
      console.log('[Board] 메뉴 생성 완료:', boardCode, '(부모:', parentMenu.name, ')')
    }
  } catch (error) {
    console.error('[Board] 메뉴 생성/업데이트 실패:', error)
  }
}

// 게시판 저장
const saveBoard = async () => {
  if (!formData.value.code || !formData.value.name) {
    ElMessage.warning('코드와 이름은 필수입니다.')
    return
  }

  try {
    if (isEditing.value && editingBoard.value) {
      const updateData: BoardUpdateRequest = {
        name: formData.value.name,
        description: formData.value.description,
        typeCode: formData.value.typeCode,
        useComment: formData.value.useComment,
        useAttachment: formData.value.useAttachment,
        attachmentLimit: formData.value.attachmentLimit,
        useSecret: formData.value.useSecret,
        usePinned: formData.value.usePinned,
        sortOrder: formData.value.sortOrder,
        status: formData.value.status,
        routeConfig: formData.value.routeConfig,
      }
      await updateBoard(currentSiteCode.value, editingBoard.value.code, updateData)

      // 메뉴 업데이트
      await createOrUpdateBoardMenu(editingBoard.value.code, formData.value.name, false)

      ElMessage.success('게시판이 수정되었습니다.')
    } else {
      await createBoard(currentSiteCode.value, formData.value)

      // 메뉴 생성 (게시판관리 하위에)
      await createOrUpdateBoardMenu(formData.value.code, formData.value.name, true)

      ElMessage.success('게시판이 생성되었습니다.')
    }
    showFormDialog.value = false
    fetchBoards()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  }
}

// 게시판 삭제
const handleDelete = async (board: BoardDto) => {
  try {
    await ElMessageBox.confirm(
      `'${board.name}' 게시판을 삭제하시겠습니까?\n게시판 내의 모든 게시글도 함께 삭제됩니다.`,
      '게시판 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deleteBoard(currentSiteCode.value, board.code)
    ElMessage.success('게시판이 삭제되었습니다.')
    fetchBoards()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

// 상태 토글
const toggleStatus = async (board: BoardDto) => {
  try {
    const newStatus: BoardStatus = board.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await updateBoard(currentSiteCode.value, board.code, {
      name: board.name,
      status: newStatus,
    })
    board.status = newStatus
    ElMessage.success(`게시판이 ${newStatus === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`)
  } catch {
    ElMessage.error('상태 변경에 실패했습니다.')
  }
}

// 게시판 타입 정보 가져오기
const getTypeInfo = (typeCode: string | undefined) => {
  const defaultType = {
    code: '',
    name: '기본',
    icon: 'mdi-file-document-outline',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
  }
  if (!typeCode || boardTypes.value.length === 0) return defaultType
  const found = boardTypes.value.find((t) => t.code === typeCode)
  return found || defaultType
}

// 사이트 코드 변경 감지
watch(currentSiteCode, () => {
  fetchBoards()
  fetchBoardTypes()
})

onMounted(() => {
  fetchBoards()
  fetchBoardTypes()
})
</script>

<template>
  <div class="board-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-view-dashboard-outline"></i>
          게시판 관리
        </h1>
        <p>게시판을 생성하고 관리하세요</p>
      </div>
      <button class="btn-create" @click="openCreateDialog">
        <i class="mdi mdi-plus"></i>
        새 게시판
      </button>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="mdi mdi-view-grid-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ boards.length }}</span>
          <span class="stat-label">전체 게시판</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <i class="mdi mdi-check-circle-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ boards.filter(b => b.status === 'ACTIVE').length }}</span>
          <span class="stat-label">활성 게시판</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon inactive">
          <i class="mdi mdi-pause-circle-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ boards.filter(b => b.status !== 'ACTIVE').length }}</span>
          <span class="stat-label">비활성 게시판</span>
        </div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="filter-section">
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="게시판 이름, 코드로 검색..."
        />
      </div>
      <div class="filter-group">
        <select v-model="filterTypeCode" class="filter-select">
          <option value="">타입 전체</option>
          <option v-for="opt in boardTypes" :key="opt.code" :value="opt.code">
            {{ opt.name }}
          </option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">상태 전체</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
        </select>
      </div>
    </div>

    <!-- 게시판 목록 -->
    <div v-loading="isLoading" class="boards-container">
      <!-- 게시판 테이블 -->
      <div v-if="filteredBoards.length > 0" class="boards-table">
        <div class="table-header">
          <div class="col-info">게시판 정보</div>
          <div class="col-type">타입</div>
          <div class="col-features">기능</div>
          <div class="col-status">상태</div>
          <div class="col-actions">관리</div>
        </div>

        <div
          v-for="board in filteredBoards"
          :key="board.id"
          class="table-row"
          :class="{ inactive: board.status !== 'ACTIVE' }"
        >
          <!-- 게시판 정보 -->
          <div class="col-info">
            <div
              class="board-icon"
              :style="{
                backgroundColor: getTypeInfo(board.typeCode).bgColor,
                color: getTypeInfo(board.typeCode).color
              }"
            >
              <i :class="['mdi', getTypeInfo(board.typeCode).icon]"></i>
            </div>
            <div class="board-details">
              <h3 class="board-name">{{ board.name }}</h3>
              <span class="board-code">{{ board.code }}</span>
              <p v-if="board.description" class="board-desc">{{ board.description }}</p>
            </div>
          </div>

          <!-- 타입 -->
          <div class="col-type">
            <span
              class="type-badge"
              :style="{
                backgroundColor: getTypeInfo(board.typeCode).bgColor,
                color: getTypeInfo(board.typeCode).color
              }"
            >
              {{ getTypeInfo(board.typeCode).name }}
            </span>
          </div>

          <!-- 기능 -->
          <div class="col-features">
            <div class="feature-tags">
              <span v-if="board.useComment" class="feature-tag">
                <i class="mdi mdi-comment-outline"></i> 댓글
              </span>
              <span v-if="board.useAttachment" class="feature-tag">
                <i class="mdi mdi-paperclip"></i> 첨부 {{ board.attachmentLimit }}개
              </span>
              <span v-if="board.usePinned" class="feature-tag pinned">
                <i class="mdi mdi-pin"></i> 고정
              </span>
              <span v-if="board.useSecret" class="feature-tag secret">
                <i class="mdi mdi-lock-outline"></i> 비밀글
              </span>
              <span v-if="!board.useComment && !board.useAttachment && !board.usePinned && !board.useSecret" class="feature-tag none">
                -
              </span>
            </div>
          </div>

          <!-- 상태 -->
          <div class="col-status">
            <button
              class="status-toggle"
              :class="board.status === 'ACTIVE' ? 'active' : 'inactive'"
              @click="toggleStatus(board)"
            >
              <span class="status-dot"></span>
              <span class="status-text">{{ board.status === 'ACTIVE' ? '활성' : '비활성' }}</span>
            </button>
          </div>

          <!-- 관리 버튼 -->
          <div class="col-actions">
            <button class="action-btn edit" title="수정" @click="openEditDialog(board)">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(board)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-folder-open-outline"></i>
        </div>
        <h3>등록된 게시판이 없습니다</h3>
        <p>새 게시판을 생성하여 콘텐츠를 관리하세요</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          첫 게시판 만들기
        </button>
      </div>
    </div>

    <!-- 게시판 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '게시판 수정' : '새 게시판 생성'"
      width="800px"
      class="board-dialog"
      destroy-on-close
    >
      <div class="dialog-form">
        <!-- 기본 정보 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-information-outline"></i>
            기본 정보
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label required">게시판 코드</label>
              <input
                v-model="formData.code"
                type="text"
                class="field-input"
                placeholder="예: notice"
                :disabled="isEditing"
              />
              <span class="field-hint">영문, 숫자, 하이픈만 사용 (수정 불가)</span>
            </div>
            <div class="form-field">
              <label class="field-label required">게시판 이름</label>
              <input
                v-model="formData.name"
                type="text"
                class="field-input"
                placeholder="예: 공지사항"
              />
            </div>
          </div>
          <div class="form-field full">
            <label class="field-label">설명</label>
            <textarea
              v-model="formData.description"
              class="field-textarea"
              placeholder="게시판에 대한 간단한 설명"
              rows="2"
            ></textarea>
          </div>
        </div>

        <!-- 게시판 타입 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-shape-outline"></i>
            게시판 타입
          </h4>
          <div v-if="boardTypes.length > 0" class="type-selector">
            <label
              v-for="opt in boardTypes"
              :key="opt.code"
              class="type-option"
              :class="{ selected: formData.typeCode === opt.code }"
            >
              <input
                v-model="formData.typeCode"
                type="radio"
                :value="opt.code"
                class="type-radio"
              />
              <div class="type-content" :style="{ borderColor: formData.typeCode === opt.code ? opt.color : undefined }">
                <i :class="['mdi', opt.icon]" :style="{ color: opt.color }"></i>
                <span>{{ opt.name }}</span>
              </div>
            </label>
          </div>
          <div v-else class="type-empty">
            <i class="mdi mdi-alert-circle-outline"></i>
            <span>등록된 게시판 타입이 없습니다. 먼저 게시판 타입을 등록해주세요.</span>
          </div>
        </div>

        <!-- 라우트 설정 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-routes"></i>
            라우트 설정
            <span class="section-hint">(메뉴에 저장됨)</span>
          </h4>

          <!-- 게시판 타입 선택 안내 -->
          <div v-if="!formData.typeCode" class="route-hint">
            <i class="mdi mdi-information-outline"></i>
            게시판 타입을 먼저 선택하면 해당 타입의 뷰 파일을 선택할 수 있습니다.
            <br />
            <span class="hint-path">경로: views/default/board/board-{typeCode}/ 또는 views/sites/{siteCode}/board/board-{typeCode}/</span>
          </div>

          <!-- 선택 가능한 뷰 파일 없음 안내 -->
          <div v-else-if="filteredViewPaths.length === 0" class="route-hint warning">
            <i class="mdi mdi-alert-outline"></i>
            <code>board/board-{{ formData.typeCode?.toLowerCase() }}</code> 폴더에 뷰 파일이 없습니다.
            <br />
            <span class="hint-path">views/default/board/board-{{ formData.typeCode?.toLowerCase() }}/ 또는 views/sites/{{ currentSiteCode }}/board/board-{{ formData.typeCode?.toLowerCase() }}/ 폴더를 생성하세요.</span>
          </div>

          <!-- 목록 페이지 -->
          <template v-else>
            <div class="route-group">
              <div class="route-group-title">
                <i class="mdi mdi-format-list-bulleted"></i>
                목록 페이지
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="field-label">URL 경로</label>
                  <input
                    v-model="formData.routeConfig!.listUrl"
                    type="text"
                    class="field-input"
                    placeholder="예: /boards/notice"
                  />
                </div>
                <div class="form-field">
                  <label class="field-label">컴포넌트</label>
                  <el-select
                    v-model="formData.routeConfig!.listComponent"
                    filterable
                    clearable
                    placeholder="컴포넌트 검색..."
                    class="component-select"
                    popper-class="board-component-dropdown"
                  >
                    <el-option
                      v-for="path in filteredViewPaths"
                      :key="path"
                      :label="path"
                      :value="path"
                    >
                      <div class="component-option">
                        <span class="component-name">{{ getComponentName(path) }}</span>
                        <span class="component-path">{{ path }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </div>
            </div>

            <!-- 상세 페이지 -->
            <div class="route-group">
              <div class="route-group-title">
                <i class="mdi mdi-file-document-outline"></i>
                상세 페이지
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="field-label">URL 경로</label>
                  <input
                    v-model="formData.routeConfig!.detailUrl"
                    type="text"
                    class="field-input"
                    placeholder="예: /boards/notice/:id"
                  />
                </div>
                <div class="form-field">
                  <label class="field-label">컴포넌트</label>
                  <el-select
                    v-model="formData.routeConfig!.detailComponent"
                    filterable
                    clearable
                    placeholder="컴포넌트 검색..."
                    class="component-select"
                    popper-class="board-component-dropdown"
                  >
                    <el-option
                      v-for="path in filteredViewPaths"
                      :key="path"
                      :label="path"
                      :value="path"
                    >
                      <div class="component-option">
                        <span class="component-name">{{ getComponentName(path) }}</span>
                        <span class="component-path">{{ path }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </div>
            </div>

            <!-- 작성/수정 페이지 -->
            <div class="route-group">
              <div class="route-group-title">
                <i class="mdi mdi-pencil-outline"></i>
                작성/수정 페이지
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="field-label">URL 경로</label>
                  <input
                    v-model="formData.routeConfig!.formUrl"
                    type="text"
                    class="field-input"
                    placeholder="예: /boards/notice/write"
                  />
                </div>
                <div class="form-field">
                  <label class="field-label">컴포넌트</label>
                  <el-select
                    v-model="formData.routeConfig!.formComponent"
                    filterable
                    clearable
                    placeholder="컴포넌트 검색..."
                    class="component-select"
                    popper-class="board-component-dropdown"
                  >
                    <el-option
                      v-for="path in filteredViewPaths"
                      :key="path"
                      :label="path"
                      :value="path"
                    >
                      <div class="component-option">
                        <span class="component-name">{{ getComponentName(path) }}</span>
                        <span class="component-path">{{ path }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 기능 설정 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-cog-outline"></i>
            기능 설정
          </h4>
          <div class="feature-options">
            <label class="toggle-option">
              <input v-model="formData.useComment" type="checkbox" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span class="toggle-label">
                <i class="mdi mdi-comment-outline"></i>
                댓글 기능
              </span>
            </label>
            <label class="toggle-option">
              <input v-model="formData.useAttachment" type="checkbox" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span class="toggle-label">
                <i class="mdi mdi-paperclip"></i>
                첨부파일
              </span>
            </label>
            <div v-if="formData.useAttachment" class="attachment-limit">
              <label>최대 첨부 개수</label>
              <input
                v-model.number="formData.attachmentLimit"
                type="number"
                min="1"
                max="20"
                class="limit-input"
              />
              <span>개</span>
            </div>
          </div>
        </div>

        <!-- 게시글 옵션 설정 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-text-box-check-outline"></i>
            게시글 옵션
            <span class="section-hint">(게시글 작성 시 사용할 수 있는 기능)</span>
          </h4>
          <div class="feature-options">
            <label class="toggle-option">
              <input v-model="formData.usePinned" type="checkbox" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span class="toggle-label">
                <i class="mdi mdi-pin"></i>
                상단 고정
              </span>
              <span class="toggle-hint">게시글을 목록 상단에 고정할 수 있습니다</span>
            </label>
            <label class="toggle-option">
              <input v-model="formData.useSecret" type="checkbox" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span class="toggle-label">
                <i class="mdi mdi-lock-outline"></i>
                비밀글
              </span>
              <span class="toggle-hint">게시글을 비밀글로 설정할 수 있습니다</span>
            </label>
          </div>
        </div>

        <!-- 추가 설정 (수정 시) -->
        <div v-if="isEditing" class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-tune"></i>
            추가 설정
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">정렬 순서</label>
              <input
                v-model.number="formData.sortOrder"
                type="number"
                min="0"
                class="field-input"
              />
            </div>
            <div class="form-field">
              <label class="field-label">상태</label>
              <select v-model="formData.status" class="field-select">
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showFormDialog = false">취소</button>
          <button class="btn-save" @click="saveBoard">
            <i class="mdi" :class="isEditing ? 'mdi-content-save' : 'mdi-plus'"></i>
            {{ isEditing ? '저장' : '생성' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.board-management {
  width: 100%;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.header-left h1 .mdi {
  font-size: 32px;
  color: var(--accent-primary);
}

.header-left p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-create .mdi {
  font-size: 20px;
}

/* 통계 카드 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.stat-icon .mdi {
  font-size: 26px;
}

.stat-icon.total {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.stat-icon.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 검색 및 필터 */
.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-box .mdi {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--text-tertiary);
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

/* 게시판 테이블 */
.boards-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.boards-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 100px 220px 100px 100px;
  gap: 16px;
  padding: 16px 24px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 100px 220px 100px 100px;
  gap: 16px;
  padding: 20px 24px;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-tertiary);
}

.table-row.inactive {
  opacity: 0.6;
}

/* 게시판 정보 */
.col-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.board-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.board-icon .mdi {
  font-size: 24px;
}

.board-details {
  min-width: 0;
}

.board-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.board-code {
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

.board-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 6px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 타입 배지 */
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* 기능 태그 */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.feature-tag .mdi {
  font-size: 14px;
}

.feature-tag.none {
  color: var(--text-tertiary);
}

.feature-tag.pinned {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.feature-tag.secret {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

/* 상태 토글 */
.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-toggle.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-toggle.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-toggle:hover {
  transform: scale(1.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* 액션 버튼 */
.col-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn .mdi {
  font-size: 18px;
}

.action-btn.edit {
  color: var(--accent-primary);
}

.action-btn.edit:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--accent-primary);
}

.action-btn.delete {
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 20px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 40px;
  color: var(--text-tertiary);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 24px 0;
}

.btn-create-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-empty:hover {
  background: #4f46e5;
}

/* 다이얼로그 폼 */
.dialog-form {
  padding: 8px 0;
}

.form-section {
  margin-bottom: 28px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.section-title .mdi {
  font-size: 18px;
  color: var(--accent-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.full {
  grid-column: 1 / -1;
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

.field-input,
.field-textarea,
.field-select {
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.field-input:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.field-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 타입 선택 */
.type-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.type-option {
  flex: 1;
  min-width: 90px;
}

.type-radio {
  display: none;
}

.type-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-content .mdi {
  font-size: 24px;
}

.type-content span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.type-option.selected .type-content {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.05);
}

.type-option.selected .type-content span {
  color: var(--accent-primary);
}

.type-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  font-size: 13px;
  color: #f59e0b;
}

.type-empty .mdi {
  font-size: 18px;
}

/* 기능 옵션 */
.feature-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-checkbox:checked + .toggle-switch {
  background: var(--accent-primary);
}

.toggle-checkbox:checked + .toggle-switch::after {
  left: 23px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-label .mdi {
  font-size: 18px;
  color: var(--text-secondary);
}

.toggle-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: auto;
}

.attachment-limit {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 56px;
  font-size: 13px;
  color: var(--text-secondary);
}

.limit-input {
  width: 60px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
  text-align: center;
}

.limit-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

/* 다이얼로그 푸터 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-save .mdi {
  font-size: 18px;
}

/* 라우트 설정 */
.section-hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 8px;
}

.route-group {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.route-group:last-child {
  margin-bottom: 0;
}

.route-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.route-group-title .mdi {
  font-size: 16px;
  color: var(--accent-primary);
}

/* 컴포넌트 선택 */
.component-select {
  width: 100%;
}

/* 라우트 힌트 */
.route-hint {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.route-hint .mdi {
  font-size: 16px;
  color: var(--accent-primary);
  margin-right: 6px;
}

.route-hint.warning {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.3);
}

.route-hint.warning .mdi {
  color: #f59e0b;
}

.route-hint code {
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: var(--accent-primary);
}

.route-hint .hint-path {
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: 'Monaco', 'Menlo', monospace;
  margin-top: 4px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 80px 180px 90px 90px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .filter-section {
    flex-direction: column;
  }

  .search-box {
    max-width: none;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
  }

  .col-info {
    width: 100%;
  }

  .col-type,
  .col-features,
  .col-status {
    align-self: flex-start;
  }

  .col-actions {
    width: 100%;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .type-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .type-option {
    min-width: auto;
  }
}
</style>

<!-- 드롭다운 스타일 (전역) -->
<style>
.board-component-dropdown .el-select-dropdown__item {
  height: auto;
  padding: 8px 12px;
  line-height: 1.4;
}

.board-component-dropdown .component-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.board-component-dropdown .component-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.board-component-dropdown .component-path {
  font-size: 11px;
  color: #6b7280;
}

.board-component-dropdown .el-select-dropdown__item.hover .component-name,
.board-component-dropdown .el-select-dropdown__item.selected .component-name {
  color: #6366f1;
}
</style>
