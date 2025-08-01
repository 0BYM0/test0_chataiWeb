<template>
  <div class="chat-container">
    <!-- 左侧边栏：会话历史 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h3>会话历史</h3>
        <t-button variant="text" shape="square" @click="toggleSidebar">
          <t-icon :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" />
        </t-button>
      </div>
      
      <t-button theme="primary" block class="new-chat-btn" @click="createNewConversation">
        <t-icon name="plus" /> 新建会话
      </t-button>
      
      <div class="conversation-list">
        <t-list>
          <t-list-item
            v-for="conversation in conversations"
            :key="conversation.id"
            :class="{ active: currentConversation?.id === conversation.id, 'local-only': conversation.isLocalOnly }"
            @click="selectConversation(conversation.id)"
          >
            <template #content>
              <div class="conversation-item">
                <t-icon name="chat" />
                <div class="conversation-info">
                  <div class="conversation-title">{{ getConversationTitle(conversation) }}</div>
                  <div class="conversation-time">{{ formatTime(conversation.updatedAt || conversation.createdAt) }}</div>
                </div>
                <t-tag v-if="conversation.isLocalOnly" theme="warning" size="small">本地</t-tag>
              </div>
            </template>
            
            <template #action>
              <t-dropdown :options="conversationOptions" @click="handleConversationAction($event, conversation.id)">
                <t-button variant="text" shape="square">
                  <t-icon name="more" />
                </t-button>
              </t-dropdown>
            </template>
          </t-list-item>
        </t-list>
        
        <div v-if="conversations.length === 0" class="empty-list">
          <t-icon name="chat" />
          <p>暂无会话记录</p>
        </div>
      </div>
      
      <div class="sidebar-footer">
        <t-dropdown :options="historyOptions" @click="handleHistoryAction">
          <t-button variant="text" block>
            <t-icon name="setting" /> 历史记录管理
          </t-button>
        </t-dropdown>
      </div>
    </div>
    
    <!-- 中央对话区 -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="chat-title">
          <h3>{{ currentAgentName }}</h3>
          <t-tag theme="primary" variant="light">{{ currentAgentRole }}</t-tag>
        </div>
        
        <div class="chat-actions">
          <t-tooltip content="清空对话">
            <t-button variant="text" shape="square" @click="clearMessages">
              <t-icon name="delete" />
            </t-button>
          </t-tooltip>
          
          <t-tooltip content="设置">
            <t-button variant="text" shape="square" @click="openSettings">
              <t-icon name="setting" />
            </t-button>
          </t-tooltip>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <template v-if="messages.length === 0">
          <div class="empty-chat">
            <t-icon name="chat" />
            <p>开始与智能体对话，探索人工智能知识</p>
            <t-button theme="primary" @click="showAgentSelector">选择智能体</t-button>
          </div>
        </template>
        
        <template v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.role === 'user' ? 'message-user' : 'message-agent']"
          >
            <div class="message-avatar">
              <t-avatar :image="getAvatarForRole(message.role)">
                {{ getInitialsForRole(message.role) }}
              </t-avatar>
            </div>
            
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">{{ getRoleName(message.role) }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              
              <div class="message-body" v-html="formatMessageContent(message.content)"></div>
            </div>
          </div>
          
          <div class="typing-indicator" v-if="isSending">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </template>
      </div>
      
      <div class="chat-input">
        <t-input
          v-model="messageInput"
          placeholder="输入消息，与智能体对话..."
          :maxlength="1000"
          :autofocus="true"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 5 }"
          @keydown.enter.prevent="handleEnterPress"
        />
        
        <div class="input-actions">
          <t-tooltip content="上传图片">
            <t-button variant="text" shape="square">
              <t-icon name="image" />
            </t-button>
          </t-tooltip>
          
          <t-tooltip content="知识库增强">
            <t-switch v-model="ragEnabled" size="small" />
          </t-tooltip>
          
          <t-button theme="primary" :loading="isSending" :disabled="!messageInput.trim()" @click="sendMessage">
            发送
          </t-button>
        </div>
      </div>
    </div>
    
    <!-- 右侧知识面板 -->
    <div class="knowledge-panel" :class="{ 'panel-collapsed': panelCollapsed }">
      <div class="panel-header">
        <h3>相关知识</h3>
        <t-button variant="text" shape="square" @click="togglePanel">
          <t-icon :name="panelCollapsed ? 'chevron-left' : 'chevron-right'" />
        </t-button>
      </div>
      
      <div class="panel-content">
        <template v-if="relatedKnowledge.length > 0">
          <t-collapse :default-value="['0']">
            <t-collapse-panel
              v-for="(item, index) in relatedKnowledge"
              :key="index"
              :value="String(index)"
              :header="item.title"
              :disabled="false"
            >
              <div class="knowledge-item">
                <p>{{ item.content }}</p>
                <t-link theme="primary" hover="color" @click="openKnowledgeDetail(item.id)">
                  查看详情
                </t-link>
              </div>
            </t-collapse-panel>
          </t-collapse>
        </template>
        
        <template v-else>
          <div class="empty-panel">
            <t-icon name="book" />
            <p>开始对话后，这里将显示相关知识点</p>
          </div>
        </template>
      </div>
      
      <div class="panel-footer">
        <h4>学习进度</h4>
        <div class="learning-progress">
          <t-progress :percentage="learningProgress" :color="{ '0%': '#2878FF', '100%': '#52C41A' }" />
          <div class="progress-text">
            <span>已学习知识点</span>
            <span>{{ knowledgePointsCovered }}/{{ totalKnowledgePoints }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 智能体选择对话框 -->
    <t-dialog
      v-model:visible="agentSelectorVisible"
      header="选择智能体"
      :width="600"
      :footer="false"
    >
      <div class="agent-selector">
        <t-radio-group v-model="selectedAgentId">
          <div class="agent-options">
            <t-radio-button
              v-for="agent in agents"
              :key="agent.id"
              :value="agent.id"
              class="agent-option"
            >
              <div class="agent-option-content">
                <t-avatar :image="agent.avatar">{{ agent.name.substring(0, 1) }}</t-avatar>
                <div class="agent-option-info">
                  <div class="agent-option-name">{{ agent.name }}</div>
                  <div class="agent-option-role">{{ agent.role }}</div>
                </div>
              </div>
            </t-radio-button>
          </div>
        </t-radio-group>
        
        <div class="agent-description">
          <h4>{{ selectedAgent?.name || '请选择智能体' }}</h4>
          <p>{{ selectedAgent?.description || '选择一个智能体开始对话' }}</p>
        </div>
        
        <div class="dialog-footer">
          <t-button theme="default" @click="agentSelectorVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmAgentSelection">确认</t-button>
        </div>
      </div>
    </t-dialog>
    
    <!-- 设置对话框 -->
    <t-dialog
      v-model:visible="settingsVisible"
      header="对话设置"
      :width="500"
      :footer="false"
    >
      <div class="settings-content">
        <t-form>
          <t-form-item label="知识库增强">
            <t-switch v-model="ragEnabled" />
            <div class="setting-description">启用后，智能体将使用知识库增强回答质量</div>
          </t-form-item>
          
          <t-form-item label="对话风格">
            <t-radio-group v-model="conversationStyle">
              <t-radio value="socratic">苏格拉底式对话</t-radio>
              <t-radio value="direct">直接解答</t-radio>
              <t-radio value="guided">引导式学习</t-radio>
            </t-radio-group>
          </t-form-item>
          
          <t-form-item label="难度级别">
            <t-slider v-model="difficultyLevel" :marks="difficultyMarks" :step="1" :min="1" :max="5" />
          </t-form-item>
        </t-form>
        
        <div class="dialog-footer">
          <t-button theme="default" @click="settingsVisible = false">取消</t-button>
          <t-button theme="primary" @click="saveSettings">保存设置</t-button>
        </div>
      </div>
    </t-dialog>
    
    <!-- 历史记录导入对话框 -->
    <t-dialog
      v-model:visible="importDialogVisible"
      header="导入历史记录"
      :width="500"
      :footer="false"
    >
      <div class="import-content">
        <t-upload
          v-model="uploadFile"
          :auto-upload="false"
          :multiple="false"
          :max-files="1"
          accept=".json"
          :placeholder="'请选择JSON文件'"
          :tips="'支持导入之前导出的对话历史记录JSON文件'"
        />
        
        <div class="dialog-footer">
          <t-button theme="default" @click="importDialogVisible = false">取消</t-button>
          <t-button theme="primary" @click="importHistory" :disabled="!uploadFile.length">导入</t-button>
        </div>
      </div>
    </t-dialog>
    
    <!-- 同步确认对话框 -->
    <t-dialog
      v-model:visible="syncDialogVisible"
      header="同步历史记录"
      :width="500"
      :footer="false"
    >
      <div class="sync-content">
        <p>您有 {{ localOnlyCount }} 条本地对话记录尚未同步到服务器。</p>
        <p>同步将把本地对话记录上传到服务器，并从服务器下载最新的对话记录。</p>
        <p>是否立即同步？</p>
        
        <div class="dialog-footer">
          <t-button theme="default" @click="syncDialogVisible = false">取消</t-button>
          <t-button theme="primary" @click="syncHistory" :loading="isSyncing">同步</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>

import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useChatStore } from '../../stores/chat'
import { MessagePlugin } from 'tdesign-vue-next'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { cacheManager } from '../../utils/fileUtils'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

