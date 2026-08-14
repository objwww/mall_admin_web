<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, MagicStick, UserFilled } from '@element-plus/icons-vue'
import {
  getMemberTagListAPI,
  createMemberTagAPI,
  updateMemberTagAPI,
  deleteMemberTagAPI,
  assignMemberTagAPI,
  getMemberTagsAPI,
  getMemberPageAPI,
  autoMemberTagAPI,
} from '@/apis/member'
import { formatTs } from '@/utils/datetime'

/* ============ 标签管理 ============ */
const tagList = ref<Record<string, any>[]>([])
const tagLoading = ref(false)

const getTagList = async () => {
  tagLoading.value = true
  try {
    const res = await getMemberTagListAPI()
    tagList.value = res.data || []
  } finally {
    tagLoading.value = false
  }
}

const tagDialogVisible = ref(false)
const tagFormRef = ref()
const tagForm = reactive<Record<string, any>>({ id: null, name: '', finishOrderCount: 0, finishOrderAmount: 0 })
const tagRules = { name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }] }

const openTagDialog = (row?: Record<string, any>) => {
  Object.assign(tagForm, row
    ? { id: row.id, name: row.name, finishOrderCount: row.finish_order_count, finishOrderAmount: row.finish_order_amount }
    : { id: null, name: '', finishOrderCount: 0, finishOrderAmount: 0 })
  tagDialogVisible.value = true
}

