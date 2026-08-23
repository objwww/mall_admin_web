<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatTs } from '@/utils/datetime'
import {
  assignTicketAPI,
  attachTicketContextAPI,
  changeTicketStatusAPI,
  commentTicketAPI,
  getTicketDetailAPI,
  getTicketListAPI,
  getTicketsByContextAPI,
  type SupportTicket,
  type TicketContextType,
  type TicketStatus,
} from '@/apis/support'
import { hasPermission } from '@/utils/permission'

const statusText: Record<TicketStatus, string> = {
  OPEN: '待处理', PROCESSING: '处理中', WAIT_USER: '等待用户', RESOLVED: '已解决', CLOSED: '已关闭',
}
const eventText: Record<string, string> = {
  TICKET_CREATED: '创建工单', MEMBER_MESSAGE: '用户留言', ASSIGNED: '分配工单',
  STATUS_CHANGED: '状态变更', ADMIN_COMMENT: '客服回复', CONTEXT_ATTACHED: '关联业务活动',
}
const contextText: Record<TicketContextType, string> = {
  ORDER: '订单', TRACE: '追踪编号', OPERATION: '操作记录', AFTER_SALE: '售后单',
  REFUND: '退款单', AGENT_RUN: 'Agent运行', CASE_RUN: 'CaseLab运行',
}
const query = reactive({ pageNum: 1, pageSize: 20, status: '', keyword: '', synthetic: false })
const correlationForm = reactive({ refType: 'ORDER' as TicketContextType, refValue: '' })
const list = ref<SupportTicket[]>([])
const total = ref(0)
const loading = ref(false)
const drawerVisible = ref(false)
const detail = ref<SupportTicket | null>(null)
const assignForm = reactive({ assigneeId: undefined as number | undefined, assigneeName: '' })
const actionForm = reactive({ status: '' as TicketStatus | '', note: '', comment: '' })
const contextForm = reactive({ refType: 'ORDER' as TicketContextType, refValue: '' })
const canManage = computed(() => hasPermission('support:ticket:manage'))

