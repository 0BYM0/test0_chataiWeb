<template>
  <div class="classroom-container">
    <t-card :bordered="false">
      <!-- 页面标题和操作按钮 -->
      <div class="header">
        <h2>班级管理</h2>
        <t-button @click="openCreateDialog">
          <t-icon name="add" />
          创建新班级
        </t-button>
      </div>

      <!-- 加载状态和错误提示 -->
      <t-loading :loading="isLoading" text="加载中..." size="small">
        <div v-if="error" class="error-message">
          <t-alert theme="error" :message="error" />
        </div>

        <!-- 班级列表 -->
        <div v-if="!isLoading && classrooms.length > 0" class="classroom-grid">
          <t-card
            v-for="classroom in classrooms"
            :key="classroom.id"
            class="classroom-card"
            shadow
            hover-shadow
            @click="selectClassroom(classroom.id)"
          >
            <template #header>
              <div class="card-header">
                <t-icon name="usergroup" />
                <span class="classroom-name">{{ classroom.name }}</span>
              </div>
            </template>
            <template #actions>
              <t-dropdown :options="classroomMenuOptions" @click="(data) => handleClassroomAction(data, classroom)">
                <t-button variant="text" shape="square">
                  <t-icon name="more" />
                </t-button>
              </t-dropdown>
            </template>
            <div class="card-content">
              <p>{{ classroom.description || '暂无描述' }}</p>
              <div class="student-count">
                <t-icon name="user" />
                <span>{{ classroom.studentCount || 0 }} 名学生</span>
              </div>
            </div>
          </t-card>
        </div>

        <!-- 空状态 -->
        <div v-if="!isLoading && classrooms.length === 0" class="empty-state">
          <t-icon name="usergroup" size="large" />
          <p>暂无班级，快去创建一个吧！</p>
        </div>
      </t-loading>
    </t-card>

    <!-- 班级详情侧边栏 -->
    <t-drawer
      v-model:visible="drawerVisible"
      :header="currentClassroom ? `班级详情: ${currentClassroom.name}` : '班级详情'"
      size="500px"
      :footer="false"
      @close="handleDrawerClose"
    >
      <div v-if="currentClassroom" class="drawer-content">
        <h4>学生列表</h4>
        <t-list v-if="currentClassroom.students && currentClassroom.students.length > 0">
          <t-list-item v-for="student in currentClassroom.students" :key="student.id">
            <t-list-item-meta :title="student.name" :description="`学号: ${student.studentId}`" />
            <template #action>
              <t-button variant="text" theme="danger" @click="removeStudent(student.id)">移除</t-button>
            </template>
          </t-list-item>
        </t-list>
        <div v-else class="empty-state">
          <p>该班级暂无学生</p>
        </div>
        <t-divider />
        <h4>添加学生</h4>
        <div class="add-student-form">
          <t-input v-model="studentIdToAdd" placeholder="请输入学生ID或学号" />
          <t-button @click="addStudent">添加</t-button>
        </div>
      </div>
    </t-drawer>

    <!-- 创建/编辑班级对话框 -->
    <t-dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? '编辑班级' : '创建新班级'"
      width="500px"
      @confirm="handleDialogConfirm"
    >
      <t-form ref="form" :data="formData" :rules="formRules">
        <t-form-item label="班级名称" name="name">
          <t-input v-model="formData.name" placeholder="请输入班级名称" />
        </t-form-item>
        <t-form-item label="班级描述" name="description">
          <t-textarea v-model="formData.description" placeholder="请输入班级描述" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useClassroomStore } from '../../stores/classroom'
import { MessagePlugin } from 'tdesign-vue-next'

const classroomStore = useClassroomStore()

// 响应式状态
const isLoading = ref(false)
const drawerVisible = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const studentIdToAdd = ref('')
const form = ref(null)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  description: ''
})

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '班级名称不能为空', trigger: 'blur' }]
}

// 计算属性
const classrooms = computed(() => classroomStore.classrooms)
const currentClassroom = computed(() => classroomStore.currentClassroom)
const error = computed(() => classroomStore.error)

