<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatTs } from '@/utils/datetime'
import {
  createAgentEvalAPI, createAgentEvalTicketAPI, finishAgentEvalAPI, getAgentEvalDetailAPI, getAgentEvalListAPI,
  submitAgentEvalCaseAPI, type AgentEvalRun,
} from '@/apis/agentEval'

const query = reactive({ pageNum: 1, pageSize: 20, status: '', keyword: '' })
const list = ref<AgentEvalRun[]>([])
const total = ref(0)
const loading = ref(false)
const createVisible = ref(false)
const detailVisible = ref(false)
const detail = ref<AgentEvalRun | null>(null)
const createForm = reactive({ name: '', agentName: '', caseFamilyId: 'REF-002', caseSessionId: '' })
const caseForm = reactive({ caseId: '', expectedResult: '', actualResult: '', durationMs: undefined as number | undefined, traceId: '' })

const loadList = async () => {
  loading.value = true
  try {
    const { data } = await getAgentEvalListAPI(query)
    list.value = data.list || []
    total.value = data.total || 0
  } finally { loading.value = false }
}
const openDetail = async (row: AgentEvalRun) => {
  detail.value = (await getAgentEvalDetailAPI(row.id)).data
  Object.assign(caseForm, { caseId: '', expectedResult: '', actualResult: '', durationMs: undefined, traceId: '' })
  detailVisible.value = true
}
const reloadDetail = async () => {
  if (!detail.value) return
  detail.value = (await getAgentEvalDetailAPI(detail.value.id)).data
  await loadList()
}
const createRun = async () => {
  if (!createForm.name.trim() || !createForm.agentName.trim() || !createForm.caseFamilyId.trim()) return ElMessage.warning('请完整填写评测名称、Agent和故障族')
  const { data } = await createAgentEvalAPI({ ...createForm, caseSessionId: createForm.caseSessionId || undefined })
  ElMessage.success(`评测已创建：${data}`)
  createVisible.value = false
  await loadList()
}
const submitCase = async () => {
  if (!detail.value || !caseForm.caseId.trim() || !caseForm.expectedResult.trim()) return ElMessage.warning('用例编号和隐藏 Oracle 不能为空')
  const { data } = await submitAgentEvalCaseAPI(detail.value.id, { ...caseForm, traceId: caseForm.traceId || undefined })
  ElMessage.success(data ? '用例通过' : '用例未通过')
  Object.assign(caseForm, { caseId: '', expectedResult: '', actualResult: '', durationMs: undefined, traceId: '' })
  await reloadDetail()
}
const finish = async () => {
  if (!detail.value) return
  await ElMessageBox.confirm('完成后评测和用例结果将冻结，不能继续修改。确认完成？', '完成评测', { type: 'warning' })
  detail.value = (await finishAgentEvalAPI(detail.value.id)).data
  ElMessage.success('评测已完成并计算分数')
  await loadList()
}
const createTicket = async () => {
  if (!detail.value) return
  const { data } = await createAgentEvalTicketAPI(detail.value.id)
  ElMessage.success(`失败跟进工单已就绪，工单编号：${data}`)
}
onMounted(loadList)
</script>

