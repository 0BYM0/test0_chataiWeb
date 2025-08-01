<template>
  <div class="lesson-plan-container">
    <!-- 左侧表单区域 -->
    <div class="form-panel">
      <h2 class="panel-title">教案生成</h2>
      <t-form ref="form" :data="formData" :rules="rules" @submit="onSubmit">
        <t-form-item label="学段与年级" name="grade">
          <t-select v-model="formData.grade" placeholder="请选择学段与年级">
            <t-option v-for="grade in gradeOptions" :key="grade.value" :value="grade.value" :label="grade.label" />
          </t-select>
        </t-form-item>
        
        <t-form-item label="课程模块" name="module">
          <t-select v-model="formData.module" placeholder="请选择课程模块">
            <t-option v-for="module in moduleOptions" :key="module.value" :value="module.value" :label="module.label" />
          </t-select>
        </t-form-item>
        
        <t-form-item label="核心知识点" name="knowledgePoint">
          <t-select v-model="formData.knowledgePoint" placeholder="请选择核心知识点" filterable>
            <t-option v-for="point in knowledgePointOptions" :key="point.value" :value="point.value" :label="point.label" />
          </t-select>
        </t-form-item>
        
        <t-form-item label="课时" name="duration">
          <t-input-number v-model="formData.duration" :min="1" :max="10" theme="normal" />
          <span class="input-suffix">课时（每课时40分钟）</span>
        </t-form-item>
        
        <t-form-item label="教学偏好" name="preferences">
          <t-checkbox-group v-model="formData.preferences">
            <t-checkbox value="project">项目式学习</t-checkbox>
            <t-checkbox value="inquiry">探究式学习</t-checkbox>
            <t-checkbox value="unplugged">不插电活动优先</t-checkbox>
            <t-checkbox value="cooperative">合作学习</t-checkbox>
            <t-checkbox value="gamification">游戏化教学</t-checkbox>
          </t-checkbox-group>
        </t-form-item>
        
        <t-form-item label="自定义要求" name="customRequirements">
          <t-textarea
            v-model="formData.customRequirements"
            placeholder="请输入您的特殊教学要求或补充说明..."
            :maxlength="500"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </t-form-item>
        
        <t-form-item>
          <div class="form-operations">
            <t-checkbox v-model="formData.useRAG">使用知识库增强</t-checkbox>
            <div>
              <t-button theme="default" variant="base" @click="resetForm">重置</t-button>
              <t-button theme="primary" type="submit" :loading="isGenerating">生成教案</t-button>
            </div>
          </div>
        </t-form-item>
      </t-form>
      
      <div class="history-plans">
        <div class="history-header">
          <h3>历史教案</h3>
          <div class="history-actions">
            <t-tooltip content="同步历史教案">
              <t-button variant="text" shape="square" @click="syncHistoryPlans" :loading="isSyncing">
                <t-icon name="swap" />
              </t-button>
            </t-tooltip>
            <t-tooltip content="刷新">
              <t-button variant="text" shape="square" @click="refreshHistoryPlans">
                <t-icon name="refresh" />
              </t-button>
            </t-tooltip>
          </div>
        </div>
        
        <t-list>
          <t-list-item
            v-for="plan in historyPlans"
            :key="plan.id"
            :class="{ 'local-only': plan.isLocalOnly }"
            @click="loadHistoryPlan(plan.id)"
          >
            <template #content>
              <div class="history-item">
                <div class="history-item-title">{{ plan.title }}</div>
                <div class="history-item-meta">
                  <span>{{ plan.grade }} | {{ plan.module }}</span>
                  <span>{{ formatDate(plan.createdAt) }}</span>
                </div>
                <t-tag v-if="plan.isLocalOnly" theme="warning" size="small">本地</t-tag>
              </div>
            </template>
            <template #action>
              <t-dropdown :options="planOptions" @click="handlePlanAction($event, plan.id)">
                <t-button variant="text" shape="square">
                  <t-icon name="more" />
                </t-button>
              </t-dropdown>
            </template>
          </t-list-item>
        </t-list>
        
        <div v-if="historyPlans.length === 0" class="empty-history">
          <t-icon name="file-copy" />
          <p>暂无历史教案</p>
        </div>
      </div>
    </div>
    
    <!-- 右侧预览区域 -->
    <div class="preview-panel">
      <div class="preview-header">
        <div class="preview-title">
          <h2>{{ currentPlan.title || '教案预览' }}</h2>
          <div class="preview-tags">
            <t-tag theme="primary" variant="light" v-if="currentPlan.id">已保存</t-tag>
            <t-tag theme="warning" variant="light" v-if="currentPlan.isLocalOnly">本地</t-tag>
          </div>
        </div>
        
        <div class="preview-actions">
          <t-tooltip content="导出为Word">
            <t-button variant="text" shape="square" @click="exportToWord">
              <t-icon name="file-word" />
            </t-button>
          </t-tooltip>
          
          <t-tooltip content="导出为PDF">
            <t-button variant="text" shape="square" @click="exportToPDF">
              <t-icon name="file-pdf" />
            </t-button>
          </t-tooltip>
          
          <t-tooltip content="保存教案">
            <t-button variant="text" shape="square" @click="saveLessonPlan">
              <t-icon name="save" />
            </t-button>
          </t-tooltip>
        </div>
      </div>
      
      <div class="preview-content" v-if="isGenerating">
        <div class="generating-indicator">
          <t-loading theme="dots" size="large" />
          <p>正在生成教案，请稍候...</p>
        </div>
      </div>
      
      <div class="preview-content" v-else-if="!currentPlan.content">
        <div class="empty-preview">
          <t-icon name="file-copy" />
          <p>填写左侧表单并点击"生成教案"按钮开始创建</p>
        </div>
      </div>
      
      <div class="preview-content" v-else>
        <div class="lesson-plan">
          <div class="plan-section">
            <div class="section-header">
              <h3>教学目标</h3>
              <t-button variant="text" size="small" @click="openEditDialog('objectives')">
                <t-icon name="edit" />编辑
              </t-button>
            </div>
            <div class="objectives">
              <div v-for="(objective, index) in currentPlan.objectives" :key="index" class="objective-item">
                <t-tag theme="primary" variant="light" class="objective-tag">{{ objective.dimension }}</t-tag>
                <div class="objective-content">{{ objective.content }}</div>
              </div>
            </div>
          </div>
          
          <div class="plan-section">
            <div class="section-header">
              <h3>教学重难点</h3>
              <t-button variant="text" size="small" @click="openEditDialog('keyPoints')">
                <t-icon name="edit" />编辑
              </t-button>
            </div>
            <div class="key-points">
              <div class="key-point">
                <h4>重点</h4>
                <ul>
                  <li v-for="(point, index) in currentPlan.keyPoints" :key="index">{{ point }}</li>
                </ul>
              </div>
              
              <div class="key-point">
                <h4>难点</h4>
                <ul>
                  <li v-for="(point, index) in currentPlan.difficultPoints" :key="index">{{ point }}</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="plan-section">
            <div class="section-header">
              <h3>教学资源建议</h3>
              <t-button variant="text" size="small" @click="openEditDialog('resources')">
                <t-icon name="edit" />编辑
              </t-button>
            </div>
            <div class="resources">
              <t-table :data="currentPlan.resources" :columns="resourceColumns" bordered size="small" />
            </div>
          </div>
          
          <div class="plan-section">
            <div class="section-header">
              <h3>教学过程设计</h3>
              <t-button variant="text" size="small" @click="openEditDialog('teachingProcess')">
                <t-icon name="edit" />编辑
              </t-button>
            </div>
            <div class="teaching-process">
              <t-collapse :default-value="expandedStages" expandMutex={false}>
                <t-collapse-panel
                  v-for="(stage, index) in currentPlan.teachingProcess"
                  :key="index"
                  :value="String(index)"
                  :header="stage.name"
                  :disabled="false"
                >
                  <div class="stage-content">
                    <div class="stage-duration">
                      <t-icon name="time" />
                      <span>{{ stage.duration }}分钟</span>
                    </div>
                    
                    <div class="stage-description">
                      <p>{{ stage.description }}</p>
                    </div>
                    
                    <div class="stage-steps">
                      <div v-for="(step, stepIndex) in stage.steps" :key="stepIndex" class="stage-step">
                        <div class="step-header">
                          <t-tag theme="default" variant="light">步骤{{ stepIndex + 1 }}</t-tag>
                          <span class="step-title">{{ step.title }}</span>
                        </div>
                        
                        <div class="step-content" v-html="formatContent(step.content)"></div>
                        
                        <div class="step-notes" v-if="step.teacherNotes">
                          <t-alert theme="warning" title="教师提示" message="" show-icon>
                            <template #message>
                              <div v-html="formatContent(step.teacherNotes)"></div>
                            </template>
                          </t-alert>
                        </div>
                      </div>
                    </div>
                  </div>
                </t-collapse-panel>
              </t-collapse>
            </div>
          </div>
          
          <div class="plan-section">
            <div class="section-header">
              <h3>教学评价</h3>
              <t-button variant="text" size="small" @click="openEditDialog('evaluation')">
                <t-icon name="edit" />编辑
              </t-button>
            </div>
            <div class="evaluation" v-html="formatContent(currentPlan.evaluation)"></div>
          </div>
          
          <div class="plan-section">
            <div class="section-header">
              <h3>拓展建议</h3>
              <t-button variant="text" size="small" @click="openEditDialog('extension')">
                <t-icon name="edit" />编辑
              </t-button>
            </div>
            <div class="extension" v-html="formatContent(currentPlan.extension)"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 修改教案对话框 -->
    <t-dialog
      v-model:visible="editDialogVisible"
      header="修改教案"
      :width="680"
      :footer="false"
    >
      <t-form ref="editForm" :data="editFormData">
        <t-tabs :value="activeTab" @change="onTabChange">
          <t-tab-panel value="objectives" label="教学目标">
            <div class="edit-objectives">
              <div v-for="(objective, index) in editFormData.objectives" :key="index" class="edit-objective-item">
                <t-select v-model="objective.dimension" style="width: 150px">
                  <t-option v-for="dim in dimensionOptions" :key="dim.value" :value="dim.value" :label="dim.label" />
                </t-select>
                <t-input v-model="objective.content" />
                <t-button theme="danger" variant="text" shape="circle" @click="removeObjective(index)">
                  <t-icon name="close" />
                </t-button>
              </div>
              
              <t-button theme="primary" variant="outline" @click="addObjective">
                <t-icon name="add" />添加教学目标
              </t-button>
            </div>
          </t-tab-panel>
          
          <t-tab-panel value="keyPoints" label="教学重难点">
            <div class="edit-key-points">
              <div class="edit-points-section">
                <h4>重点</h4>
                <div v-for="(point, index) in editFormData.keyPoints" :key="index" class="edit-point-item">
                  <t-input v-model="editFormData.keyPoints[index]" />
                  <t-button theme="danger" variant="text" shape="circle" @click="removeKeyPoint(index)">
                    <t-icon name="close" />
                  </t-button>
                </div>
                
                <t-button theme="primary" variant="outline" @click="addKeyPoint">
                  <t-icon name="add" />添加重点
                </t-button>
              </div>
              
              <div class="edit-points-section">
                <h4>难点</h4>
                <div v-for="(point, index) in editFormData.difficultPoints" :key="index" class="edit-point-item">
                  <t-input v-model="editFormData.difficultPoints[index]" />
                  <t-button theme="danger" variant="text" shape="circle" @click="removeDifficultPoint(index)">
                    <t-icon name="close" />
                  </t-button>
                </div>
                
                <t-button theme="primary" variant="outline" @click="addDifficultPoint">
                  <t-icon name="add" />添加难点
                </t-button>
              </div>
            </div>
          </t-tab-panel>
          
          <t-tab-panel value="resources" label="教学资源">
            <div class="edit-resources">
              <div v-for="(resource, index) in editFormData.resources" :key="index" class="edit-resource-item">
                <t-input v-model="resource.name" placeholder="资源名称" />
                <t-select v-model="resource.type" style="width: 120px">
                  <t-option v-for="type in resourceTypeOptions" :key="type.value" :value="type.value" :label="type.label" />
                </t-select>
                <t-input v-model="resource.link" placeholder="资源链接" />
                <t-button theme="danger" variant="text" shape="circle" @click="removeResource(index)">
                  <t-icon name="close" />
                </t-button>
              </div>
              
              <t-button theme="primary" variant="outline" @click="addResource">
                <t-icon name="add" />添加资源
              </t-button>
            </div>
          </t-tab-panel>
          
          <t-tab-panel value="teachingProcess" label="教学过程">
            <div class="edit-teaching-process">
              <p class="edit-note">教学过程较为复杂，请在主界面中编辑具体内容。</p>
              <t-button theme="primary" @click="regenerateTeachingProcess">重新生成教学过程</t-button>
            </div>
          </t-tab-panel>
          
          <t-tab-panel value="evaluation" label="教学评价">
            <div class="edit-evaluation">
              <t-textarea
                v-model="editFormData.evaluation"
                :autosize="{ minRows: 5, maxRows: 10 }"
                placeholder="请输入教学评价内容..."
              />
            </div>
          </t-tab-panel>
          
          <t-tab-panel value="extension" label="拓展建议">
            <div class="edit-extension">
              <t-textarea
                v-model="editFormData.extension"
                :autosize="{ minRows: 5, maxRows: 10 }"
                placeholder="请输入拓展建议内容..."
              />
            </div>
          </t-tab-panel>
        </t-tabs>
        
        <div class="dialog-footer">
          <t-button theme="default" @click="editDialogVisible = false">取消</t-button>
          <t-button theme="primary" @click="saveEditChanges">保存修改</t-button>
        </div>
      </t-form>
    </t-dialog>
    
    <!-- 导出对话框 -->
    <t-dialog
      v-model:visible="exportDialogVisible"
      header="导出教案"
      :width="500"
      :footer="false"
    >
      <div class="export-content">
        <t-form>
          <t-form-item label="文件名">
            <t-input v-model="exportFileName" placeholder="请输入文件名" />
          </t-form-item>
          
          <t-form-item label="导出格式">
            <t-radio-group v-model="exportFormat">
              <t-radio value="docx">Word文档(.docx)</t-radio>
              <t-radio value="pdf">PDF文档(.pdf)</t-radio>
              <t-radio value="json">JSON文件(.json)</t-radio>
            </t-radio-group>
          </t-form-item>
          
          <t-form-item label="导出选项">
            <t-checkbox-group v-model="exportOptions">
              <t-checkbox value="includeHeader">包含页眉页脚</t-checkbox>
              <t-checkbox value="includeStyles">包含样式</t-checkbox>
              <t-checkbox value="includeMeta">包含元数据</t-checkbox>
            </t-checkbox-group>
          </t-form-item>
        </t-form>
        
        <div class="dialog-footer">
          <t-button theme="default" @click="exportDialogVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmExport" :loading="isExporting">导出</t-button>
        </div>
      </div>
    </t-dialog>
    
    <!-- 导入对话框 -->
    <t-dialog
      v-model:visible="importDialogVisible"
      header="导入教案"
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
          :tips="'支持导入之前导出的教案JSON文件'"
        />
        
        <div class="dialog-footer">
          <t-button theme="default" @click="importDialogVisible = false">取消</t-button>
          <t-button theme="primary" @click="importLessonPlan" :disabled="!uploadFile.length" :loading="isImporting">导入</t-button>
        </div>
      </div>
    </t-dialog>
    
    <!-- 同步确认对话框 -->
    <t-dialog
      v-model:visible="syncDialogVisible"
      header="同步历史教案"
      :width="500"
      :footer="false"
    >
      <div class="sync-content">
        <p>您有 {{ localOnlyCount }} 条本地教案尚未同步到服务器。</p>
        <p>同步将把本地教案上传到服务器，并从服务器下载最新的教案。</p>
        <p>是否立即同步？</p>
        
        <div class="dialog-footer">
          <t-button theme="default" @click="syncDialogVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmSyncHistoryPlans" :loading="isSyncing">同步</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useLessonPlanStore } from '../../stores/lessonPlan'
