<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, Promotion } from '@element-plus/icons-vue'
import { upgradeMemberLevelAPI, getLevelUpgradeHistoryAPI, adjustGrowthAPI, getGrowthHistoryAPI } from '@/apis/member'
import { formatTs } from '@/utils/datetime'

/* ============ 等级升级 ============ */
const upgradeVisible = ref(false)
const upgradeForm = reactive({ memberId: null as number | null })

const submitUpgrade = async () => {
  if (!upgradeForm.memberId) {
    ElMessage.warning('请输入会员ID')
    return
  }
  const res = await upgradeMemberLevelAPI(upgradeForm.memberId)
  if (res.data.upgraded) {
    ElMessage.success('升级成功：等级 ' + res.data.oldLevelId + ' → ' + res.data.newLevelId)
  } else {
    ElMessage.info('当前等级已符合成长值，无需升级')
  }
  upgradeVisible.value = false
  getHistory()
}

/* ============ 成长值调整 ============ */
const adjustVisible = ref(false)
const adjustForm = reactive({ memberId: null as number | null, delta: 100, operateMan: 'admin', operateNote: '' })

const submitAdjust = async () => {
  if (!adjustForm.memberId) {
    ElMessage.warning('请输入会员ID')
    return
  }
  await adjustGrowthAPI({ ...adjustForm })
  ElMessage.success('成长值调整成功（调整后自动触发等级升级判定）')
  adjustVisible.value = false
  getHistory()
}

/* ============ 变更记录 ============ */
const historyQuery = reactive({ pageNum: 1, pageSize: 10, memberId: null as number | null })
const historyList = ref<Record<string, any>[]>([])
const historyTotal = ref(0)
const historyLoading = ref(false)

const getHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getLevelUpgradeHistoryAPI({ ...historyQuery })
    historyList.value = res.data.list || []
    historyTotal.value = res.data.total || 0
  } finally {
    historyLoading.value = false
  }
}

/* ============ 成长值流水 ============ */
const growthVisible = ref(false)
const growthQuery = reactive({ memberId: null as number | null, pageNum: 1, pageSize: 10 })
const growthList = ref<Record<string, any>[]>([])

const openGrowth = async () => {
  if (!growthQuery.memberId) {
    ElMessage.warning('请输入会员ID')
    return
  }
  growthVisible.value = true
  const res = await getGrowthHistoryAPI({ ...growthQuery })
  growthList.value = res.data.list || []
}

onMounted(() => getHistory())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">会员等级升级</span>
        <div class="header-actions">
          <el-input-number v-model="historyQuery.memberId" placeholder="会员ID" :controls="false" style="width: 140px" />
          <el-button type="primary" :icon="Search" @click="getHistory">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { historyQuery.memberId = null; getHistory() }">重置</el-button>
          <el-button type="warning" :icon="Promotion" @click="adjustVisible = true">调整成长值</el-button>
          <el-button type="primary" :icon="Plus" @click="upgradeVisible = true">手动升级</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">等级变更记录</span>
        <el-button link type="primary" @click="openGrowth">查看成长值流水</el-button>
      </div>
      <el-table :data="historyList" v-loading="historyLoading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="会员ID" prop="member_id" width="90" align="center" />
        <el-table-column label="原等级" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.old_level_id ?? '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="新等级" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="success">{{ scope.row.new_level_id }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变更类型" width="130" align="center">
          <template #default="scope">
            <el-tag size="small" type="warning" effect="plain">{{ scope.row.change_type === 1 ? '成长值升级' : '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变更时间" width="180" align="center">
          <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, prev, pager, next" :total="historyTotal"
        v-model:current-page="historyQuery.pageNum" v-model:page-size="historyQuery.pageSize"
        @current-change="getHistory" />
    </el-card>

    <!-- 升级弹窗 -->
    <el-dialog v-model="upgradeVisible" title="按成长值升级会员等级" width="440px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="会员ID" required>
          <el-input-number v-model="upgradeForm.memberId" :min="1" :controls="false" style="width: 100%" placeholder="输入会员ID" />
        </el-form-item>
        <el-form-item>
          <span class="tip">按会员当前成长值匹配最高等级门槛，自动升级并写入变更记录</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="upgradeVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpgrade">执行升级</el-button>
      </template>
    </el-dialog>

    <!-- 调整成长值弹窗 -->
    <el-dialog v-model="adjustVisible" title="调整会员成长值" width="440px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="会员ID" required>
          <el-input-number v-model="adjustForm.memberId" :min="1" :controls="false" style="width: 100%" placeholder="输入会员ID" />
        </el-form-item>
        <el-form-item label="变动值">
          <el-input-number v-model="adjustForm.delta" :step="10" placeholder="正数增加，负数减少" style="width: 100%" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="adjustForm.operateMan" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="adjustForm.operateNote" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确定</el-button>
      </template>
    </el-dialog>

    <!-- 成长值流水弹窗 -->
    <el-dialog v-model="growthVisible" title="成长值流水" width="640px" destroy-on-close>
      <el-form inline>
        <el-form-item label="会员ID">
          <el-input-number v-model="growthQuery.memberId" :min="1" :controls="false" style="width: 130px" />
        </el-form-item>
        <el-button type="primary" @click="openGrowth">查询</el-button>
      </el-form>
      <el-table :data="growthList" border size="small">
        <el-table-column label="ID" prop="id" width="70" align="center" />
        <el-table-column label="变动值" prop="change_value" width="100" align="center">
          <template #default="scope">
            <span :style="{ color: scope.row.change_value > 0 ? '#67C23A' : '#F56C6C' }">{{ scope.row.change_value }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operate_man" width="110" align="center" />
        <el-table-column label="备注" prop="operate_note" min-width="150" show-overflow-tooltip />
        <el-table-column label="时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter-container { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.card-title { font-weight: 600; font-size: 15px; color: #303133; }
.header-actions { display: flex; gap: 10px; align-items: center; }
.table-card { margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.toolbar-title { font-weight: 600; color: #303133; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
.tip { color: #909399; font-size: 12px; }
</style>