const submitTag = async () => {
  await tagFormRef.value.validate()
  const params = { name: tagForm.name, finishOrderCount: tagForm.finishOrderCount, finishOrderAmount: tagForm.finishOrderAmount }
  if (tagForm.id) {
    await updateMemberTagAPI({ id: tagForm.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createMemberTagAPI(params)
    ElMessage.success('新增成功')
  }
  tagDialogVisible.value = false
  getTagList()
}

const handleDeleteTag = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('删除标签将解除所有会员的该标签，是否继续？', '提示', { type: 'warning' })
  await deleteMemberTagAPI(row.id)
  ElMessage.success('删除成功')
  getTagList()
}

const handleAutoTag = async () => {
  await ElMessageBox.confirm('将按标签阈值（完成订单数/金额）重新自动打标签，是否继续？', '提示', { type: 'warning' })
  const res = await autoMemberTagAPI()
  ElMessage.success('自动打标签完成，命中 ' + res.data + ' 人次')
  getTagList()
}

/* ============ 会员查询/打标 ============ */
const memberQuery = reactive({ pageNum: 1, pageSize: 10, tagId: null as number | null, keyword: '' })
const memberList = ref<Record<string, any>[]>([])
const memberTotal = ref(0)
const memberLoading = ref(false)

const getMemberList = async () => {
  memberLoading.value = true
  try {
    const res = await getMemberPageAPI({ ...memberQuery })
    memberList.value = res.data.list || []
    memberTotal.value = res.data.total || 0
  } finally {
    memberLoading.value = false
  }
}

/* 打标弹窗 */
const assignVisible = ref(false)
const assignMember = ref<Record<string, any> | null>(null)
const assignTagIds = ref<number[]>([])

const openAssign = async (row: Record<string, any>) => {
  assignMember.value = row
  const res = await getMemberTagsAPI(row.id)
  assignTagIds.value = (res.data || []).map(t => Number(t.id))
  assignVisible.value = true
}

const submitAssign = async () => {
  if (!assignMember.value) return
  await assignMemberTagAPI({ memberId: assignMember.value.id, tagIds: assignTagIds.value.join(',') })
  ElMessage.success('打标成功')
  assignVisible.value = false
  getMemberList()
}

onMounted(() => {
  getTagList()
  getMemberList()
})
</script>

<template>
  <div class="app-container">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <span class="toolbar-title">标签/分组</span>
            <div>
              <el-button type="success" :icon="MagicStick" @click="handleAutoTag">自动打标签</el-button>
              <el-button type="primary" :icon="Plus" @click="openTagDialog()">新增标签</el-button>
            </div>
          </div>
          <el-table :data="tagList" v-loading="tagLoading" border stripe>
            <el-table-column label="编号" prop="id" width="70" align="center" />
            <el-table-column label="标签名称" prop="name" min-width="120" align="center" />
            <el-table-column label="规则：完成订单数" width="130" align="center">
              <template #default="scope">{{ scope.row.finish_order_count }} 单</template>
            </el-table-column>
            <el-table-column label="规则：完成金额" width="130" align="center">
              <template #default="scope">￥{{ scope.row.finish_order_amount }}</template>
            </el-table-column>
            <el-table-column label="会员数" width="90" align="center">
              <template #default="scope">
                <el-tag size="small" type="primary" effect="plain">{{ scope.row.member_count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" link @click="openTagDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" link @click="handleDeleteTag(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never" class="table-card">
          <div class="filter-bar">
            <span class="toolbar-title">会员查询</span>
            <div style="margin-left: auto; display: flex; gap: 10px">
              <el-select v-model="memberQuery.tagId" placeholder="按标签筛选" clearable style="width: 150px">
                <el-option v-for="t in tagList" :key="t.id" :label="t.name" :value="Number(t.id)" />
              </el-select>
              <el-input v-model="memberQuery.keyword" placeholder="用户名/昵称/手机号" clearable style="width: 190px" @keyup.enter="getMemberList" />
              <el-button type="primary" :icon="Search" @click="getMemberList">查询</el-button>
              <el-button :icon="RefreshLeft" @click="() => { memberQuery.tagId = null; memberQuery.keyword = ''; getMemberList() }">重置</el-button>
            </div>
          </div>
          <el-table :data="memberList" v-loading="memberLoading" border stripe>
            <el-table-column label="ID" prop="id" width="60" align="center" />
            <el-table-column label="用户名" prop="username" min-width="110" align="center" />
            <el-table-column label="昵称" prop="nickname" min-width="110" align="center" />
            <el-table-column label="手机号" prop="phone" width="120" align="center" />
            <el-table-column label="成长值" prop="growth" width="80" align="center" />
            <el-table-column label="积分" prop="integration" width="80" align="center" />
            <el-table-column label="等级ID" prop="member_level_id" width="80" align="center" />
            <el-table-column label="操作" width="90" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" link :icon="UserFilled" @click="openAssign(scope.row)">打标</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, prev, pager, next" :total="memberTotal"
            v-model:current-page="memberQuery.pageNum" v-model:page-size="memberQuery.pageSize"
            @current-change="getMemberList" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签弹窗 -->
    <el-dialog v-model="tagDialogVisible" :title="tagForm.id ? '编辑标签' : '新增标签'" width="480px" destroy-on-close>
      <el-form ref="tagFormRef" :model="tagForm" :rules="tagRules" label-width="140px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="如 高价值客户" />
        </el-form-item>
        <el-form-item label="完成订单数阈值">
          <el-input-number v-model="tagForm.finishOrderCount" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="完成金额阈值(元)">
          <el-input-number v-model="tagForm.finishOrderAmount" :min="0" :precision="2" :step="100" />
        </el-form-item>
        <el-form-item>
          <span class="tip">自动打标签规则：完成订单数 ≥ 阈值 且 完成金额 ≥ 阈值；均为 0 时标记为新客</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTag">确定</el-button>
      </template>
    </el-dialog>

    <!-- 打标弹窗 -->
    <el-dialog v-model="assignVisible" :title="'为会员打标：' + (assignMember?.username || '')" width="480px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="标签">
          <el-select v-model="assignTagIds" multiple placeholder="选择标签" style="width: 100%">
            <el-option v-for="t in tagList" :key="t.id" :label="t.name" :value="Number(t.id)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <span class="tip">保存后将覆盖该会员已有标签</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.table-card { margin-bottom: 16px; }
.table-toolbar, .filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.toolbar-title { font-weight: 600; color: #303133; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
.tip { color: #909399; font-size: 12px; }
</style>
