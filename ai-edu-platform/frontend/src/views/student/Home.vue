<template>
  <div class="student-home-container">
    <!-- 欢迎头部 -->
    <div class="welcome-header">
      <t-card :bordered="false">
        <div class="header-content">
          <t-avatar :image="userStore.user?.avatar" size="large">{{ userStore.user?.name?.substring(0, 1) }}</t-avatar>
          <div class="header-text">
            <h3>欢迎回来，{{ userStore.user?.name }}同学！</h3>
            <p>今天又是充满好奇心的一天，准备好探索人工智能的奥秘了吗？</p>
          </div>
          <t-button theme="primary" size="large" @click="startChat">
            <t-icon name="chat" />
            开始新的学习对话
          </t-button>
        </div>
      </t-card>
    </div>

    <!-- 学习统计 -->
    <div class="stats-grid">
      <t-card title="学习进度" class="stat-card">
        <div class="stat-content">
          <t-progress theme="circle" :percentage="learningProgress" :label="`${learningProgress}%`" />
          <p>已完成 <strong>{{ completedTasks }}</strong> 个学习任务</p>
        </div>
      </t-card>
      <t-card title="知识点掌握" class="stat-card">
        <div class="stat-content">
          <t-icon name="book-open" class="stat-icon" />
          <p>已掌握 <strong>{{ knowledgePointsCovered }}</strong> 个知识点</p>
          <t-link theme="primary" @click="viewKnowledgeBase">查看知识库</t-link>
        </div>
      </t-card>
      <t-card title="最近对话" class="stat-card">
        <div class="stat-content">
          <t-icon name="history" class="stat-icon" />
          <p>最近与 <strong>{{ lastAgent }}</strong> 进行了对话</p>
          <t-link theme="primary" @click="viewLastConversation">查看对话</t-link>
        </div>
      </t-card>
    </div>

    <!-- 快速开始 -->
    <t-card title="快速开始" class="quick-start-card">
      <div class="quick-start-grid">
        <div class="quick-start-item" @click="startChatWith('assistant')">
          <t-icon name="help-circle" class="quick-start-icon" />
          <h4>提问助教</h4>
          <p>有具体问题？直接问助教智能体。</p>
        </div>
        <div class="quick-start-item" @click="startChatWith('peer')">
          <t-icon name="usergroup" class="quick-start-icon" />
          <h4>与同伴学习</h4>
          <p>和同伴智能体一起解决问题。</p>
        </div>
        <div class="quick-start-item" @click="startChatWith('expert')">
          <t-icon name="star" class="quick-start-icon" />
          <h4>挑战专家</h4>
          <p>制定新的学习目标和计划。</p>
        </div>
      </div>
    </t-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import { useChatStore } from '../../stores/chat';

const router = useRouter();
const userStore = useUserStore();
const chatStore = useChatStore();

// 模拟数据
const learningProgress = ref(75);
const completedTasks = ref(12);
const knowledgePointsCovered = ref(35);
const lastAgent = ref('助教智能体');
const lastConversationId = ref(chatStore.conversations[0]?.id || null);

// 方法
const startChat = () => {
  router.push({ name: 'StudentChat' });
};

const startChatWith = (agentRole) => {
  // TODO: 实现带特定智能体开始聊天的逻辑
  // 可以在 chatStore 中添加一个方法来处理
  chatStore.setNextAgent(agentRole);
  router.push({ name: 'StudentChat' });
};

const viewKnowledgeBase = () => {
  // TODO: 跳转到知识库页面
  console.log('跳转到知识库页面');
};

const viewLastConversation = () => {
  if (lastConversationId.value) {
    router.push({ name: 'StudentChat', params: { conversationId: lastConversationId.value } });
  } else {
    startChat();
  }
};
</script>

<style scoped>
.student-home-container {
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

.quick-start-card .quick-start-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.quick-start-item {
  padding: 20px;
  text-align: center;
  border-radius: var(--td-radius-medium);
  background-color: var(--td-bg-color-container-hover);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-start-item:hover {
  transform: translateY(-5px);
  box-shadow: var(--td-shadow-1);
}

.quick-start-icon {
  font-size: 36px;
  color: var(--td-brand-color);
  margin-bottom: 12px;
}

.quick-start-item h4 {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.quick-start-item p {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  margin: 0;
}
</style>