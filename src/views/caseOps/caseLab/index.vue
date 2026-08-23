<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCaseSessionAPI, createCaseTicketAPI, getCaseEventsAPI, getCaseFamiliesAPI, getCaseSessionsAPI,
  stopCaseSessionAPI, type CaseFamily, type CaseLabSession,
} from '@/apis/caseLab'
import { hasPermission } from '@/utils/permission'

const families = ref<CaseFamily[]>([])
const sessions = ref<CaseLabSession[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const eventsVisible = ref(false)
const events = ref<string[]>([])
const form = reactive({ familyId: '', scopeValue: '', ttlSeconds: 60, maxAffectedRequests: 1 })
const canManage = computed(() => hasPermission('caselab:manage'))
const selectedFamily = computed(() => families.value.find(item => item.familyId === form.familyId))
const scopeText: Record<string, string> = { orderId: '订单编号', refundId: '退款单编号', payOrderId: '支付单编号' }
const currentScopeLabel = computed(() => scopeText[selectedFamily.value?.scopeKey || ''] || '精确作用域编号')
const scopeDisplay = (row: CaseLabSession) => {
  const key = Object.keys(row.scope || {})[0]
  return key ? `${scopeText[key] || key}：${row.scope[key]}` : '-'
}

const load = async () => {
  loading.value = true
  try {
    const [familyRes, sessionRes] = await Promise.all([getCaseFamiliesAPI(), getCaseSessionsAPI()])
    families.value = familyRes.data || []
    sessions.value = sessionRes.data || []
    if (!form.familyId) form.familyId = families.value[0]?.familyId || ''
  } finally { loading.value = false }
}
const createSession = async () => {
  const family = selectedFamily.value
  if (!family) return ElMessage.warning('请选择故障族')
  if (!/^[1-9][0-9]*$/.test(form.scopeValue)) return ElMessage.warning(`${currentScopeLabel.value}必须为正整数`)
  await ElMessageBox.confirm('故障注入可能中断退款流程，仅允许在隔离测试环境执行。确认创建？', '安全确认', { type: 'warning' })
  const { data } = await createCaseSessionAPI({
    familyId: form.familyId, ttlSeconds: form.ttlSeconds,
    maxAffectedRequests: form.maxAffectedRequests, scope: { [family.scopeKey]: form.scopeValue },
  })
  ElMessage.success(`会话已创建：${data}`)
  dialogVisible.value = false
  await load()
}
const stop = async (row: CaseLabSession) => {
  await ElMessageBox.confirm(`确认停止会话 ${row.sessionId}？`, '停止故障注入', { type: 'warning' })
  await stopCaseSessionAPI(row.sessionId)
  ElMessage.success('停止请求已处理')
  await load()
}
const showEvents = async (row: CaseLabSession) => {
  events.value = (await getCaseEventsAPI(row.sessionId)).data || []
  eventsVisible.value = true
}
const createTicket = async (row: CaseLabSession) => {
  const { data } = await createCaseTicketAPI(row.sessionId)
  ElMessage.success(`合成工单已就绪，工单编号：${data}`)
}
onMounted(load)
</script>

<template>
  <div class="app-container">
    <el-alert title="仅限隔离测试环境" type="error" :closable="false" show-icon description="生产环境不得开启故障注入实验室。Agent 与商城端看不到故障点、动作、判定标准和触发证据。" />
    <el-card v-for="family in families" :key="family.familyId" shadow="never" class="family-card">
      <template #header><strong>{{ family.familyId }} · {{ family.name }}</strong></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="故障点">{{ family.hookIds ? family.hookIds.join(", ") : "-" }}</el-descriptions-item>
        <el-descriptions-item label="注入动作">{{ family.action }}</el-descriptions-item>
        <el-descriptions-item label="精确作用域">{{ family.scopeKey }}</el-descriptions-item>
        <el-descriptions-item label="隐藏判定标准">{{ family.oracle }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card shadow="never">
      <template #header><div class="header"><strong>注入会话</strong><div><el-button @click="load">刷新</el-button><el-button v-if="canManage" type="danger" @click="dialogVisible = true">创建会话</el-button></div></div></template>
      <el-table v-loading="loading" :data="sessions" border stripe>
        <el-table-column label="会话编号" prop="sessionId" min-width="280" />
        <el-table-column label="故障族" prop="familyId" width="100" />
        <el-table-column label="状态" prop="status" width="100" />
        <el-table-column label="作用域" min-width="170"><template #default="scope">{{ scopeDisplay(scope.row) }}</template></el-table-column>
        <el-table-column label="最大影响" prop="maxAffectedRequests" width="100" />
        <el-table-column label="已触发" prop="firedCount" width="90" />
        <el-table-column label="过期时间" prop="expiresAt" min-width="190" />
        <el-table-column label="操作" width="230" fixed="right"><template #default="scope"><el-button link type="primary" @click="showEvents(scope.row)">触发证据</el-button><el-button v-if="canManage" link type="primary" @click="createTicket(scope.row)">生成工单</el-button><el-button v-if="canManage && scope.row.status === '运行中'" link type="danger" @click="stop(scope.row)">停止</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建故障注入会话" width="520px">
      <el-form label-width="120px">
        <el-form-item label="故障族"><el-select v-model="form.familyId"><el-option v-for="item in families" :key="item.familyId" :label="`${item.familyId} · ${item.name}`" :value="item.familyId" /></el-select></el-form-item>
        <el-form-item :label="currentScopeLabel"><el-input v-model="form.scopeValue" :placeholder="`请输入隔离环境${currentScopeLabel}`" /></el-form-item>
        <el-form-item label="有效期（秒）"><el-input-number v-model="form.ttlSeconds" :min="1" :max="3600" /></el-form-item>
        <el-form-item label="最大影响请求"><el-input-number v-model="form.maxAffectedRequests" :min="1" :max="10" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="danger" @click="createSession">确认创建</el-button></template>
    </el-dialog>
    <el-dialog v-model="eventsVisible" title="触发证据" width="720px"><el-empty v-if="!events.length" description="尚未触发" /><pre v-for="(item, index) in events" :key="index">{{ item }}</pre></el-dialog>
  </div>
</template>

<style scoped>
.family-card{margin:16px 0}.header{display:flex;align-items:center;justify-content:space-between}pre{padding:12px;background:#f5f7fa;white-space:pre-wrap;word-break:break-all}
</style>