import { useUserStore } from '../../stores/user'
import { MessagePlugin } from 'tdesign-vue-next'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { cacheManager } from '../../utils/fileUtils'

const lessonPlanStore = useLessonPlanStore()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  grade: '',
  module: '',
  knowledgePoint: '',
  duration: 1,
  preferences: [],
  customRequirements: '',
  useRAG: true
})

// 表单验证规则
const rules = {
  grade: [{ required: true, message: '请选择学段与年级', type: 'error' }],
  module: [{ required: true, message: '请选择课程模块', type: 'error' }],
  knowledgePoint: [{ required: true, message: '请选择核心知识点', type: 'error' }]
}

// 下拉选项
const gradeOptions = [
  { value: 'grade1_2', label: '小学1-2年级' },
  { value: 'grade3_4', label: '小学3-4年级' },
  { value: 'grade5_6', label: '小学5-6年级' },
  { value: 'grade7_9', label: '初中7-9年级' }
]

const moduleOptions = [
  { value: 'ai_life', label: '人工智能与生活' },
  { value: 'ai_tech', label: '人工智能技术' },
  { value: 'ai_ethics', label: '人工智能伦理' },
  { value: 'ai_future', label: '人工智能与未来' }
]

const knowledgePointOptions = [
  { value: 'data_coding', label: '数据与编码' },
  { value: 'algorithm', label: '身边的算法' },
  { value: 'machine_learning', label: '机器学习基础' },
  { value: 'neural_network', label: '神经网络入门' },
  { value: 'computer_vision', label: '计算机视觉' },
  { value: 'nlp', label: '自然语言处理' },
  { value: 'ai_ethics', label: '人工智能伦理与责任' },
  { value: 'ai_application', label: '人工智能应用案例' }
]