// 状态变量
const sidebarCollapsed = ref(false)
const panelCollapsed = ref(false)
const messageInput = ref('')
const isLoading = ref(false)
const isSending = ref(false)
const isSyncing = ref(false)
const messagesContainer = ref(null)
const conversations = ref([])
const messages = ref([])
const currentConversation = ref(null)
const ragEnabled = ref(true)
const agentSelectorVisible = ref(false)
const settingsVisible = ref(false)
const importDialogVisible = ref(false)
const syncDialogVisible = ref(false)
const selectedAgentId = ref('')
const conversationStyle = ref('socratic')
const difficultyLevel = ref(3)
const uploadFile = ref([])

// 学习进度
const learningProgress = ref(65)
const knowledgePointsCovered = ref(24)
const totalKnowledgePoints = ref(40)

// 相关知识
const relatedKnowledge = ref([
  {
    id: 1,
    title: '人工智能基础概念',
    content: '人工智能(AI)是计算机科学的一个分支，致力于创建能够模拟人类智能行为的系统。'
  },
  {
    id: 2,
    title: '机器学习原理',
    content: '机器学习是人工智能的一个子领域，专注于开发能够从数据中学习并做出预测的算法。'
  },
  {
    id: 3,
    title: '神经网络结构',
    content: '神经网络是一种受人脑结构启发的计算模型，由多层互连的节点(神经元)组成。'
  }
])