// 班级卡片操作菜单
const classroomMenuOptions = [
  { content: '编辑信息', value: 'edit' },
  { content: '删除班级', value: 'delete', theme: 'error' }
]

// 生命周期钩子
onMounted(async () => {
  await fetchClassrooms()
})

// 方法
const fetchClassrooms = async () => {
  isLoading.value = true
  try {
    await classroomStore.fetchClassrooms()
  } catch (err) {
    MessagePlugin.error(err.message || '获取班级列表失败')
  } finally {
    isLoading.value = false
  }
}

const selectClassroom = async (classroomId) => {
  isLoading.value = true
  try {
    await classroomStore.fetchClassroom(classroomId)
    drawerVisible.value = true
  } catch (err) {
    MessagePlugin.error(err.message || '获取班级详情失败')
  } finally {
    isLoading.value = false
  }
}

const openCreateDialog = () => {
  isEditing.value = false
  formData.value = { id: null, name: '', description: '' }
  dialogVisible.value = true
}

const openEditDialog = (classroom) => {
  isEditing.value = true
  formData.value = { ...classroom }
  dialogVisible.value = true
}

const handleDialogConfirm = async () => {
  const result = await form.value.validate()
  if (result === true) {
    isLoading.value = true
    try {
      if (isEditing.value) {
        await classroomStore.updateClassroom(formData.value.id, formData.value)
        MessagePlugin.success('更新成功')
      } else {
        await classroomStore.createClassroom(formData.value)
        MessagePlugin.success('创建成功')
      }
      dialogVisible.value = false
      await fetchClassrooms()
    } catch (err) {
      MessagePlugin.error(err.message || '操作失败')
    } finally {
      isLoading.value = false
    }
  }
}

const handleClassroomAction = (data, classroom) => {
  if (data.value === 'edit') {
    openEditDialog(classroom)
  } else if (data.value === 'delete') {
    deleteClassroom(classroom.id)
  }
}

const deleteClassroom = (classroomId) => {
  MessagePlugin.confirm('确定要删除这个班级吗？此操作不可恢复。', {
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    theme: 'warning',
    onConfirm: async () => {
      isLoading.value = true
      try {
        await classroomStore.deleteClassroom(classroomId)
        MessagePlugin.success('删除成功')
        await fetchClassrooms()
      } catch (err) {
        MessagePlugin.error(err.message || '删除失败')
      } finally {
        isLoading.value = false
      }
    }
  })
}

const addStudent = async () => {
  if (!studentIdToAdd.value.trim()) {
    MessagePlugin.warning('请输入学生ID')
    return
  }
  isLoading.value = true
  try {
    await classroomStore.addStudentToClassroom(currentClassroom.value.id, studentIdToAdd.value)
    MessagePlugin.success('添加成功')
    studentIdToAdd.value = ''
    // 重新获取班级详情以更新学生列表
    await classroomStore.fetchClassroom(currentClassroom.value.id)
  } catch (err) {
    MessagePlugin.error(err.message || '添加学生失败')
  } finally {
    isLoading.value = false
  }
}

const removeStudent = async (studentId) => {
  isLoading.value = true
  try {
    await classroomStore.removeStudentFromClassroom(currentClassroom.value.id, studentId)
    MessagePlugin.success('移除成功')
    // 重新获取班级详情以更新学生列表
    await classroomStore.fetchClassroom(currentClassroom.value.id)
  } catch (err) {
    MessagePlugin.error(err.message || '移除学生失败')
  } finally {
    isLoading.value = false
  }
}

const handleDrawerClose = () => {
  classroomStore.clearCurrentClassroom()
}
</script>

<style scoped>
.classroom-container {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.classroom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.classroom-card {
  cursor: pointer;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.classroom-name {
  font-weight: bold;
}

.card-content p {
  margin-bottom: 12px;
  color: var(--td-text-color-secondary);
}

.student-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--td-text-color-secondary);
}

.drawer-content {
  padding: 16px;
}

.add-student-form {
  display: flex;
  gap: 8px;
}

.error-message {
  margin-bottom: 20px;
}
</style>