const dimensionOptions = [
  { value: 'concept', label: '人智观念' },
  { value: 'tech', label: '技术实现' },
  { value: 'thinking', label: '智能思维' },
  { value: 'ethics', label: '伦理责任' }
]

const resourceTypeOptions = [
  { value: 'video', label: '视频' },
  { value: 'image', label: '图片' },
  { value: 'website', label: '网站' },
  { value: 'tool', label: '工具' },
  { value: 'document', label: '文档' }
]

// 资源表格列定义
const resourceColumns = [
  {
    colKey: 'name',
    title: '资源名称',
    width: '30%'
  },
  {
    colKey: 'type',
    title: '类型',
    width: '20%'
  },
  {
    colKey: 'link',
    title: '链接',
    width: '50%',
    cell: (h, { row }) => {
      if (row.link) {
        return h('t-link', {
          href: row.link,
          target: '_blank',
          theme: 'primary',
          hover: 'color'
        }, row.link)
      }
      return '无链接'
    }
  }
]

// 教案操作选项
const planOptions = [
  {
    content: '重命名',
    value: 'rename'
  },
  {
    content: '导出教案',
    value: 'export'
  },
  {
    content: '删除',
    value: 'delete'
  }
]

// 状态变量
const isGenerating = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const isSyncing = ref(false)
const historyPlans = ref([])
const currentPlan = ref({
  id: '',
  title: '',
  grade: '',
  module: '',
  knowledgePoint: '',
  duration: 1,
  objectives: [],
  keyPoints: [],
  difficultPoints: [],
  resources: [],
  teachingProcess: [],
  evaluation: '',
  extension: '',
  createdAt: null,
  updatedAt: null,
  isLocalOnly: false
})
const expandedStages = ref(['0', '1', '2'])
const editDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const importDialogVisible = ref(false)
const syncDialogVisible = ref(false)
const activeTab = ref('objectives')
const exportFileName = ref('')
const exportFormat = ref('docx')
const exportOptions = ref(['includeHeader', 'includeStyles'])
const uploadFile = ref([])