// 难度级别标记
const difficultyMarks = {
  1: '入门',
  2: '基础',
  3: '中级',
  4: '进阶',
  5: '专家'
}

// 智能体列表
const agents = [
  {
    id: 'expert',
    name: '专家智能体',
    role: '评估标准制定者',
    description: '帮助你制定学习目标和评估标准，根据你的学习历史动态调整任务难度。',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg'
  },
  {
    id: 'assistant',
    name: '助教智能体',
    role: '学习资源提供者',
    description: '提供多元化学习资源，将复杂任务分解为清晰步骤，给予基于量规的诊断反馈。',
    avatar: 'https://tdesign.gtimg.com/site/avatar-2.jpg'
  },
  {
    id: 'peer',
    name: '同伴智能体',
    role: '学习伙伴',
    description: '展示思考过程，模拟常见错误并进行自我修正，帮助你理解学习中的关键点。',
    avatar: 'https://tdesign.gtimg.com/site/avatar-3.jpg'
  },
  {
    id: 'group',
    name: '群聊管理器',
    role: '对话引导者',
    description: '组织多智能体协同对话，提供过渡性总结，确保学习过程的连贯性和有效性。',
    avatar: 'https://tdesign.gtimg.com/site/avatar-4.jpg'
  }
]

// 会话操作选项
const conversationOptions = [
  {
    content: '重命名',
    value: 'rename'
  },
  {
    content: '导出对话',
    value: 'export'
  },
  {
    content: '删除',
    value: 'delete'
  }
]

// 历史记录管理选项
const historyOptions = [
  {
    content: '导出所有历史',
    value: 'exportAll'
  },
  {
    content: '导入历史记录',
    value: 'import'
  },
  {
    content: '同步历史记录',
    value: 'sync'
  },
  {
    content: '清空本地历史',
    value: 'clearAll'
  }
]

