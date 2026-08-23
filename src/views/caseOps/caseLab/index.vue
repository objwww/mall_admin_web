<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  createCaseSessionAPI, createCaseTicketAPI, getCaseEventsAPI, getCaseFamiliesAPI,
  getCaseSessionsAPI, getCaseStatusAPI, saveCaseRuntimeConfigAPI, stopCaseSessionAPI, type CaseFamily,
  type CaseLabSession, type CaseLabStatus, type CaseLabTriggerEvent,
} from '@/apis/caseLab'
import { hasPermission } from '@/utils/permission'

const families = ref<CaseFamily[]>([])
const sessions = ref<CaseLabSession[]>([])
const runtimeStatus = ref<CaseLabStatus>()
const loading = ref(false)
const dialogVisible = ref(false)
const eventsVisible = ref(false)
const events = ref<CaseLabTriggerEvent[]>([])
const router = useRouter()
const form = reactive({ familyId: '', scopeValue: '', ttlSeconds: 60, maxAffectedRequests: 1 })
const runtimeForm = reactive({ enabled: false, paymentEndpoint: '', killSwitchOn: true })
const catalogFilter = reactive({ keyword: '', groupCode: '', executionStatus: '' })
const canManage = computed(() => hasPermission('caselab:manage'))
const canCreate = computed(() => canManage.value && runtimeStatus.value?.ready === true)
const canConfigure = computed(() => canManage.value && runtimeStatus.value?.configurable === true)
const selectedFamily = computed(() => families.value.find(item => item.familyId === form.familyId))
const executableFamilies = computed(() => families.value.filter(item => item.executionStatus === 'EXECUTABLE'))
const groupOptions = computed(() => Array.from(new Map(families.value
  .map(item => [item.groupCode, item.groupName])).entries()).map(([code, name]) => ({ code, name })))
const visibleFamilies = computed(() => families.value.filter((item) => {
  const keyword = catalogFilter.keyword.trim().toLowerCase()
  return (!catalogFilter.groupCode || item.groupCode === catalogFilter.groupCode)
    && (!catalogFilter.executionStatus || item.executionStatus === catalogFilter.executionStatus)
    && (!keyword || `${item.familyId} ${item.name} ${item.groupName} ${item.faultType}`.toLowerCase().includes(keyword))
}))
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
const faultLocation: Record<string, string> = {
  'ORD-ORDER-CREATE-001': '订单事务已经提交、响应返回商城客户端之前。',
  'PAY-ALIPAY-NOTIFY-001': '支付宝通知任务确认支付单成功之后、更新商城订单之前。',
  'PAY-STOCK-SKIP-001': '订单从待付款变为待发货之后、扣减真实库存之前。',
  'PTS-POINTS-SKIP-001': '取消订单并恢复优惠券之后、返还用户积分之前。',
  'REF-PERSIST-BLOCK-001': '退款渠道返回成功之后、本地退款成功状态和审计记录落库之前。',
  'RAC-PAY-CANCEL-001': '支付处理与取消处理各自执行订单状态条件更新之前，共两个并发会合点。',
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
    if (runtimeStatus.value) Object.assign(runtimeForm, {
      enabled: runtimeStatus.value.enabled,
      paymentEndpoint: runtimeStatus.value.paymentEndpoint || '',
      killSwitchOn: runtimeStatus.value.killSwitchOn,
    })
    families.value = familyResult.status === 'fulfilled' ? (familyResult.value.data || []) : []
    if (!form.familyId) form.familyId = executableFamilies.value[0]?.familyId || ''
    sessions.value = runtimeStatus.value?.ready ? ((await getCaseSessionsAPI()).data || []) : []
  } finally {
    loading.value = false
  }
}

const openCreate = (family?: CaseFamily) => {
  if (family && family.executionStatus !== 'EXECUTABLE') return ElMessage.warning(family.executionNote)
  if (!canCreate.value) return ElMessage.warning(createBlockedReason.value)
  if (family) form.familyId = family.familyId
  form.scopeValue = ''
  dialogVisible.value = true
}

const validScope = (family: CaseFamily) => family.scopeKey === 'requestId'
  ? /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(form.scopeValue)
  : Boolean(family.scopeKey) && /^[1-9][0-9]*$/.test(form.scopeValue)

const familyBlockedReason = (family: CaseFamily) => family.executionStatus === 'PLANNED'
  ? family.executionNote : createBlockedReason.value
const familyCanCreate = (family: CaseFamily) => family.executionStatus === 'EXECUTABLE' && canCreate.value
const statusText = (status: CaseFamily['executionStatus']) => status === 'EXECUTABLE' ? '已接入' : '待接入'
const scopeKeysDisplay = (family: CaseFamily) => family.scopeKeys
  .map(key => scopeText[key] || key).join('、') || '-'