// 编辑表单数据
const editFormData = reactive({
  objectives: [],
  keyPoints: [],
  difficultPoints: [],
  resources: [],
  evaluation: '',
  extension: ''
})

// 计算属性
const localOnlyCount = computed(() => {
  return historyPlans.value.filter(p => p.isLocalOnly).length
})

// 方法
const onSubmit = ({ validateResult }) => {
  if (validateResult === true) {
    generateLessonPlan()
  }
}

const resetForm = () => {
  Object.assign(formData, {
    grade: '',
    module: '',
    knowledgePoint: '',
    duration: 1,
    preferences: [],
    customRequirements: '',
    useRAG: true
  })
}

const generateLessonPlan = async () => {
  try {
    isGenerating.value = true
    
    // 调用后端API生成教案
    const plan = await lessonPlanStore.generateLessonPlan({
      grade: formData.grade,
      module: formData.module,
      knowledgePoint: formData.knowledgePoint,
      duration: formData.duration,
      preferences: formData.preferences,
      customRequirements: formData.customRequirements,
      useRAG: formData.useRAG
    })
    
    // 更新当前教案
    currentPlan.value = plan
    
    // 设置导出文件名
    const gradeName = gradeOptions.find(g => g.value === formData.grade)?.label || ''
    const moduleName = moduleOptions.find(m => m.value === formData.module)?.label || ''
    const knowledgePointName = knowledgePointOptions.find(k => k.value === formData.knowledgePoint)?.label || ''
    exportFileName.value = `${gradeName}-${moduleName}-${knowledgePointName}教案`
    
    MessagePlugin.success('教案生成成功')
  } catch (error) {
    console.error('生成教案失败:', error)
    MessagePlugin.error('生成教案失败，请稍后再试')
  } finally {
    isGenerating.value = false
  }
}

