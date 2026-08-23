<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getAccessLogListAPI, getErrorLogListAPI, getOperationLogListAPI } from '@/apis/statistics'
import { formatTs } from '@/utils/datetime'
import { useRoute } from 'vue-router'

const activeTab = ref('access')
const route = useRoute()

/* ============ 访问日志 ============ */
const accessQuery = reactive({ pageNum: 1, pageSize: 10, uri: '', method: '', status: null as number | null, traceId: '' })
const accessList = ref<Record<string, any>[]>([])
const accessTotal = ref(0)
const accessLoading = ref(false)

const getAccessList = async () => {
  accessLoading.value = true
  try {
    const res = await getAccessLogListAPI({ ...accessQuery })
    accessList.value = res.data.list || []
    accessTotal.value = res.data.total || 0
  } finally {
    accessLoading.value = false
  }
}

/* ============ 错误日志 ============ */
const errorQuery = reactive({ pageNum: 1, pageSize: 10, uri: '', errorType: '', traceId: '' })
const errorList = ref<Record<string, any>[]>([])
const errorTotal = ref(0)
const errorLoading = ref(false)

const getErrorList = async () => {
  errorLoading.value = true
  try {
    const res = await getErrorLogListAPI({ ...errorQuery })
    errorList.value = res.data.list || []
    errorTotal.value = res.data.total || 0
  } finally {
    errorLoading.value = false
  }
}

/* ============ 操作日志 ============ */
const opQuery = reactive({ pageNum: 1, pageSize: 10, description: '', type: '', operatorId: '', traceId: '' })
const opList = ref<Record<string, any>[]>([])
const opTotal = ref(0)
const opLoading = ref(false)

const getOpList = async () => {
  opLoading.value = true
  try {
    const res = await getOperationLogListAPI({ ...opQuery })
    opList.value = res.data.list || []
    opTotal.value = res.data.total || 0
  } finally {
    opLoading.value = false
  }
}

const methodTag = (m: string): 'success' | 'warning' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'danger' | undefined> = {
    GET: undefined,
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger',
  }
  return map[m]
}