const createSession = async () => {
  const family = selectedFamily.value
  if (!family) return ElMessage.warning('请选择故障族')
  if (!family.scopeKey) return ElMessage.warning('该故障尚未接入真实作用域')
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

const saveRuntimeConfig = async () => {
  if (!canConfigure.value) return ElMessage.warning(runtimeStatus.value?.message || '当前实例不能修改隔离配置')
  if (runtimeForm.enabled && !/(sandbox|mock|localhost|127\.0\.0\.1)/i.test(runtimeForm.paymentEndpoint)) {
    return ElMessage.warning('启用故障注入时，支付端点必须使用沙箱、Mock或本机地址')
  }
  await ElMessageBox.confirm('配置会被管理端和商城端共享读取，确认保存？', '保存隔离环境配置', { type: 'warning' })
  await saveCaseRuntimeConfigAPI({ ...runtimeForm })
  ElMessage.success('隔离环境配置已保存')
  await load()
}

const stop = async (row: CaseLabSession) => {
  await ElMessageBox.confirm(`确认停止会话 ${row.sessionId}？`, '停止故障注入', { type: 'warning' })
  await stopCaseSessionAPI(row.sessionId)
  ElMessage.success('故障注入会话已停止')
  await load()
}
const showEvents = async (row: CaseLabSession) => {
  events.value = ((await getCaseEventsAPI(row.sessionId)).data || []).flatMap((item) => {
    try { return [JSON.parse(item) as CaseLabTriggerEvent] } catch { return [] }
  })
  eventsVisible.value = true
}
const openLog = (traceId?: string, tab = 'access') => {
  if (!traceId) return ElMessage.warning('当前记录没有追踪编号')
  router.push({ path: '/log', query: { traceId, tab } })
}
const eventOrderId = (item: CaseLabTriggerEvent) => item.orderId || item.scope?.orderId || '-'
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

    <el-card shadow="never" class="runtime-card">
      <template #header><strong>隔离环境配置</strong></template>
      <el-form label-width="140px">
        <el-form-item label="当前环境"><el-input :model-value="runtimeStatus?.environment || '未配置'" disabled /></el-form-item>
        <el-form-item label="共享会话目录"><el-input :model-value="runtimeStatus?.sessionDirectory || '未配置'" disabled /></el-form-item>
        <el-form-item label="Mock支付端点"><el-input v-model="runtimeForm.paymentEndpoint" :disabled="!canConfigure" placeholder="例如：http://mock-payment:18080" /></el-form-item>
        <el-form-item label="启用故障注入"><el-switch v-model="runtimeForm.enabled" :disabled="!canConfigure" /></el-form-item>
        <el-form-item label="全局停止开关"><el-switch v-model="runtimeForm.killSwitchOn" :disabled="!canConfigure" /></el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!canConfigure" @click="saveRuntimeConfig">保存隔离配置</el-button>
          <span class="runtime-note">环境类型和共享目录属于启动围栏，生产实例不能在页面改成隔离环境。</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="guide-card">
      <template #header><strong>如何注入故障</strong></template>
      <el-steps :active="0" simple>
        <el-step title="选择故障" description="从下方故障族创建精确会话" />
        <el-step title="执行真实业务" description="按卡片说明操作订单、支付或退款" />
        <el-step title="核对证据并停止" description="查看触发证据，完成后立即停止" />
      </el-steps>
      <p class="guide-note">创建会话只是在真实业务路径上布置故障，不会自动生成假订单或假退款。</p>
    </el-card>

    <el-card shadow="never" class="catalog-card">
      <template #header>
        <div class="header">
          <strong>故障目录与分组</strong>
          <div>
            <el-tag>共 {{ families.length }} 条</el-tag>
            <el-tag type="success" class="summary-tag">已接入 {{ executableFamilies.length }} 条</el-tag>
            <el-tag type="info" class="summary-tag">待接入 {{ families.length - executableFamilies.length }} 条</el-tag>
          </div>
        </div>
      </template>
      <div class="catalog-filter">
        <el-input v-model="catalogFilter.keyword" clearable placeholder="搜索故障编号、名称、故障组或类型" />
        <el-select v-model="catalogFilter.groupCode" clearable placeholder="全部故障组">
          <el-option v-for="item in groupOptions" :key="item.code" :label="`${item.name}（${item.code}）`" :value="item.code" />
        </el-select>
        <el-select v-model="catalogFilter.executionStatus" clearable placeholder="全部接入状态">
          <el-option label="已接入真实故障点" value="EXECUTABLE" />
          <el-option label="待接入真实故障点" value="PLANNED" />
        </el-select>
      </div>
      <el-table v-loading="loading" :data="visibleFamilies" border stripe max-height="620" empty-text="没有符合条件的故障">
        <el-table-column type="expand">
          <template #default="scope">
            <el-descriptions :column="2" border class="family-detail">
              <el-descriptions-item label="故障场景" :span="2">{{ scope.row.name }}</el-descriptions-item>
              <el-descriptions-item label="故障位置" :span="2">{{ faultLocation[scope.row.familyId] || '尚未织入真实业务路径' }}</el-descriptions-item>
              <el-descriptions-item label="技术故障点">{{ scope.row.hookIds.join('、') || '-' }}</el-descriptions-item>
              <el-descriptions-item label="注入动作">{{ scope.row.action ? (actionText[scope.row.action] || scope.row.action) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="可关联作用域">{{ scopeKeysDisplay(scope.row) }}</el-descriptions-item>
              <el-descriptions-item label="判断标准">{{ scope.row.oracle }}</el-descriptions-item>
              <el-descriptions-item label="接入说明" :span="2">{{ scope.row.executionNote }}</el-descriptions-item>
              <el-descriptions-item v-if="scope.row.executionStatus === 'EXECUTABLE'" label="创建后的操作" :span="2">{{ triggerGuide[scope.row.familyId] }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>
        <el-table-column label="故障编号" prop="familyId" width="220" />
        <el-table-column label="所属故障组" prop="groupName" min-width="150" />
        <el-table-column label="故障类型" prop="faultType" min-width="170" />
        <el-table-column label="故障场景" prop="name" min-width="280" show-overflow-tooltip />
        <el-table-column label="接入状态" width="110">
          <template #default="scope"><el-tag :type="scope.row.executionStatus === 'EXECUTABLE' ? 'success' : 'info'">{{ statusText(scope.row.executionStatus) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="scope">
            <el-tooltip :disabled="familyCanCreate(scope.row)" :content="familyBlockedReason(scope.row)" placement="top">
              <span><el-button type="danger" :disabled="!familyCanCreate(scope.row)" @click="openCreate(scope.row)">创建此故障</el-button></span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
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
        <el-table-column label="布置追踪编号" min-width="190" show-overflow-tooltip>
          <template #default="scope">
            <el-button v-if="scope.row.sessionTraceId" link type="primary" @click="openLog(scope.row.sessionTraceId, 'operation')">{{ scope.row.sessionTraceId }}</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
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
            <el-option v-for="item in executableFamilies" :key="item.familyId" :label="`${item.familyId} · ${item.name}`" :value="item.familyId" />
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
    <el-dialog v-model="eventsVisible" title="触发证据与日志定位" width="920px">
      <el-empty v-if="!events.length" description="尚未触发" />
      <el-card v-for="(item, index) in events" :key="index" shadow="never" class="event-card">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="触发时间">{{ item.firedAt }}</el-descriptions-item>
          <el-descriptions-item label="真实订单编号">{{ eventOrderId(item) }}</el-descriptions-item>
          <el-descriptions-item label="真实业务追踪编号" :span="2">
            <el-button v-if="item.businessTraceId" link type="primary" @click="openLog(item.businessTraceId)">{{ item.businessTraceId }}</el-button>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="故障点" :span="2">{{ item.hookId }}</el-descriptions-item>
          <el-descriptions-item label="精确作用域" :span="2">{{ JSON.stringify(item.scope) }}</el-descriptions-item>
        </el-descriptions>
        <div class="event-actions">
          <el-button type="primary" :disabled="!item.businessTraceId" @click="openLog(item.businessTraceId)">查访问日志</el-button>
          <el-button type="danger" :disabled="!item.businessTraceId" @click="openLog(item.businessTraceId, 'error')">查错误日志</el-button>
        </div>
      </el-card>
    </el-dialog>
  </div>
</template>

<style scoped>
.runtime-card,.guide-card,.catalog-card{margin:16px 0}.runtime-card :deep(.el-input){max-width:680px}.runtime-note{margin-left:12px;color:#909399}.header{display:flex;align-items:center;justify-content:space-between}.summary-tag{margin-left:8px}.catalog-filter{display:grid;grid-template-columns:minmax(260px,1fr) 220px 220px;gap:12px;margin-bottom:16px}.family-detail{margin:12px 48px}.guide-note{margin:12px 4px 0;color:#606266}.event-card+.event-card{margin-top:12px}.event-actions{margin-top:12px;text-align:right}
</style>