const refreshHistoryPlans = async () => {
  try {
    // 加载历史教案列表
    await lessonPlanStore.loadHistoryPlans()
    historyPlans.value = lessonPlanStore.getHistoryPlans
  } catch (error) {
    console.error('加载历史教案失败:', error)
    MessagePlugin.error('加载历史教案失败，请稍后再试')
  }
}

const syncHistoryPlans = () => {
  // 检查是否有本地教案
  if (localOnlyCount.value > 0) {
    syncDialogVisible.value = true
  } else {
    confirmSyncHistoryPlans()
  }
}

const confirmSyncHistoryPlans = async () => {
  try {
    isSyncing.value = true
    
    // 先同步到服务器
    await lessonPlanStore.syncHistoryToServer()
    
    // 再从服务器同步
    await lessonPlanStore.syncHistoryFromServer()
    
    // 更新列表
    historyPlans.value = lessonPlanStore.getHistoryPlans
    
    syncDialogVisible.value = false
    MessagePlugin.success('同步成功')
  } catch (error) {
    console.error('同步历史教案失败:', error)
    MessagePlugin.error('同步失败，请稍后再试')
  } finally {
    isSyncing.value = false
  }
}

const loadHistoryPlan = async (id) => {
  try {
    // 从缓存或服务器加载教案
    const plan = await lessonPlanStore.getLessonPlan(id)
    if (plan) {
      currentPlan.value = plan
      
      // 设置导出文件名
      const gradeName = gradeOptions.find(g => g.value === plan.grade)?.label || ''
      const moduleName = moduleOptions.find(m => m.value === plan.module)?.label || ''
      const knowledgePointName = knowledgePointOptions.find(k => k.value === plan.knowledgePoint)?.label || ''
      exportFileName.value = `${gradeName}-${moduleName}-${knowledgePointName}教案`
    }
  } catch (error) {
    console.error('加载教案失败:', error)
    MessagePlugin.error('加载教案失败，请稍后再试')
  }
}

