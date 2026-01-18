<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import type { UserMenuItem } from '@/types/userMenu'

const props = defineProps<{
  menu: UserMenuItem
  depth: number
  expandedKeys: Set<number>
  menuTypes: Array<{ value: string; label: string; description: string }>
}>()

const emit = defineEmits<{
  (e: 'toggle-expand', menuId: number): void
  (e: 'open-create-dialog', parent: UserMenuItem): void
  (e: 'open-edit-dialog', menu: UserMenuItem): void
  (e: 'delete-menu', menu: UserMenuItem): void
  (e: 'drag-change'): void
  (e: 'update:children', children: UserMenuItem[]): void
}>()

const isExpanded = computed(() => props.expandedKeys.has(props.menu.id))

// ref로 children 관리 (vuedraggable이 직접 수정 가능)
const localChildren = ref<UserMenuItem[]>([...(props.menu.children || [])])

// props 변경 시 localChildren 동기화 (외부에서 변경된 경우만)
let isInternalUpdate = false
watch(() => props.menu.children, (newChildren) => {
  if (!isInternalUpdate) {
    localChildren.value = [...(newChildren || [])]
  }
})

// localChildren 변경 시 부모에게 알림
const onDragUpdate = () => {
  isInternalUpdate = true
  emit('update:children', [...localChildren.value])
  emit('drag-change')
  // 다음 틱에서 플래그 리셋
  setTimeout(() => { isInternalUpdate = false }, 0)
}

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

const toggleExpand = () => {
  emit('toggle-expand', props.menu.id)
}

const handleChildrenUpdate = (index: number, newChildren: UserMenuItem[]) => {
  localChildren.value[index] = { ...localChildren.value[index], children: newChildren }
  emit('update:children', [...localChildren.value])
}
</script>

<template>
  <div class="menu-item-wrapper" :class="{ 'is-root': depth === 0 }">
    <div
      class="menu-item"
      :class="{
        'has-children': menu.children?.length,
        'is-inactive': menu.status === 'INACTIVE',
        'depth-0': depth === 0,
        'depth-1': depth === 1,
        'depth-2': depth >= 2
      }"
      @click="menu.children?.length && toggleExpand()"
      style="cursor: pointer;"
    >
      <div class="menu-item-left">
        <span class="drag-handle" @click.stop>
          <i class="mdi mdi-drag-vertical"></i>
        </span>
        <button
          v-if="menu.children?.length || menu.type === 'DIRECTORY'"
          class="expand-btn"
          :class="{ 'is-empty': !menu.children?.length }"
          @click.stop="toggleExpand"
        >
          <i
            class="mdi"
            :class="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          ></i>
        </button>
        <span v-else class="expand-placeholder"></span>

        <!-- 깊이에 따른 연결선 (depth > 0인 경우) -->
        <span v-if="depth > 0" class="child-connector">
          <span class="connector-line"></span>
        </span>

        <span class="menu-icon" :class="depth === 0 ? 'parent-icon' : 'child-icon'">
          <i v-if="menu.icon" :class="['mdi', menu.icon]"></i>
          <i v-else :class="['mdi', depth === 0 ? 'mdi-folder-outline' : 'mdi-file-document-outline']"></i>
        </span>
        <div class="menu-info">
          <div class="menu-info-top">
            <span class="menu-name">{{ menu.name }}</span>
            <span v-if="menu.children?.length" class="children-count">
              {{ menu.children.length }}
            </span>
            <span v-if="depth >= 2" class="depth-badge">
              {{ depth + 1 }}단계
            </span>
          </div>
          <div class="menu-info-bottom">
            <span class="menu-type-badge" :class="[menu.type.toLowerCase(), { small: depth > 0 }]">
              <i v-if="depth === 0" class="mdi" :class="getTypeIcon(menu.type)"></i>
              {{ menuTypes.find((t) => t.value === menu.type)?.label }}
            </span>
            <span v-if="menu.url" class="menu-url">
              <i v-if="depth === 0" class="mdi mdi-link-variant"></i>
              {{ menu.url }}
            </span>
          </div>
        </div>
      </div>
      <div class="menu-item-right">
        <span class="menu-status-badge" :class="[menu.status.toLowerCase(), { small: depth > 0 }]">
          <i v-if="depth === 0" class="mdi" :class="menu.status === 'ACTIVE' ? 'mdi-check-circle' : 'mdi-close-circle'"></i>
          {{ menu.status === 'ACTIVE' ? '활성' : '비활성' }}
        </span>
        <div class="menu-item-actions" @click.stop>
          <el-tooltip v-if="menu.type === 'DIRECTORY'" content="하위 메뉴 추가" placement="top">
            <button class="action-btn add" @click="emit('open-create-dialog', menu)">
              <i class="mdi mdi-plus"></i>
            </button>
          </el-tooltip>
          <span v-else class="action-btn-placeholder"></span>
          <el-tooltip content="수정" placement="top">
            <button class="action-btn edit" @click="emit('open-edit-dialog', menu)">
              <i class="mdi mdi-pencil"></i>
            </button>
          </el-tooltip>
          <el-tooltip content="삭제" placement="top">
            <button class="action-btn delete" @click="emit('delete-menu', menu)">
              <i class="mdi mdi-delete"></i>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 하위 메뉴 (재귀적 렌더링) - DIRECTORY 타입은 빈 상태에서도 드롭 영역 표시 -->
    <transition name="expand">
      <div
        v-if="menu.type === 'DIRECTORY' && isExpanded"
        class="menu-children"
        :class="[`depth-${depth}`, { 'is-empty': !localChildren.length }]"
      >
        <draggable
          v-model="localChildren"
          group="user-menus"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost"
          :empty-insert-threshold="50"
          @change="onDragUpdate"
          class="draggable-container"
          :class="{ 'is-empty': !localChildren.length }"
        >
          <template #item="{ element: child, index }">
            <UserMenuTreeItem
              :menu="child"
              :depth="depth + 1"
              :expanded-keys="expandedKeys"
              :menu-types="menuTypes"
              @toggle-expand="emit('toggle-expand', $event)"
              @open-create-dialog="emit('open-create-dialog', $event)"
              @open-edit-dialog="emit('open-edit-dialog', $event)"
              @delete-menu="emit('delete-menu', $event)"
              @drag-change="emit('drag-change')"
              @update:children="handleChildrenUpdate(index, $event)"
            />
          </template>
          <!-- 빈 디렉토리 드롭 영역 안내 (draggable 내부에 footer로) -->
          <template #footer>
            <div v-if="!localChildren.length" class="empty-drop-zone">
              <i class="mdi mdi-arrow-down-bold-box-outline"></i>
              <span>메뉴를 여기로 드래그하세요</span>
            </div>
          </template>
        </draggable>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
