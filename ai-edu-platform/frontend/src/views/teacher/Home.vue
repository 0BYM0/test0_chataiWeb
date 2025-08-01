<template>
  <div class="teacher-home-container">
    <!-- 欢迎头部 -->
    <div class="welcome-header">
      <t-card :bordered="false">
        <div class="header-content">
          <t-avatar :image="userStore.user?.avatar" size="large">{{ userStore.user?.name?.substring(0, 1) }}</t-avatar>
          <div class="header-text">
            <h3>{{ userStore.user?.name }}老师，欢迎您！</h3>
            <p>今天也要元气满满地投入到AI教学中哦！</p>
          </div>
        </div>
      </t-card>
    </div>

    <!-- 数据概览 -->
    <div class="stats-grid">
      <t-card title="我的班级" class="stat-card">
        <div class="stat-content">
          <t-icon name="usergroup" class="stat-icon" />
          <p>共管理 <strong>{{ classroomCount }}</strong> 个班级</p>
          <t-link theme="primary" @click="goToClassrooms">管理班级</t-link>
        </div>
      </t-card>
      <t-card title="我的学生" class="stat-card">
        <div class="stat-content">
          <t-icon name="user" class="stat-icon" />
          <p>总计 <strong>{{ totalStudents }}</strong> 名学生</p>
        </div>
      </t-card>
      <t-card title="我的教案" class="stat-card">
        <div class="stat-content">
          <t-icon name="file-paste" class="stat-icon" />
          <p>已创建 <strong>{{ lessonPlanCount }}</strong> 份教案</p>
          <t-link theme="primary" @click="goToLessonPlans">管理教案</t-link>
        </div>
      </t-card>
    </div>

    <!-- 快捷操作 -->
    <t-card title="快捷操作" class="quick-actions-card">
      <div class="quick-actions-grid">
        <div class="quick-action-item" @click="createLessonPlan">
          <t-icon name="file-add" class="quick-action-icon" />
          <h4>创建新教案</h4>
          <p>使用AI助手快速生成教学设计。</p>
        </div>
        <div class="quick-action-item" @click="createClassroom">
          <t-icon name="add" class="quick-action-icon" />
          <h4>创建新班级</h4>
          <p>为新学期或新课程创建班级。</p>
        </div>
        <div class="quick-action-item" @click="viewStudentProgress">
          <t-icon name="chart-bar" class="quick-action-icon" />
          <h4>查看学情</h4>
          <p>分析学生的学习进度和掌握情况。</p>
        </div>
      </div>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { useClassroomStore } from '../../stores/classroom';
import { useLessonPlanStore } from '../../stores/lessonPlan';

const router = useRouter();
const userStore = useUserStore();
const classroomStore = useClassroomStore();
const lessonPlanStore = useLessonPlanStore();

// 响应式状态
const isLoading = ref(false);

// 计算属性
const classroomCount = computed(() => classroomStore.classrooms.length);
const totalStudents = computed(() => {
  return classroomStore.classrooms.reduce((total, classroom) => total + (classroom.studentCount || 0), 0);
});
const lessonPlanCount = computed(() => lessonPlanStore.lessonPlans.length);

// 生命周期钩子
onMounted(async () => {
  isLoading.value = true;
  try {
    // 并行获取数据
    await Promise.all([
      classroomStore.fetchClassrooms(),
      lessonPlanStore.fetchLessonPlans()
    ]);
  } catch (error) {
    console.error('加载主页数据失败:', error);
  } finally {
    isLoading.value = false;
  }
});

// 方法
const goToClassrooms = () => {
  router.push({ name: 'Classroom' });
};

const goToLessonPlans = () => {
  router.push({ name: 'LessonPlan' });
};

const createLessonPlan = () => {
  router.push({ name: 'LessonPlan' });
};

const createClassroom = () => {
  // TODO: 可以考虑在班级管理页面直接弹出创建对话框
  router.push({ name: 'Classroom' });
};

const viewStudentProgress = () => {
  // TODO: 跳转到学情分析页面
  console.log('跳转到学情分析页面');
};
</script>

<style scoped>
.teacher-home-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-header .header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-header .header-text {
  flex: 1;
}

.welcome-header h3 {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.welcome-header p {
  color: var(--td-text-color-secondary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card .stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  height: 150px;
}

.stat-icon {
  font-size: 48px;
  color: var(--td-brand-color);
}

.quick-actions-card .quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.quick-action-item {
  padding: 20px;
  text-align: center;
  border-radius: var(--td-radius-medium);
  background-color: var(--td-bg-color-container-hover);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-item:hover {
  transform: translateY(-5px);
  box-shadow: var(--td-shadow-1);
}

.quick-action-icon {
  font-size: 36px;
  color: var(--td-brand-color);
  margin-bottom: 12px;
}

.quick-action-item h4 {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.quick-action-item p {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  margin: 0;
}
</style>