const handlePlanAction = (value, id) => {
  switch (value) {
    case 'rename':
      // 重命名教案
      break
    case 'export':
      // 导出教案
      prepareExport(id)
      break
    case 'delete':
      // 删除教案
      deleteLessonPlan(id)
      break
  }
}

const deleteLessonPlan = async (id) => {
  try {
    await lessonPlanStore.deleteLessonPlan(id)
    
    // 如果当前正在查看的是被删除的教案，则清空当前教案
    if (currentPlan.value.id === id) {
      currentPlan.value = {
        id: '',
        title: '',
        grade: '',
        module: '',
        knowledgePoint: '',
        duration: 1,
        objectives: [],
        keyPoints: [],
        difficultPoints: [],
        resources: [],
        teachingProcess: [],
        evaluation: '',
        extension: '',
        createdAt: null,
        updatedAt: null,
        isLocalOnly: false
      }
    }
    
    // 刷新列表
    refreshHistoryPlans()
    
    MessagePlugin.success('删除成功')
  } catch (error) {
    console.error('删除教案失败:', error)
    MessagePlugin.error('删除失败，请稍后再试')
  }
}

const saveLessonPlan = async () => {
  try {
    if (!currentPlan.value.title) {
      // 如果没有标题，则根据选项生成标题
      const gradeName = gradeOptions.find(g => g.value === formData.grade)?.label || ''
      const moduleName = moduleOptions.find(m => m.value === formData.module)?.label || ''
      const knowledgePointName = knowledgePointOptions.find(k => k.value === formData.knowledgePoint)?.label || ''
      currentPlan.value.title = `${gradeName}-${moduleName}-${knowledgePointName}教案`
    }
    
    // 保存教案
    const savedPlan = await lessonPlanStore.saveLessonPlan(currentPlan.value)
    
    // 更新当前教案
    currentPlan.value = savedPlan
    
    // 刷新列表
    refreshHistoryPlans()
    
    MessagePlugin.success('保存成功')
  } catch (error) {
    console.error('保存教案失败:', error)
    MessagePlugin.error('保存失败，请稍后再试')
  }
}

