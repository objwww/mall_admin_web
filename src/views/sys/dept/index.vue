<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, UserFilled } from '@element-plus/icons-vue'
import {
  getDeptListAPI,
  createDeptAPI,
  updateDeptAPI,
  deleteDeptAPI,
  assignAdminOrgAPI,
  getCurrentScopeAPI,
  getPostOptionsAPI,
} from '@/apis/sys'
import { getAdminListAPI } from '@/apis/admin'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ deptName: '', status: null as number | null })
const deptList = ref<Record<string, any>[]>([])
const loading = ref(false)
const postOptions = ref<Record<string, any>[]>([])

/* 扁平列表 -> 树形 */
const treeData = computed(() => {
  const map = new Map<number, any>()
  deptList.value.forEach(d => map.set(Number(d.id), { ...d, children: [] }))
  const roots: any[] = []
  map.forEach(node => {
    const pid = Number(node.parent_id)
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
})

const getList = async () => {
  loading.value = true
  try {
    const res = await getDeptListAPI(listQuery)
    deptList.value = res.data || []
  } finally {
    loading.value = false
  }
}

/* 部门弹窗 */
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({ id: null, parentId: 0, deptName: '', leader: '', phone: '', email: '', sort: 0, status: 1 })
const rules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
}

const parentOptions = computed(() => {
  return deptList.value.filter(d => Number(d.id) !== Number(form.id)).map(d => ({ label: d.dept_name, value: Number(d.id) }))
})

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? { id: row.id, parentId: Number(row.parent_id) || 0, deptName: row.dept_name, leader: row.leader, phone: row.phone, email: row.email, sort: row.sort, status: row.status }
    : { id: null, parentId: 0, deptName: '', leader: '', phone: '', email: '', sort: 0, status: 1 })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = { parentId: form.parentId || 0, deptName: form.deptName, leader: form.leader, phone: form.phone, email: form.email, sort: form.sort, status: form.status }
  if (form.id) {
    await updateDeptAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createDeptAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该部门？', '提示', { type: 'warning' })
  await deleteDeptAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

/* 管理员分配弹窗 */
const assignVisible = ref(false)
const assignForm = reactive<Record<string, any>>({ adminId: null, deptId: null, postId: null })
const adminOptions = ref<Record<string, any>[]>([])
const scopeInfo = ref<Record<string, any> | null>(null)

const loadAdminOptions = async () => {
  const res = await getAdminListAPI({ pageNum: 1, pageSize: 100 })
  adminOptions.value = (res.data.list || []).map((a: any) => ({ label: `${a.username}（${a.nickName || '-'}）`, value: Number(a.id) }))
}

const openAssign = async () => {
  await loadAdminOptions()
  if (!postOptions.value.length) {
    const res = await getPostOptionsAPI()
    postOptions.value = res.data || []
  }
  Object.assign(assignForm, { adminId: null, deptId: null, postId: null })
  assignVisible.value = true
}

const submitAssign = async () => {
  if (!assignForm.adminId) {
    ElMessage.warning('请选择管理员')
    return
  }
  await assignAdminOrgAPI({ adminId: assignForm.adminId, deptId: assignForm.deptId, postId: assignForm.postId })
  ElMessage.success('分配成功')
  assignVisible.value = false
  loadScope()
}

const loadScope = async () => {
  try {
    const res = await getCurrentScopeAPI()
    scopeInfo.value = res.data
  } catch {
    scopeInfo.value = null
  }
}

const scopeLabel = (scope: number) => {
  return { 1: '全部数据', 2: '本部门及以下', 3: '仅本人' }[scope] || '全部数据'
}

onMounted(() => {
  getList()
  loadScope()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">部门管理</span>
        <div class="header-actions">
          <el-input v-model="listQuery.deptName" placeholder="部门名称" clearable style="width: 180px" @keyup.enter="getList" />
          <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.deptName = ''; listQuery.status = null; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="17">
        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <span class="toolbar-title">部门树</span>
            <div>
              <el-button :icon="UserFilled" @click="openAssign">管理员分配</el-button>
              <el-button type="primary" :icon="Plus" @click="openDialog()">新增部门</el-button>
            </div>
          </div>
          <el-table :data="treeData" v-loading="loading" border stripe row-key="id" default-expand-all
            :tree-props="{ children: 'children' }">
            <el-table-column label="部门名称" prop="dept_name" min-width="200" />
            <el-table-column label="负责人" prop="leader" width="110" align="center" />
            <el-table-column label="联系电话" prop="phone" width="130" align="center" />
            <el-table-column label="排序" prop="sort" width="70" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="170" align="center">
              <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" link @click="openDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="7">
        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <span class="toolbar-title">我的数据范围</span>
          </div>
          <el-descriptions v-if="scopeInfo" :column="1" border size="small">
            <el-descriptions-item label="管理员">{{ scopeInfo.username }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ scopeInfo.deptName || '未分配' }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ scopeInfo.roleName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="数据权限">
              <el-tag type="primary">{{ scopeLabel(scopeInfo.dataScope) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无数据范围信息" :image-size="70" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑部门' : '新增部门'" width="540px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级部门">
          <el-tree-select v-model="form.parentId" :data="[{ id: 0, dept_name: '顶级部门', children: treeData }]"
            :props="{ label: 'dept_name', children: 'children' }" check-strictly node-key="id" style="width: 100%" />
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="部门名称" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.leader" placeholder="负责人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="邮箱" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 管理员分配弹窗 -->
    <el-dialog v-model="assignVisible" title="管理员部门/岗位分配" width="520px" destroy-on-close>
      <el-form :model="assignForm" label-width="90px">
        <el-form-item label="管理员" required>
          <el-select v-model="assignForm.adminId" filterable placeholder="请选择管理员" style="width: 100%">
            <el-option v-for="opt in adminOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-tree-select v-model="assignForm.deptId" :data="[{ id: 0, dept_name: '无部门', children: treeData }]"
            :props="{ label: 'dept_name', children: 'children' }" check-strictly node-key="id" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="所属岗位">
          <el-select v-model="assignForm.postId" clearable placeholder="请选择岗位" style="width: 100%">
            <el-option v-for="opt in postOptions" :key="opt.id" :label="opt.post_name" :value="Number(opt.id)" />
          </el-select>
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
.filter-container { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; color: #303133; }
.header-actions { display: flex; gap: 10px; }
.table-card { margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.toolbar-title { font-weight: 600; color: #303133; }
</style>
