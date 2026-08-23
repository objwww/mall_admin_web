<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCaseSessionAPI, createCaseTicketAPI, getCaseEventsAPI, getCaseFamiliesAPI,
  getCaseSessionsAPI, getCaseStatusAPI, stopCaseSessionAPI, type CaseFamily,
  type CaseLabSession, type CaseLabStatus,
} from '@/apis/caseLab'
import { hasPermission } from '@/utils/permission'

const families = ref<CaseFamily[]>([])
const sessions = ref<CaseLabSession[]>([])
const runtimeStatus = ref<CaseLabStatus>()
const loading = ref(false)
const dialogVisible = ref(false)
const eventsVisible = ref(false)
const events = ref<string[]>([])
const form = reactive({ familyId: '', scopeValue: '', ttlSeconds: 60, maxAffectedRequests: 1 })
const canManage = computed(() => hasPermission('caselab:manage'))
const canCreate = computed(() => canManage.value && runtimeStatus.value?.ready === true)
const selectedFamily = computed(() => families.value.find(item => item.familyId === form.familyId))
const scopeText: Record<string, string> = {
  orderId: '订单编号', refundId: '退款单编号', payOrderId: '支付单编号', requestId: '下单请求号',
}
const actionText: Record<string, string> = {
  ERROR_AFTER_COMMIT: '订单提交后模拟响应失败',
  ACK_WITHOUT_PROCESS: '确认通知但跳过业务处理',
  SKIP_STOCK_DECREMENT: '跳过真实库存扣减',
  SKIP_POINTS_RESTORE: '跳过积分返还',
  FAIL_REFUND_PERSIST: '阻断退款结果落库',
  BARRIER: '支付与取消并发会合',
}
const triggerGuide: Record<string, string> = {
  'ORD-ORDER-CREATE-001': '在商城下单时使用这里填写的下单请求号；首次返回失败后，用同一请求号重试。',
  'PAY-ALIPAY-NOTIFY-001': '在支付沙箱中完成该支付单，并让支付宝通知任务进入业务处理。',
  'PAY-STOCK-SKIP-001': '对该待付款订单完成一次沙箱支付。',
  'PTS-POINTS-SKIP-001': '取消该笔使用过积分的待付款订单。',
  'REF-PERSIST-BLOCK-001': '在退款管理中执行该测试退款单。',
  'RAC-PAY-CANCEL-001': '同时发起该订单的支付成功处理与取消操作。',
}
const currentScopeLabel = computed(() => scopeText[selectedFamily.value?.scopeKey || ''] || '精确作用域')
const createBlockedReason = computed(() => {
  if (!canManage.value) return '当前账号缺少“故障注入管理”权限，请使用超级管理员重新登录或在角色资源中授权。'
  return runtimeStatus.value?.message || '正在读取隔离运行状态。'
})
const alertType = computed(() => runtimeStatus.value?.ready ? 'success' : 'error')
const alertTitle = computed(() => runtimeStatus.value?.ready ? '隔离故障注入已就绪' : '当前不能注入故障')
const alertDescription = computed(() => runtimeStatus.value?.message || '正在检查管理端运行配置。')

const scopeDisplay = (row: CaseLabSession) => {
  const key = Object.keys(row.scope || {})[0]
  return key ? `${scopeText[key] || key}：${row.scope[key]}` : '-'
}

const load = async () => {
  loading.value = true
  try {
    const [statusResult, familyResult] = await Promise.allSettled([getCaseStatusAPI(), getCaseFamiliesAPI()])
    runtimeStatus.value = statusResult.status === 'fulfilled' ? statusResult.value.data : undefined
    families.value = familyResult.status === 'fulfilled' ? (familyResult.value.data || []) : []
    if (!form.familyId) form.familyId = families.value[0]?.familyId || ''
    sessions.value = runtimeStatus.value?.ready ? ((await getCaseSessionsAPI()).data || []) : []
  } finally {
    loading.value = false
  }
}

const openCreate = (family?: CaseFamily) => {
  if (!canCreate.value) return ElMessage.warning(createBlockedReason.value)
  if (family) form.familyId = family.familyId
  form.scopeValue = ''
  dialogVisible.value = true
}

const validScope = (family: CaseFamily) => family.scopeKey === 'requestId'
  ? /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(form.scopeValue)
  : /^[1-9][0-9]*$/.test(form.scopeValue)

const createSession = async () => {
  const family = selectedFamily.value
  if (!family) return ElMessage.warning('请选择故障族')
  if (!validScope(family)) {
    return ElMessage.warning(family.scopeKey === 'requestId'
      ? '下单请求号最长64位，只能包含字母、数字、点、下划线、冒号或短横线'
      : `${currentScopeLabel.value}必须为正整数`)
  }
  await ElMessageBox.confirm(
    `将对“${family.name}”启用精确故障。仅允许在隔离测试环境执行，是否继续？`,
    '安全确认', { type: 'warning' },
  )
  const { data } = await createCaseSessionAPI({
    familyId: form.familyId,
    ttlSeconds: form.ttlSeconds,
    maxAffectedRequests: form.maxAffectedRequests,
    scope: { [family.scopeKey]: form.scopeValue },
  })
  ElMessage.success(`注入会话已启用：${data}。下一步：${triggerGuide[family.familyId]}`)
  dialogVisible.value = false
  await load()
}