const openEditDialog = (tab) => {
  // 复制当前教案数据到编辑表单
  editFormData.objectives = JSON.parse(JSON.stringify(currentPlan.value.objectives || []))
  editFormData.keyPoints = JSON.parse(JSON.stringify(currentPlan.value.keyPoints || []))
  editFormData.difficultPoints = JSON.parse(JSON.stringify(currentPlan.value.difficultPoints || []))
  editFormData.resources = JSON.parse(JSON.stringify(currentPlan.value.resources || []))
  editFormData.evaluation = currentPlan.value.evaluation || ''
  editFormData.extension = currentPlan.value.extension || ''
  
  // 设置当前标签
  activeTab.value = tab
  
  // 显示对话框
  editDialogVisible.value = true
}

const onTabChange = (value) => {
  activeTab.value = value
}

const addObjective = () => {
  editFormData.objectives.push({
    dimension: 'concept',
    content: ''
  })
}

const removeObjective = (index) => {
  editFormData.objectives.splice(index, 1)
}

const addKeyPoint = () => {
  editFormData.keyPoints.push('')
}

const removeKeyPoint = (index) => {
  editFormData.keyPoints.splice(index, 1)
}

const addDifficultPoint = () => {
  editFormData.difficultPoints.push('')
}

const removeDifficultPoint = (index) => {
  editFormData.difficultPoints.splice(index, 1)
}

const addResource = () => {
  editFormData.resources.push({
    name: '',
    type: 'website',
    link: ''
  })
}

const removeResource = (index) => {
  editFormData.resources.splice(index, 1)
}