// 计算属性
const selectedAgent = computed(() => {
  return agents.find(agent => agent.id === selectedAgentId.value)
})

const currentAgentName = computed(() => {
  if (!currentConversation.value) return '智能对话'
  
  const agentRole = currentConversation.value.agentRole || 'assistant'
  const agent = agents.find(a => a.id === agentRole)
  return agent ? agent.name : '智能对话'
})

const currentAgentRole = computed(() => {
  if (!currentConversation.value) return ''
  
  const agentRole = currentConversation.value.agentRole || 'assistant'
  const agent = agents.find(a => a.id === agentRole)
  return agent ? agent.role : ''
})

const localOnlyCount = computed(() => {
  return conversations.value.filter(c => c.isLocalOnly).length
})

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const togglePanel = () => {
  panelCollapsed.value = !panelCollapsed.value
}

const createNewConversation = async () => {
  agentSelectorVisible.value = true
}

const showAgentSelector = () => {
  agentSelectorVisible.value = true
}

const confirmAgentSelection = async () => {
  if (!selectedAgentId.value) {
    MessagePlugin.warning('请选择一个智能体')
    return
  }
  
  try {
    isLoading.value = true
    
    // 创建新对话
    const newConversation = await chatStore.createConversation(`与${selectedAgent.value.name}的对话`)
    
    // 更新对话信息
    newConversation.agentRole = selectedAgentId.value
    
    // 更新状态
    currentConversation.value = newConversation
    messages.value = []
    
    // 关闭对话框
    agentSelectorVisible.value = false
    
    // 添加系统欢迎消息
    const welcomeMessage = {
      id: `system-${Date.now()}`,
      conversationId: newConversation.id,
      content: getWelcomeMessage(selectedAgentId.value),
      role: selectedAgentId.value,
      timestamp: new Date().toISOString()
    }
    
    messages.value.push(welcomeMessage)
    
    // 更新对话中的消息
    if (newConversation.messages) {
      newConversation.messages.push(welcomeMessage)
    } else {
      newConversation.messages = [welcomeMessage]
    }
    
    // 保存到缓存
    chatStore.saveToCache()
    
    // 重置选择
    selectedAgentId.value = ''
  } catch (error) {
    console.error('创建对话失败:', error)
    MessagePlugin.error('创建对话失败，请稍后再试')
  } finally {
    isLoading.value = false
  }
}

const selectConversation = async (conversationId) => {
  try {
    isLoading.value = true
    
    // 获取对话详情
    await chatStore.fetchConversation(conversationId)
    
    // 更新状态
    currentConversation.value = chatStore.currentConversation
    messages.value = chatStore.messages
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载对话失败:', error)
    MessagePlugin.error('加载对话失败，请稍后再试')
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!messageInput.value.trim()) return
  
  if (!currentConversation.value) {
    showAgentSelector()
    return
  }
  
  try {
    isSending.value = true
    
    // 发送消息
    await chatStore.sendMessage(messageInput.value)
    
    // 更新消息列表
    messages.value = chatStore.messages
    
    // 清空输入框
    messageInput.value = ''
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    MessagePlugin.error('发送消息失败，请稍后再试')
  } finally {
    isSending.value = false
  }
}

const handleEnterPress = (event) => {
  // 如果按下Shift+Enter，则插入换行符
  if (event.shiftKey) return
  
  // 否则发送消息
  sendMessage()
}

const clearMessages = () => {
  if (!currentConversation.value) return
  
  // 清空消息
  messages.value = []
  
  // 添加系统消息
  const systemMessage = {
    id: `system-${Date.now()}`,
    conversationId: currentConversation.value.id,
    content: '对话已清空，您可以开始新的对话。',
    role: 'system',
    timestamp: new Date().toISOString()
  }
  
  messages.value.push(systemMessage)
  
  // 更新对话中的消息
  currentConversation.value.messages = [systemMessage]
  
  // 保存到缓存
  chatStore.saveToCache()
}

const openSettings = () => {
  settingsVisible.value = true
}

const saveSettings = () => {
  // 保存设置
  MessagePlugin.success('设置已保存')
  settingsVisible.value = false
}