const loadList = async () => {
  loading.value = true
  try {
    const { data } = await getTicketListAPI(query)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const loadByContext = async () => {
  if (!correlationForm.refValue.trim()) return ElMessage.warning('请输入关联编号')
  loading.value = true
  try {
    const { data } = await getTicketsByContextAPI({
      ...correlationForm,
      refValue: correlationForm.refValue.trim(),
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const openDetail = async (row: SupportTicket) => {
  const { data } = await getTicketDetailAPI(row.id)
  detail.value = data
  assignForm.assigneeId = data.assigneeId
  assignForm.assigneeName = data.assigneeName || ''
  actionForm.status = ''
  actionForm.note = ''
  actionForm.comment = ''
  contextForm.refType = 'ORDER'
  contextForm.refValue = ''
  drawerVisible.value = true
}

const reloadDetail = async () => {
  if (!detail.value) return
  detail.value = (await getTicketDetailAPI(detail.value.id)).data
  await loadList()
}

const submitAssign = async () => {
  if (!detail.value || !assignForm.assigneeName.trim()) return ElMessage.warning('请输入处理人姓名')
  await assignTicketAPI(detail.value.id, assignForm)
  ElMessage.success('工单已分配')
  await reloadDetail()
}

const submitStatus = async () => {
  if (!detail.value || !actionForm.status) return ElMessage.warning('请选择目标状态')
  await changeTicketStatusAPI(detail.value.id, { status: actionForm.status, note: actionForm.note })
  ElMessage.success('状态已更新')
  await reloadDetail()
}

const submitComment = async () => {
  if (!detail.value || !actionForm.comment.trim()) return ElMessage.warning('请输入回复内容')
  await commentTicketAPI(detail.value.id, actionForm.comment)
  ElMessage.success('回复已发送')
  actionForm.comment = ''
  await reloadDetail()
}

const submitContext = async () => {
  if (!detail.value || !contextForm.refValue.trim()) return ElMessage.warning('请输入关联编号')
  const { data } = await attachTicketContextAPI(detail.value.id, {
    refType: contextForm.refType,
    refValue: contextForm.refValue.trim(),
  })
  ElMessage.success(data ? '活动关联已保存' : '该活动已关联，无需重复添加')
  contextForm.refValue = ''
  await reloadDetail()
}

const resetQuery = () => {
  Object.assign(query, { pageNum: 1, status: '', keyword: '', synthetic: false })
  correlationForm.refValue = ''
  loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input v-model="query.keyword" placeholder="工单号、标题、用户或业务编号" clearable style="width: 280px" @keyup.enter="loadList" />
        <el-select v-model="query.status" placeholder="工单状态" clearable style="width: 140px">
          <el-option v-for="(label, value) in statusText" :key="value" :label="label" :value="value" />
        </el-select>
        <el-select v-model="query.synthetic" style="width: 150px">
          <el-option label="真实用户工单" :value="false" />
          <el-option label="合成测试工单" :value="true" />
        </el-select>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
      <div class="filter-bar">
        <span class="filter-label">按活动反查工单</span>
        <el-select v-model="correlationForm.refType" style="width: 150px">
          <el-option v-for="(label, value) in contextText" :key="value" :label="label" :value="value" />
        </el-select>
        <el-input v-model="correlationForm.refValue" placeholder="请输入精确关联编号" clearable style="width: 280px" @keyup.enter="loadByContext" />
        <el-button @click="loadByContext">反查工单</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="工单号" prop="ticketSn" width="170" />
        <el-table-column label="用户/来源" width="130"><template #default="scope">{{ scope.row.synthetic ? '合成测试' : (scope.row.memberName || '-') }}</template></el-table-column>
        <el-table-column label="分类" prop="category" width="110" />
        <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="scope">{{ statusText[scope.row.status as TicketStatus] || '未知状态' }}</template>
        </el-table-column>
        <el-table-column label="处理人" prop="assigneeName" width="120" />
        <el-table-column label="业务引用" prop="primaryAnchorValue" min-width="160" show-overflow-tooltip />
        <el-table-column label="创建时间" width="170"><template #default="scope">{{ formatTs(scope.row.createTime) }}</template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right"><template #default="scope"><el-button v-if="canManage" link type="primary" @click="openDetail(scope.row)">处理</el-button><span v-else>-</span></template></el-table-column>
      </el-table>
      <el-pagination class="pagination" background layout="total, sizes, prev, pager, next" :total="total"
        v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :page-sizes="[10, 20, 50]"
        @current-change="loadList" @size-change="() => { query.pageNum = 1; loadList() }" />
    </el-card>

    <el-drawer v-model="drawerVisible" title="工单处理" size="640px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ detail.ticketSn }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText[detail.status] }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ detail.memberName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ detail.assigneeName || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ detail.description }}</el-descriptions-item>
          <el-descriptions-item label="业务引用" :span="2">{{ detail.primaryAnchorValue || '无' }}</el-descriptions-item>
        </el-descriptions>

        <h3>已关联业务活动</h3>
        <el-empty v-if="!detail.contexts?.length" description="暂无关联" :image-size="60" />
        <el-table v-else :data="detail.contexts" border size="small">
          <el-table-column label="类型" width="130"><template #default="scope">{{ contextText[scope.row.refType as TicketContextType] || scope.row.refType }}</template></el-table-column>
          <el-table-column label="关联编号" prop="refValue" min-width="220" />
          <el-table-column label="来源" width="100"><template #default="scope">{{ scope.row.source === 'MANUAL' ? '人工关联' : '创建时关联' }}</template></el-table-column>
        </el-table>
        <div v-if="canManage" class="action-row context-row">
          <el-select v-model="contextForm.refType" style="width: 150px"><el-option v-for="(label, value) in contextText" :key="value" :label="label" :value="value" /></el-select>
          <el-input v-model="contextForm.refValue" placeholder="业务活动编号" />
          <el-button type="primary" @click="submitContext">添加关联</el-button>
        </div>

        <template v-if="canManage"><h3>分配处理人</h3>
        <div class="action-row"><el-input-number v-model="assignForm.assigneeId" :min="1" placeholder="处理人编号" /><el-input v-model="assignForm.assigneeName" placeholder="处理人姓名" /><el-button type="primary" @click="submitAssign">分配</el-button></div>
        <h3>变更状态</h3>
        <div class="action-row"><el-select v-model="actionForm.status" placeholder="目标状态"><el-option v-for="(label, value) in statusText" :key="value" :label="label" :value="value" /></el-select><el-input v-model="actionForm.note" placeholder="处理说明（可选）" /><el-button type="primary" @click="submitStatus">更新</el-button></div>
        <h3>回复用户</h3>
        <div class="action-row"><el-input v-model="actionForm.comment" type="textarea" :rows="2" placeholder="请输入回复内容" /><el-button type="primary" @click="submitComment">发送</el-button></div></template>
        <h3>处理时间线</h3>
        <el-timeline>
          <el-timeline-item v-for="(item, index) in detail.timeline || []" :key="index" :timestamp="formatTs(item.createTime)">
            <strong>{{ eventText[item.eventType] || item.eventType }}</strong> · {{ item.operatorName || (item.operatorType === 'MEMBER' ? '用户' : '系统') }}<br />{{ item.content || '-' }}
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.filter-bar,.action-row{display:flex;gap:10px;align-items:center;margin-bottom:16px}.filter-label{color:#606266;font-size:14px}.pagination{margin-top:16px;justify-content:flex-end}.action-row .el-input{flex:1}.context-row{margin-top:12px}h3{margin:22px 0 12px}
</style>