export default {
  name: 'UserMenuTreeItem'
}
</script>

<style scoped>
.menu-item-wrapper {
  margin-bottom: 4px;
}

.menu-item-wrapper.is-root {
  margin-bottom: 6px;
}

/* 메뉴 아이템 */
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.menu-item.depth-0 {
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  border-left: 3px solid #10b981;
}

.menu-item.depth-1,
.menu-item.depth-2 {
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: 8px;
}

.menu-item.depth-2 {
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-left: 2px solid #059669;
}

.menu-item:hover {
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.12);
  transform: translateY(-1px);
}

.menu-item.depth-1:hover {
  background: var(--bg-primary);
  border-color: var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transform: none;
}

.menu-item.depth-2:hover {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
  transform: none;
}

.menu-item.is-inactive {
  opacity: 0.6;
}

.menu-item.depth-0.is-inactive {
  border-left-color: #9ca3af;
}

.menu-item.ghost {
  opacity: 0.5;
  background: rgba(16, 185, 129, 0.1);
}

/* 하위 메뉴 컨테이너 */
.menu-children {
  margin-top: 4px;
  margin-left: 20px;
  padding-left: 16px;
  border-left: 2px dashed var(--border-color);
}

.menu-children.depth-1 {
  border-left-color: var(--text-tertiary);
}

.menu-children.depth-2 {
  border-left-color: #059669;
  margin-left: 16px;
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
  color: #10b981;
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
  background: #10b981;
  border-color: #10b981;
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
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #10b981;
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

.depth-0 .menu-name {
  font-size: 14px;
}

.children-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
}

.depth-badge {
  display: inline-flex;
  align-items: center;
  font-size: 9px;
  padding: 2px 6px;
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
  border-radius: 4px;
  font-weight: 600;
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

/* 버튼 placeholder (정렬용) */
.action-btn-placeholder {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
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

/* 빈 디렉토리 펼침 버튼 */
.expand-btn.is-empty {
  border-style: dashed;
  opacity: 0.6;
}

.expand-btn.is-empty:hover {
  opacity: 1;
}

/* 빈 디렉토리 드롭 영역 */
.menu-children.is-empty {
  min-height: 40px;
}

.draggable-container {
  min-height: 4px;
}

.draggable-container.is-empty {
  min-height: 60px;
}

.empty-drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  transition: all 0.2s ease;
}

.empty-drop-zone .mdi {
  font-size: 16px;
}

.menu-children:has(.sortable-ghost) .empty-drop-zone,
.menu-children:has(.ghost) .empty-drop-zone {
  background: rgba(16, 185, 129, 0.08);
  border-color: #10b981;
  color: #10b981;
}

/* 트랜지션 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