const handleConversationAction = async (data, conversationId) => {
  const { value } = data
  
  if (value === 'rename') {
    // 重命名对话
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return
    
    // 使用对话框获取新名称
    MessagePlugin.prompt('请输入新的对话名称', {
      confirmBtn: '确认',
      cancelBtn: '取消',
      defaultValue: conversation.title,
      onConfirm: async (value) => {
        if (!value.trim()) return
        
        try {
          // 更新对话名称
          conversation.title = value.trim()
          
          // 如果是当前对话，更新当前对话
          if (currentConversation.value && currentConversation.value.id === conversationId) {
            currentConversation.value.title = value.trim()
          }
          
          // 保存到缓存
          chatStore.saveToCache()
          
          MessagePlugin.success('重命名成功')
        } catch (error) {
          console.error('重命名失败:', error)
          MessagePlugin.error('重命名失败，请稍后再试')
        }
      }
    })
  } else if (value === 'export') {
    // 导出对话
    try {
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (!conversation) return
      
      // 导出为JSON文件
      const fileName = `对话_${conversation.title || conversationId}_${new Date().toISOString().split('T')[0]}.json`
      const json = JSON.stringify(conversation, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      MessagePlugin.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      MessagePlugin.error('导出失败，请稍后再试')
    }
  } else if (value === 'delete') {
    // 删除对话
    try {
      await chatStore.deleteConversation(conversationId)
      
      // 更新列表
      conversations.value = chatStore.conversations
      
      // 如果删除的是当前对话，清空当前对话
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = null
        messages.value = []
      }
      
      MessagePlugin.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      MessagePlugin.error('删除失败，请稍后再试')
    }
  }
}

const handleHistoryAction = (data) => {
  const { value } = data
  
  if (value === 'exportAll') {
    // 导出所有历史
    exportAllHistory()
  } else if (value === 'import') {
    // 导入历史记录
    importDialogVisible.value = true
  } else if (value === 'sync') {
    // 同步历史记录
    syncDialogVisible.value = true
  } else if (value === 'clearAll') {
    // 清空本地历史
    MessagePlugin.confirm('确定要清空所有本地历史记录吗？此操作不可恢复。', {
      confirmBtn: '确认清空',
      cancelBtn: '取消',
      theme: 'warning',
      onConfirm: () => {
        clearAllHistory()
      }
    })
  }
}

const exportAllHistory = () => {
  try {
    const result = chatStore.exportConversationHistory()
    
    if (result) {
      MessagePlugin.success('导出成功')
    } else {
      MessagePlugin.error('导出失败，请稍后再试')
    }
  } catch (error) {
    console.error('导出失败:', error)
    MessagePlugin.error('导出失败，请稍后再试')
  }
}

const importHistory = async () => {
  if (!uploadFile.value.length) {
    MessagePlugin.warning('请选择要导入的文件')
    return
  }
  
  try {
    isLoading.value = true
    
    const file = uploadFile.value[0].raw
    const result = await chatStore.importConversationHistory(file)
    
    if (result) {
      // 重新加载对话列表
      conversations.value = chatStore.conversations
      
      MessagePlugin.success('导入成功')
      importDialogVisible.value = false
    } else {
      MessagePlugin.error('导入失败，请检查文件格式')
    }
  } catch (error) {
    console.error('导入失败:', error)
    MessagePlugin.error('导入失败，请稍后再试')
  } finally {
    isLoading.value = false
    uploadFile.value = []
  }
}

const syncHistory = async () => {
  try {
    isSyncing.value = true
    
    // 先同步到服务器
    await chatStore.syncHistoryToServer()
    
    // 再从服务器同步
    await chatStore.syncHistoryFromServer()
    
    // 更新列表
    conversations.value = chatStore.conversations
    
    MessagePlugin.success('同步成功')
    syncDialogVisible.value = false
  } catch (error) {
    console.error('同步失败:', error)
    MessagePlugin.error('同步失败，请稍后再试')
  } finally {
    isSyncing.value = false
  }
}

const clearAllHistory = async () => {
  try {
    isLoading.value = true
    
    // 获取用户ID
    const userId = userStore.user?.id
    
    if (userId) {
      // 清空缓存
      cacheManager.clearAllConversationHistory(userId)
      
      // 重新加载对话列表
      await chatStore.initialize()
      conversations.value = chatStore.conversations
      
      // 清空当前对话
      currentConversation.value = null
      messages.value = []
      
      MessagePlugin.success('清空成功')
    }
  } catch (error) {
    console.error('清空失败:', error)
    MessagePlugin.error('清空失败，请稍后再试')
  } finally {
    isLoading.value = false
  }
}