const stop = async (row: CaseLabSession) => {
  await ElMessageBox.confirm(`确认停止会话 ${row.sessionId}？`, '停止故障注入', { type: 'warning' })
  await stopCaseSessionAPI(row.sessionId)
  ElMessage.success('故障注入会话已停止')
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
    <el-alert
      :title="alertTitle" :type="alertType" :closable="false" show-icon
      :description="`${alertDescription} 生产环境禁止开启；智能代理与商城端不会获得故障判定标准。`"
    />

    <el-card shadow="never" class="guide-card">
      <template #header><strong>如何注入故障</strong></template>
      <el-steps :active="0" simple>
        <el-step title="选择故障" description="从下方故障族创建精确会话" />
        <el-step title="执行真实业务" description="按卡片说明操作订单、支付或退款" />
        <el-step title="核对证据并停止" description="查看触发证据，完成后立即停止" />
      </el-steps>
      <p class="guide-note">创建会话只是在真实业务路径上布置故障，不会自动生成假订单或假退款。</p>
    </el-card>

    <el-empty v-if="!loading && !families.length" description="故障族读取失败，请确认当前账号拥有故障注入查看权限" />
    <el-card v-for="family in families" :key="family.familyId" shadow="never" class="family-card">
      <template #header>
        <div class="header">
          <strong>{{ family.familyId }} · {{ family.name }}</strong>
          <el-tooltip :disabled="canCreate" :content="createBlockedReason" placement="top">
            <span><el-button type="danger" :disabled="!canCreate" @click="openCreate(family)">创建此故障</el-button></span>
          </el-tooltip>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="真实故障点">{{ family.hookIds.join('、') }}</el-descriptions-item>
        <el-descriptions-item label="注入动作">{{ actionText[family.action] || family.action }}</el-descriptions-item>
        <el-descriptions-item label="精确作用域">{{ scopeText[family.scopeKey] || family.scopeKey }}</el-descriptions-item>
        <el-descriptions-item label="判断标准">{{ family.oracle }}</el-descriptions-item>
        <el-descriptions-item label="创建后的操作" :span="2">{{ triggerGuide[family.familyId] }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="header">
          <strong>故障注入会话</strong>
          <div>
            <el-button @click="load">刷新</el-button>
            <el-tooltip :disabled="canCreate" :content="createBlockedReason" placement="top">
              <span><el-button type="danger" :disabled="!canCreate" @click="openCreate()">新建注入会话</el-button></span>
            </el-tooltip>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="sessions" border stripe empty-text="暂无故障注入会话">
        <el-table-column label="会话编号" prop="sessionId" min-width="280" />
        <el-table-column label="故障族" prop="familyId" width="210" />
        <el-table-column label="状态" prop="status" width="100" />
        <el-table-column label="作用域" min-width="190"><template #default="scope">{{ scopeDisplay(scope.row) }}</template></el-table-column>
        <el-table-column label="最大影响" prop="maxAffectedRequests" width="100" />
        <el-table-column label="已触发" prop="firedCount" width="90" />
        <el-table-column label="过期时间" prop="expiresAt" min-width="190" />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="showEvents(scope.row)">触发证据</el-button>
            <el-button v-if="canManage" link type="primary" @click="createTicket(scope.row)">生成工单</el-button>
            <el-button v-if="canManage && scope.row.status === '运行中'" link type="danger" @click="stop(scope.row)">停止</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建故障注入会话" width="560px">
      <el-form label-width="120px">
        <el-form-item label="故障族">
          <el-select v-model="form.familyId" style="width:100%">
            <el-option v-for="item in families" :key="item.familyId" :label="`${item.familyId} · ${item.name}`" :value="item.familyId" />
          </el-select>
        </el-form-item>
        <el-form-item :label="currentScopeLabel">
          <el-input v-model="form.scopeValue" :placeholder="`请输入隔离环境中的${currentScopeLabel}`" />
        </el-form-item>
        <el-form-item label="触发操作"><span>{{ triggerGuide[selectedFamily?.familyId || ''] }}</span></el-form-item>
        <el-form-item label="有效期（秒）"><el-input-number v-model="form.ttlSeconds" :min="1" :max="3600" /></el-form-item>
        <el-form-item label="最大影响请求"><el-input-number v-model="form.maxAffectedRequests" :min="1" :max="10" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="createSession">确认并启用</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="eventsVisible" title="触发证据" width="720px">
      <el-empty v-if="!events.length" description="尚未触发" />
      <pre v-for="(item, index) in events" :key="index">{{ item }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.guide-card,.family-card{margin:16px 0}.header{display:flex;align-items:center;justify-content:space-between}.guide-note{margin:12px 4px 0;color:#606266}pre{padding:12px;background:#f5f7fa;white-space:pre-wrap;word-break:break-all}
</style>
