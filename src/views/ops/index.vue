<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOpsJobLogAPI, getOpsOverviewAPI, submitOpsActionAPI, type OpsJob, type OpsKind, type OpsOverview } from '@/apis/ops'
import { hasPermission } from '@/utils/permission'

const route = useRoute()
const loading = ref(false)
const submitting = ref(false)
const argument = ref('')
const overview = ref<OpsOverview>({ configured: false, runnerOnline: false, currentVersion: '未记录', message: '', jobs: [] })
const logVisible = ref(false)
const logLines = ref<string[]>([])
let timer: number | undefined

const kind = computed(() => String(route.meta.opsKind || 'deployment') as OpsKind)
const definitions = {
  deployment: { title: '版本部署与回滚', hint: '输入镜像版本或 Git 提交号', permission: 'ops:deployment:manage', actions: [['deploy', '部署此版本'], ['rollback', '回滚到此版本']] },
  config: { title: 'Nacos 配置差异与快照', hint: '输入本次发布版本', permission: 'ops:config:manage', actions: [['diff', '检查差异'], ['apply', '发布并快照'], ['restore', '恢复发布前快照']] },
  monitoring: { title: '生产监控与告警', hint: '', permission: 'ops:monitoring:manage', actions: [['check', '立即健康检查']] },
  cmdb: { title: '轻量 CMDB 资产', hint: '', permission: 'ops:cmdb:manage', actions: [['sync', '立即同步资产']] },
} as const
const definition = computed(() => definitions[kind.value])
const canManage = computed(() => hasPermission(definition.value.permission))
const statusText: Record<string, string> = { QUEUED: '等待执行', RUNNING: '执行中', SUCCESS: '成功', FAILED: '失败' }
const actionText: Record<string, string> = {
  DEPLOY: '部署版本', ROLLBACK: '回滚版本', DIFF: '检查差异', APPLY: '发布并快照', RESTORE: '恢复快照',
  HEALTH_CHECK: '健康检查', SYNC: '同步资产',
}

const load = async () => {
  loading.value = true
  try { overview.value = (await getOpsOverviewAPI(kind.value)).data }
  finally { loading.value = false }
}

const submit = async (action: string, label: string) => {
  if ((kind.value === 'deployment' || kind.value === 'config') && !argument.value.trim()) {
    ElMessage.warning(definition.value.hint); return
  }
  await ElMessageBox.confirm(`确认${label}？操作会由宿主机执行器真实执行并记录完整日志。`, '确认运维操作', { type: 'warning' })
  submitting.value = true
  try {
    const result = await submitOpsActionAPI(kind.value, action, argument.value.trim())
    ElMessage.success(`任务已提交：${result.data}`)
    await load()
  } finally { submitting.value = false }
}

const showLog = async (job: OpsJob) => {
  logLines.value = (await getOpsJobLogAPI(kind.value, job.jobId)).data || []
  logVisible.value = true
}

watch(kind, () => { argument.value = ''; load() })
onMounted(() => { load(); timer = window.setInterval(load, 5000) })
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="app-container">
    <el-alert :title="overview.runnerOnline ? '宿主机运维执行器在线' : '宿主机运维执行器未连接'"
      :description="overview.message" :type="overview.runnerOnline ? 'success' : 'warning'" show-icon :closable="false" />

    <el-card class="panel" shadow="never">
      <template #header><b>{{ definition.title }}</b></template>
      <div class="actions">
        <el-input v-if="definition.hint" v-model="argument" :placeholder="definition.hint" clearable style="width:320px" />
        <el-button v-for="item in definition.actions" :key="item[0]" type="primary"
          :disabled="!overview.configured || !overview.runnerOnline || !canManage" :loading="submitting"
          @click="submit(item[0], item[1])">{{ item[1] }}</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
      <el-descriptions v-if="kind === 'deployment'" :column="2" border>
        <el-descriptions-item label="当前版本">{{ overview.currentVersion }}</el-descriptions-item>
        <el-descriptions-item label="执行器">{{ overview.runnerOnline ? '在线' : '离线' }}</el-descriptions-item>
      </el-descriptions>
      <el-descriptions v-if="kind === 'monitoring'" :column="3" border>
        <el-descriptions-item label="告警开关">{{ overview.alertEnabled ? '已开启' : '已关闭' }}</el-descriptions-item>
        <el-descriptions-item label="告警通道">{{ overview.alertChannel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Webhook">{{ overview.webhookConfigured ? '已配置' : '未配置' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert v-if="!canManage" title="当前账号只有查看权限，操作按钮已隐藏权限能力" type="info" :closable="false" />
    </el-card>

    <el-card v-if="kind === 'cmdb'" class="panel" shadow="never">
      <template #header><b>当前运行时资产</b></template>
      <el-table :data="overview.assets || []" border empty-text="暂无资产，请先启动执行器并同步">
        <el-table-column prop="service" label="服务" min-width="130" />
        <el-table-column prop="container" label="容器" min-width="150" />
        <el-table-column prop="image" label="镜像" min-width="220" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" min-width="120" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="health" label="健康状态" width="110" />
        <el-table-column prop="ports" label="端口" min-width="150" />
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      </el-table>
    </el-card>

    <el-card class="panel" shadow="never">
      <template #header><b>操作任务与日志</b></template>
      <el-table v-loading="loading" :data="overview.jobs" border empty-text="暂无运维任务">
        <el-table-column prop="jobId" label="任务编号" min-width="185" />
        <el-table-column label="动作" width="120"><template #default="{ row }">{{ actionText[row.action] || row.action }}</template></el-table-column>
        <el-table-column prop="argument" label="版本/范围" min-width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column label="状态" width="100"><template #default="{ row }">
          <el-tag :type="row.status === 'SUCCESS' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'">{{ statusText[row.status] || row.status }}</el-tag>
        </template></el-table-column>
        <el-table-column prop="requestedAt" label="提交时间" min-width="180" />
        <el-table-column prop="message" label="结果" min-width="180" />
        <el-table-column label="操作" width="90"><template #default="{ row }"><el-button link type="primary" @click="showLog(row)">查看日志</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="logVisible" title="真实执行日志" width="70%">
      <pre class="log">{{ logLines.join('\n') }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.panel { margin-top: 16px; }
.actions { display:flex; gap:10px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
.log { max-height:60vh; overflow:auto; padding:16px; color:#d7e0ea; background:#17212b; white-space:pre-wrap; word-break:break-all; }
</style>
