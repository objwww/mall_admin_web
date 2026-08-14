<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, VideoPlay, SwitchButton } from '@element-plus/icons-vue'
import { getJobListAPI, createJobAPI, updateJobAPI, deleteJobAPI, updateJobStatusAPI, runJobAPI, getJobLogListAPI } from '@/apis/job'
import { formatTs } from '@/utils/datetime'

/* ============ 任务管理 ============ */
const jobQuery = reactive({ pageNum: 1, pageSize: 10, jobName: '', status: null as number | null })
const jobList = ref<Record<string, any>[]>([])
const jobTotal = ref(0)
const jobLoading = ref(false)

const getJobList = async () => {
  jobLoading.value = true
  try {
    const res = await getJobListAPI({ ...jobQuery })
    jobList.value = res.data.list || []
    jobTotal.value = res.data.total || 0
  } finally {
    jobLoading.value = false
  }
}

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({ id: null, jobName: '', jobGroup: 'DEFAULT', jobHandler: '', cron: '', params: '', status: 1, remark: '' })
const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  jobHandler: [{ required: true, message: '请输入执行器Bean名', trigger: 'blur' }],
  cron: [{ required: true, message: '请输入cron表达式', trigger: 'blur' }],
}

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? { id: row.id, jobName: row.job_name, jobGroup: row.job_group, jobHandler: row.job_handler, cron: row.cron, params: row.params, status: row.status, remark: row.remark }
    : { id: null, jobName: '', jobGroup: 'DEFAULT', jobHandler: '', cron: '', params: '', status: 1, remark: '' })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = { jobName: form.jobName, jobGroup: form.jobGroup, jobHandler: form.jobHandler, cron: form.cron, params: form.params, status: form.status, remark: form.remark }
  if (form.id) {
    await updateJobAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createJobAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getJobList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该任务？', '提示', { type: 'warning' })
  await deleteJobAPI(row.id)
  ElMessage.success('删除成功')
  getJobList()
}

const handleToggleStatus = async (row: Record<string, any>) => {
  const next = row.status === 1 ? 0 : 1
  await updateJobStatusAPI(row.id, next)
  ElMessage.success(next === 1 ? '任务已启用' : '任务已停用')
  getJobList()
}

const handleRun = async (row: Record<string, any>) => {
  await runJobAPI(row.id)
  ElMessage.success('已触发执行，可在「执行日志」查看结果')
  setTimeout(() => getLogList(), 1500)
}

/* ============ 执行日志 ============ */
const logQuery = reactive({ pageNum: 1, pageSize: 10, jobName: '', success: null as number | null })
const logList = ref<Record<string, any>[]>([])
const logTotal = ref(0)
const logLoading = ref(false)
const activeTab = ref('job')

const getLogList = async () => {
  logLoading.value = true
  try {
    const res = await getJobLogListAPI({ ...logQuery })
    logList.value = res.data.list || []
    logTotal.value = res.data.total || 0
  } finally {
    logLoading.value = false
  }
}

onMounted(() => {
  getJobList()
  getLogList()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="任务管理" name="job">
          <div class="filter-bar">
            <el-input v-model="jobQuery.jobName" placeholder="任务名称" clearable style="width: 180px" @keyup.enter="getJobList" />
            <el-select v-model="jobQuery.status" placeholder="状态" clearable style="width: 120px">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="getJobList">查询</el-button>
            <el-button :icon="RefreshLeft" @click="() => { jobQuery.jobName = ''; jobQuery.status = null; getJobList() }">重置</el-button>
            <el-button type="primary" :icon="Plus" style="margin-left: auto" @click="openDialog()">新增任务</el-button>
          </div>
          <el-table :data="jobList" v-loading="jobLoading" border stripe>
            <el-table-column label="编号" prop="id" width="70" align="center" />
            <el-table-column label="任务名称" prop="job_name" min-width="160" align="center" />
            <el-table-column label="任务组" prop="job_group" width="100" align="center" />
            <el-table-column label="执行器" prop="job_handler" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column label="cron" prop="cron" min-width="150" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column label="操作" width="230" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="success" link :icon="VideoPlay" @click="handleRun(scope.row)">执行</el-button>
                <el-button size="small" type="primary" link @click="openDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="warning" link :icon="SwitchButton" @click="handleToggleStatus(scope.row)">
                  {{ scope.row.status === 1 ? '停用' : '启用' }}
                </el-button>
                <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
            :total="jobTotal" v-model:current-page="jobQuery.pageNum" v-model:page-size="jobQuery.pageSize"
            :page-sizes="[10, 20, 50]" @current-change="getJobList" @size-change="() => { jobQuery.pageNum = 1; getJobList() }" />
        </el-tab-pane>

        <el-tab-pane label="执行日志" name="log">
          <div class="filter-bar">
            <el-input v-model="logQuery.jobName" placeholder="任务名称" clearable style="width: 180px" @keyup.enter="getLogList" />
            <el-select v-model="logQuery.success" placeholder="执行结果" clearable style="width: 120px">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="getLogList">查询</el-button>
            <el-button :icon="RefreshLeft" @click="() => { logQuery.jobName = ''; logQuery.success = null; getLogList() }">重置</el-button>
          </div>
          <el-table :data="logList" v-loading="logLoading" border stripe>
            <el-table-column label="编号" prop="id" width="70" align="center" />
            <el-table-column label="任务ID" prop="job_id" width="80" align="center" />
            <el-table-column label="任务名称" prop="job_name" min-width="180" align="center" />
            <el-table-column label="结果" width="90" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.success === 1 ? 'success' : 'danger'">{{ scope.row.success === 1 ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="100" align="center">
              <template #default="scope">{{ scope.row.cost_time != null ? scope.row.cost_time + ' ms' : '-' }}</template>
            </el-table-column>
            <el-table-column label="错误信息" prop="error_msg" min-width="200" show-overflow-tooltip />
            <el-table-column label="开始时间" width="170" align="center">
              <template #default="scope">{{ formatTs(scope.row.start_time) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
            :total="logTotal" v-model:current-page="logQuery.pageNum" v-model:page-size="logQuery.pageSize"
            :page-sizes="[10, 20, 50]" @current-change="getLogList" @size-change="() => { logQuery.pageNum = 1; getLogList() }" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑任务' : '新增任务'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="任务名称" prop="jobName">
          <el-input v-model="form.jobName" placeholder="如 订单超时自动关闭" />
        </el-form-item>
        <el-form-item label="任务组">
          <el-input v-model="form.jobGroup" placeholder="DEFAULT" />
        </el-form-item>
        <el-form-item label="执行器Bean" prop="jobHandler">
          <el-input v-model="form.jobHandler" placeholder="如 orderTimeOutCancelHandler" />
        </el-form-item>
        <el-form-item label="cron表达式" prop="cron">
          <el-input v-model="form.cron" placeholder="如 0 0/10 * * * ?" />
        </el-form-item>
        <el-form-item label="参数">
          <el-input v-model="form.params" placeholder="任务参数（可选）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.table-card { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