onMounted(() => {
  const traceId = typeof route.query.traceId === 'string' ? route.query.traceId : ''
  accessQuery.traceId = errorQuery.traceId = opQuery.traceId = traceId
  if (['access', 'error', 'operation'].includes(String(route.query.tab))) activeTab.value = String(route.query.tab)
  getAccessList()
  getErrorList()
  getOpList()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab">
        <!-- 访问日志 -->
        <el-tab-pane label="访问日志" name="access">
          <div class="filter-bar">
            <el-input v-model="accessQuery.uri" placeholder="接口地址" clearable style="width: 220px" @keyup.enter="getAccessList" />
            <el-input v-model="accessQuery.method" placeholder="方法" clearable style="width: 100px" @keyup.enter="getAccessList" />
            <el-input-number v-model="accessQuery.status" placeholder="状态码" :controls="false" style="width: 110px" />
            <el-input v-model="accessQuery.traceId" placeholder="追踪编号" clearable style="width: 260px" @keyup.enter="getAccessList" />
            <el-button type="primary" :icon="Search" @click="getAccessList">查询</el-button>
            <el-button :icon="RefreshLeft" @click="() => { accessQuery.uri = ''; accessQuery.method = ''; accessQuery.status = null; accessQuery.traceId = ''; getAccessList() }">重置</el-button>
          </div>
          <el-table :data="accessList" v-loading="accessLoading" border stripe size="small">
            <el-table-column label="ID" prop="id" width="60" align="center" />
            <el-table-column label="方法" width="80" align="center">
              <template #default="scope">
                <el-tag size="small" :type="methodTag(scope.row.method)">{{ scope.row.method }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="接口地址" prop="uri" min-width="220" show-overflow-tooltip />
            <el-table-column label="状态码" width="80" align="center">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.status >= 500 ? 'danger' : scope.row.status >= 400 ? 'warning' : 'success'">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="成功" width="70" align="center">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.success === 1 ? 'success' : 'danger'">{{ scope.row.success === 1 ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="耗时(ms)" prop="spend_time" width="90" align="center" />
            <el-table-column label="IP" prop="ip" width="130" align="center" />
            <el-table-column label="追踪编号" prop="trace_id" min-width="150" show-overflow-tooltip />
            <el-table-column label="时间" width="170" align="center">
              <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
            :total="accessTotal" v-model:current-page="accessQuery.pageNum" v-model:page-size="accessQuery.pageSize"
            :page-sizes="[10, 20, 50]" @current-change="getAccessList" @size-change="() => { accessQuery.pageNum = 1; getAccessList() }" />
        </el-tab-pane>

        <!-- 错误日志 -->
        <el-tab-pane label="错误日志" name="error">
          <div class="filter-bar">
            <el-input v-model="errorQuery.uri" placeholder="接口地址" clearable style="width: 220px" @keyup.enter="getErrorList" />
            <el-input v-model="errorQuery.errorType" placeholder="异常类型" clearable style="width: 220px" @keyup.enter="getErrorList" />
            <el-input v-model="errorQuery.traceId" placeholder="追踪编号" clearable style="width: 260px" @keyup.enter="getErrorList" />
            <el-button type="primary" :icon="Search" @click="getErrorList">查询</el-button>
            <el-button :icon="RefreshLeft" @click="() => { errorQuery.uri = ''; errorQuery.errorType = ''; errorQuery.traceId = ''; getErrorList() }">重置</el-button>
          </div>
          <el-table :data="errorList" v-loading="errorLoading" border stripe size="small">
            <el-table-column type="expand">
              <template #default="scope">
                <pre class="stack-view">{{ scope.row.stack_trace || '无堆栈信息' }}</pre>
              </template>
            </el-table-column>
            <el-table-column label="ID" prop="id" width="60" align="center" />
            <el-table-column label="方法" width="80" align="center">
              <template #default="scope">
                <el-tag size="small" :type="methodTag(scope.row.method)">{{ scope.row.method }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="接口地址" prop="uri" min-width="180" show-overflow-tooltip />
            <el-table-column label="异常类型" prop="error_type" min-width="220" show-overflow-tooltip />
            <el-table-column label="错误信息" prop="error_msg" min-width="180" show-overflow-tooltip />
            <el-table-column label="追踪编号" prop="trace_id" min-width="140" show-overflow-tooltip />
            <el-table-column label="时间" width="170" align="center">
              <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
            :total="errorTotal" v-model:current-page="errorQuery.pageNum" v-model:page-size="errorQuery.pageSize"
            :page-sizes="[10, 20, 50]" @current-change="getErrorList" @size-change="() => { errorQuery.pageNum = 1; getErrorList() }" />
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane label="操作日志" name="operation">
          <div class="filter-bar">
            <el-input v-model="opQuery.description" placeholder="操作描述" clearable style="width: 220px" @keyup.enter="getOpList" />
            <el-input v-model="opQuery.type" placeholder="操作类型" clearable style="width: 120px" @keyup.enter="getOpList" />
            <el-input v-model="opQuery.operatorId" placeholder="操作人ID" clearable style="width: 120px" @keyup.enter="getOpList" />
            <el-input v-model="opQuery.traceId" placeholder="追踪编号" clearable style="width: 260px" @keyup.enter="getOpList" />
            <el-button type="primary" :icon="Search" @click="getOpList">查询</el-button>
            <el-button :icon="RefreshLeft" @click="() => { opQuery.description = ''; opQuery.type = ''; opQuery.operatorId = ''; opQuery.traceId = ''; getOpList() }">重置</el-button>
          </div>
          <el-table :data="opList" v-loading="opLoading" border stripe size="small">
            <el-table-column label="ID" prop="id" width="60" align="center" />
            <el-table-column label="操作人" prop="operator_id" width="90" align="center" />
            <el-table-column label="类型" width="90" align="center">
              <template #default="scope">
                <el-tag size="small" :type="methodTag(scope.row.type)">{{ scope.row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作描述" prop="description" min-width="220" show-overflow-tooltip />
            <el-table-column label="方法" prop="method" min-width="200" show-overflow-tooltip />
            <el-table-column label="耗时(ms)" prop="cost_time" width="90" align="center" />
            <el-table-column label="追踪编号" prop="trace_id" min-width="140" show-overflow-tooltip />
            <el-table-column label="时间" width="170" align="center">
              <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
            :total="opTotal" v-model:current-page="opQuery.pageNum" v-model:page-size="opQuery.pageSize"
            :page-sizes="[10, 20, 50]" @current-change="getOpList" @size-change="() => { opQuery.pageNum = 1; getOpList() }" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.table-card { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
.stack-view {
  background: #f5f7fa; padding: 12px; border-radius: 6px; font-size: 12px;
  line-height: 1.6; white-space: pre-wrap; word-break: break-all; margin: 0; max-height: 300px; overflow: auto;
}
</style>
