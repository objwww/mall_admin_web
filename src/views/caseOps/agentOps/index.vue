<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getAgentOperationDetailAPI, getAgentOperationListAPI, type AgentOperationRun } from '@/apis/agentOps'
import { formatTs } from '@/utils/datetime'

const statusText: Record<string, string> = { RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败', CANCELLED: '已取消', STARTED: '执行中' }
const query = reactive({ pageNum: 1, pageSize: 20, status: '', keyword: '' })
const list = ref<AgentOperationRun[]>([])
const total = ref(0)
const loading = ref(false)
const drawerVisible = ref(false)
const detail = ref<AgentOperationRun | null>(null)

const load = async () => {
  loading.value = true
  try {
    const { data } = await getAgentOperationListAPI(query)
    list.value = data.list || []
    total.value = data.total || 0
  } finally { loading.value = false }
}
const openDetail = async (row: AgentOperationRun) => {
  detail.value = (await getAgentOperationDetailAPI(row.runId)).data
  drawerVisible.value = true
}
onMounted(load)
</script>

<template>
  <div class="app-container">
    <el-alert title="数据来自真实运行时" type="info" :closable="false" show-icon description="这里只展示通过采集协议上报的运行与工具调用；没有上报时保持空列表，不生成模拟数据。" />
    <el-card shadow="never" class="main-card">
      <div class="filter-bar">
        <el-input v-model="query.keyword" placeholder="运行编号、智能代理或追踪编号" clearable style="width:300px" @keyup.enter="load" />
        <el-select v-model="query.status" placeholder="运行状态" clearable style="width:130px"><el-option label="运行中" value="RUNNING" /><el-option label="成功" value="SUCCESS" /><el-option label="失败" value="FAILED" /><el-option label="已取消" value="CANCELLED" /></el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="Object.assign(query,{pageNum:1,status:'',keyword:''});load()">重置</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="运行编号" prop="runId" min-width="190" show-overflow-tooltip />
        <el-table-column label="智能代理" prop="agentName" width="150" />
        <el-table-column label="状态" width="100"><template #default="scope">{{ statusText[scope.row.status] || scope.row.status }}</template></el-table-column>
        <el-table-column label="追踪编号" prop="traceId" min-width="160" show-overflow-tooltip />
        <el-table-column label="评测编号" prop="evaluationRunId" width="100" />
        <el-table-column label="开始时间" width="170"><template #default="scope">{{ formatTs(scope.row.startedAt) }}</template></el-table-column>
        <el-table-column label="耗时" width="100"><template #default="scope">{{ scope.row.durationMs ?? '-' }} 毫秒</template></el-table-column>
        <el-table-column label="操作" width="80" fixed="right"><template #default="scope"><el-button link type="primary" @click="openDetail(scope.row)">详情</el-button></template></el-table-column>
        <template #empty>暂无真实运行上报</template>
      </el-table>
      <el-pagination class="pagination" background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :page-sizes="[10,20,50]" @current-change="load" @size-change="()=>{query.pageNum=1;load()}" />
    </el-card>

    <el-drawer v-model="drawerVisible" title="智能代理运行详情" size="800px"><template v-if="detail">
      <el-descriptions :column="2" border><el-descriptions-item label="运行编号">{{ detail.runId }}</el-descriptions-item><el-descriptions-item label="智能代理">{{ detail.agentName }}</el-descriptions-item><el-descriptions-item label="状态">{{ statusText[detail.status] || detail.status }}</el-descriptions-item><el-descriptions-item label="追踪编号">{{ detail.traceId || '-' }}</el-descriptions-item><el-descriptions-item label="输入摘要" :span="2">{{ detail.inputSummary || '-' }}</el-descriptions-item><el-descriptions-item label="输出摘要" :span="2">{{ detail.outputSummary || '-' }}</el-descriptions-item><el-descriptions-item label="错误信息" :span="2">{{ detail.errorMessage || '-' }}</el-descriptions-item></el-descriptions>
      <h3>工具调用</h3><el-table :data="detail.toolCalls || []" border><el-table-column label="顺序" prop="sequenceNo" width="70" /><el-table-column label="工具" prop="toolName" width="150" /><el-table-column label="状态" width="90"><template #default="scope">{{ statusText[scope.row.status] || scope.row.status }}</template></el-table-column><el-table-column label="输入" prop="inputJson" min-width="180" show-overflow-tooltip /><el-table-column label="输出" prop="outputJson" min-width="180" show-overflow-tooltip /><el-table-column label="耗时" width="100"><template #default="scope">{{ scope.row.durationMs ?? '-' }} 毫秒</template></el-table-column><template #empty>该运行尚无工具调用上报</template></el-table>
    </template></el-drawer>
  </div>
</template>

<style scoped>
.main-card{margin-top:16px}.filter-bar{display:flex;gap:10px;align-items:center;margin-bottom:16px}.pagination{margin-top:16px;justify-content:flex-end}h3{margin:22px 0 12px}
</style>