const saveEditChanges = () => {
  // 更新当前教案
  currentPlan.value.objectives = JSON.parse(JSON.stringify(editFormData.objectives))
  currentPlan.value.keyPoints = JSON.parse(JSON.stringify(editFormData.keyPoints))
  currentPlan.value.difficultPoints = JSON.parse(JSON.stringify(editFormData.difficultPoints))
  currentPlan.value.resources = JSON.parse(JSON.stringify(editFormData.resources))
  currentPlan.value.evaluation = editFormData.evaluation
  currentPlan.value.extension = editFormData.extension
  
  // 关闭对话框
  editDialogVisible.value = false
  
  // 自动保存到本地缓存
  if (currentPlan.value.id) {
    cacheManager.updateCache('lessonPlans', currentPlan.value.id, currentPlan.value)
  }
  
  MessagePlugin.success('修改已保存')
}

const regenerateTeachingProcess = async () => {
  try {
    // 调用后端API重新生成教学过程
    const result = await lessonPlanStore.regenerateTeachingProcess({
      id: currentPlan.value.id,
      grade: currentPlan.value.grade,
      module: currentPlan.value.module,
      knowledgePoint: currentPlan.value.knowledgePoint,
      duration: currentPlan.value.duration,
      preferences: currentPlan.value.preferences || []
    })
    
    // 更新当前教案的教学过程
    currentPlan.value.teachingProcess = result.teachingProcess
    
    // 关闭对话框
    editDialogVisible.value = false
    
    // 自动保存到本地缓存
    if (currentPlan.value.id) {
      cacheManager.updateCache('lessonPlans', currentPlan.value.id, currentPlan.value)
    }
    
    MessagePlugin.success('教学过程已重新生成')
  } catch (error) {
    console.error('重新生成教学过程失败:', error)
    MessagePlugin.error('重新生成失败，请稍后再试')
  }
}

const exportToWord = () => {
  exportFormat.value = 'docx'
  exportDialogVisible.value = true
}

const exportToPDF = () => {
  exportFormat.value = 'pdf'
  exportDialogVisible.value = true
}

const prepareExport = (id) => {
  // 如果指定了ID，则先加载该教案
  if (id && id !== currentPlan.value.id) {
    loadHistoryPlan(id).then(() => {
      exportDialogVisible.value = true
    })
  } else {
    exportDialogVisible.value = true
  }
}

const confirmExport = async () => {
  try {
    isExporting.value = true
    
    // 调用后端API导出教案
    await lessonPlanStore.exportLessonPlan({
      id: currentPlan.value.id,
      fileName: exportFileName.value,
      format: exportFormat.value,
      options: exportOptions.value
    })
    
    exportDialogVisible.value = false
    MessagePlugin.success(`导出${exportFormat.value.toUpperCase()}成功`)
  } catch (error) {
    console.error('导出教案失败:', error)
    MessagePlugin.error('导出失败，请稍后再试')
  } finally {
    isExporting.value = false
  }
}

const importLessonPlan = async () => {
  if (!uploadFile.value.length) return
  
  try {
    isImporting.value = true
    
    const file = uploadFile.value[0].raw
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const content = e.target.result
        const plan = JSON.parse(content)
        
        // 导入教案
        const importedPlan = await lessonPlanStore.importLessonPlan(plan)
        
        // 更新当前教案
        currentPlan.value = importedPlan
        
        // 刷新列表
        refreshHistoryPlans()
        
        importDialogVisible.value = false
        MessagePlugin.success('导入成功')
      } catch (error) {
        console.error('解析导入文件失败:', error)
        MessagePlugin.error('导入失败，文件格式不正确')
      } finally {
        isImporting.value = false
      }
    }
    
    reader.onerror = () => {
      MessagePlugin.error('读取文件失败')
      isImporting.value = false
    }
    
    reader.readAsText(file)
  } catch (error) {
    console.error('导入教案失败:', error)
    MessagePlugin.error('导入失败，请稍后再试')
    isImporting.value = false
  }
}

// 格式化内容（将Markdown转换为HTML）
const formatContent = (content) => {
  if (!content) return ''
  return DOMPurify.sanitize(marked(content))
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 生命周期钩子
onMounted(async () => {
  try {
    // 加载历史教案列表
    await refreshHistoryPlans()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})
</script>

<style scoped>
@import '../../styles/lessonPlan.css';
</style>