<template>
  <div class="app-container">
    <el-alert title="离线评测与线上监控分离" type="info" :closable="false" show-icon description="隐藏 Oracle 仅在本管理页面与评测库中使用，禁止注入 Agent 上下文。" />
    <el-card shadow="never" class="main-card">
      <div class="filter-bar">
        <el-input v-model="query.keyword" placeholder="评测名称、Agent或故障族" clearable style="width:260px" @keyup.enter="loadList" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width:130px"><el-option label="进行中" value="RUNNING" /><el-option label="已完成" value="FINISHED" /></el-select>
        <el-button type="primary" @click="loadList">查询</el-button><el-button @click="Object.assign(query,{pageNum:1,status:'',keyword:''});loadList()">重置</el-button>
        <el-button type="primary" class="create" @click="createVisible=true">创建评测</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="编号" prop="id" width="70" /><el-table-column label="评测名称" prop="name" min-width="180" />
        <el-table-column label="Agent" prop="agentName" width="150" /><el-table-column label="故障族" prop="caseFamilyId" width="120" />
        <el-table-column label="状态" width="100"><template #default="scope">{{ scope.row.status==='RUNNING'?'进行中':'已完成' }}</template></el-table-column>
        <el-table-column label="通过/总数" width="110"><template #default="scope">{{ scope.row.passedCases }}/{{ scope.row.totalCases }}</template></el-table-column>
        <el-table-column label="分数" prop="score" width="90" /><el-table-column label="创建时间" width="170"><template #default="scope">{{ formatTs(scope.row.createTime) }}</template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right"><template #default="scope"><el-button link type="primary" @click="openDetail(scope.row)">查看</el-button></template></el-table-column>
      </el-table>
      <el-pagination class="pagination" background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :page-sizes="[10,20,50]" @current-change="loadList" @size-change="()=>{query.pageNum=1;loadList()}" />
    </el-card>

    <el-dialog v-model="createVisible" title="创建离线评测" width="520px"><el-form label-width="110px"><el-form-item label="评测名称"><el-input v-model="createForm.name" /></el-form-item><el-form-item label="Agent名称"><el-input v-model="createForm.agentName" /></el-form-item><el-form-item label="Case Family"><el-input v-model="createForm.caseFamilyId" /></el-form-item><el-form-item label="CaseLab会话"><el-input v-model="createForm.caseSessionId" placeholder="选填" /></el-form-item></el-form><template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" @click="createRun">创建</el-button></template></el-dialog>

    <el-drawer v-model="detailVisible" title="评测详情" size="760px"><template v-if="detail">
      <el-descriptions :column="3" border><el-descriptions-item label="评测名称">{{ detail.name }}</el-descriptions-item><el-descriptions-item label="Agent">{{ detail.agentName }}</el-descriptions-item><el-descriptions-item label="状态">{{ detail.status==='RUNNING'?'进行中':'已完成' }}</el-descriptions-item><el-descriptions-item label="故障族">{{ detail.caseFamilyId }}</el-descriptions-item><el-descriptions-item label="通过用例">{{ detail.passedCases }}/{{ detail.totalCases }}</el-descriptions-item><el-descriptions-item label="最终分数">{{ detail.score }}</el-descriptions-item></el-descriptions>
      <el-button v-if="detail.status==='FINISHED' && detail.passedCases < detail.totalCases" class="ticket-button" type="warning" @click="createTicket">生成失败跟进工单</el-button>
      <template v-if="detail.status==='RUNNING'"><h3>提交用例结果</h3><el-form label-width="110px"><el-form-item label="用例编号"><el-input v-model="caseForm.caseId" /></el-form-item><el-form-item label="隐藏 Oracle"><el-input v-model="caseForm.expectedResult" type="textarea" :rows="3" placeholder="仅评测器可见，不得发送给Agent" /></el-form-item><el-form-item label="Agent实际输出"><el-input v-model="caseForm.actualResult" type="textarea" :rows="3" /></el-form-item><el-form-item label="耗时毫秒"><el-input-number v-model="caseForm.durationMs" :min="0" :max="3600000" /></el-form-item><el-form-item label="TraceId"><el-input v-model="caseForm.traceId" /></el-form-item><el-button type="primary" @click="submitCase">记录用例</el-button><el-button type="success" @click="finish">完成并计分</el-button></el-form></template>
      <h3>用例结果</h3><el-table :data="detail.cases||[]" border><el-table-column label="用例" prop="caseId" width="120" /><el-table-column label="隐藏 Oracle" prop="expectedResult" min-width="180" show-overflow-tooltip /><el-table-column label="Agent实际输出" prop="actualResult" min-width="180" show-overflow-tooltip /><el-table-column label="结果" width="80"><template #default="scope"><el-tag :type="scope.row.passed?'success':'danger'">{{ scope.row.passed?'通过':'未通过' }}</el-tag></template></el-table-column><el-table-column label="耗时" width="100"><template #default="scope">{{ scope.row.durationMs??'-' }} ms</template></el-table-column></el-table>
    </template></el-drawer>
  </div>
</template>

<style scoped>
.main-card{margin-top:16px}.filter-bar{display:flex;gap:10px;align-items:center;margin-bottom:16px}.create{margin-left:auto}.pagination{margin-top:16px;justify-content:flex-end}.ticket-button{margin-top:16px}h3{margin:22px 0 12px}
</style>