const getConversationTitle = (conversation) => {
  // 获取对话标题，如果没有标题则使用默认标题
  if (conversation.title) return conversation.title
  
  // 根据智能体角色生成默认标题
  const agentRole = conversation.agentRole || 'assistant'
  const agent = agents.find(a => a.id === agentRole)
  const agentName = agent ? agent.name : '智能体'
  
  return `与${agentName}的对话`
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  // 今天内
  if (diffDay === 0) {
    if (diffHour === 0) {
      if (diffMin === 0) {
        return '刚刚'
      }
      return `${diffMin}分钟前`
    }
    return `${diffHour}小时前`
  }
  
  // 昨天
  if (diffDay === 1) {
    return '昨天'
  }
  
  // 一周内
  if (diffDay < 7) {
    return `${diffDay}天前`
  }
  
  // 超过一周
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getAvatarForRole = (role) => {
  // 根据角色获取头像
  if (role === 'user') {
    return userStore.user?.avatar || ''
  }
  
  const agent = agents.find(a => a.id === role)
  return agent?.avatar || ''
}

const getInitialsForRole = (role) => {
  // 根据角色获取首字母
  if (role === 'user') {
    return userStore.user?.name?.substring(0, 1) || 'U'
  }
  
  const agent = agents.find(a => a.id === role)
  return agent?.name?.substring(0, 1) || role.substring(0, 1).toUpperCase()
}

const getRoleName = (role) => {
  // 根据角色获取名称
  if (role === 'user') {
    return userStore.user?.name || '我'
  }
  
  if (role === 'system') {
    return '系统'
  }
  
  const agent = agents.find(a => a.id === role)
  return agent?.name || '智能体'
}

const formatMessageContent = (content) => {
  // 格式化消息内容，支持Markdown
  if (!content) return ''
  
  // 使用DOMPurify清理HTML，防止XSS攻击
  return DOMPurify.sanitize(marked(content))
}

const scrollToBottom = () => {
  // 滚动到底部
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getWelcomeMessage = (agentId) => {
  // 根据智能体类型获取欢迎消息
  switch (agentId) {
    case 'expert':
      return '你好！我是专家智能体，我将帮助你制定学习目标和评估标准。请告诉我你想学习的人工智能知识领域，我会为你定制学习计划。'
    case 'assistant':
      return '你好！我是助教智能体，我将为你提供多元化的学习资源，并将复杂任务分解为清晰步骤。有什么人工智能相关的问题，都可以问我！'
    case 'peer':
      return '嗨！我是同伴智能体，我会和你一起学习，展示我的思考过程，甚至可能犯一些常见错误并进行自我修正。让我们一起探索人工智能的奥秘吧！'
    case 'group':
      return '欢迎！我是群聊管理器，我将组织多智能体协同对话，提供过渡性总结，确保你的学习过程连贯有效。请选择一个话题，我们开始多智能体讨论吧！'
    default:
      return '欢迎使用AI教育平台！请问有什么可以帮助你的？'
  }
}

const openKnowledgeDetail = (knowledgeId) => {
  // 打开知识详情
  MessagePlugin.info(`查看知识点ID: ${knowledgeId}`)
  // TODO: 实现知识详情页面
}

// 生命周期钩子
onMounted(async () => {
  try {
    isLoading.value = true
    
    // 初始化聊天状态
    await chatStore.initialize()
    
    // 获取对话列表
    conversations.value = chatStore.conversations
    
    // 如果URL中有conversationId参数，则加载该对话
    const conversationId = route.query.id
    if (conversationId) {
      await selectConversation(conversationId)
    }
  } catch (error) {
    console.error('初始化失败:', error)
    MessagePlugin.error('加载对话历史失败，请稍后再试')
  } finally {
    isLoading.value = false
  }
})

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

// 监听路由变化
watch(
  () => route.query.id,
  async (newId) => {
    if (newId && (!currentConversation.value || currentConversation.value.id !== newId)) {
      await selectConversation(newId)
    }
  }
)
</script>
