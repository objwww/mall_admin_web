<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft } from '@element-plus/icons-vue'
import {
  getDictTypeListAPI,
  createDictTypeAPI,
  updateDictTypeAPI,
  deleteDictTypeAPI,
  getDictDataListAPI,
  createDictDataAPI,
  updateDictDataAPI,
  deleteDictDataAPI,
} from '@/apis/sys'
import { formatTs } from '@/utils/datetime'

/* ============ 字典类型 ============ */
const typeQuery = reactive({ pageNum: 1, pageSize: 10, dictName: '', dictType: '' })
const typeList = ref<Record<string, any>[]>([])
const typeTotal = ref(0)
const typeLoading = ref(false)

const getTypeList = async () => {
  typeLoading.value = true
  try {
    const res = await getDictTypeListAPI({ ...typeQuery })
    typeList.value = res.data.list || []
    typeTotal.value = res.data.total || 0
  } finally {
    typeLoading.value = false
  }
}

/* 类型弹窗 */
const typeDialogVisible = ref(false)
const typeFormRef = ref()
const typeForm = reactive<Record<string, any>>({ id: null, dictType: '', dictName: '', status: 1, remark: '' })
const typeRules = {
  dictType: [{ required: true, message: '请输入字典类型编码', trigger: 'blur' }],
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
}

const openTypeDialog = (row?: Record<string, any>) => {
  Object.assign(typeForm, row ? { id: row.id, dictType: row.dict_type, dictName: row.dict_name, status: row.status, remark: row.remark } : { id: null, dictType: '', dictName: '', status: 1, remark: '' })
  typeDialogVisible.value = true
}

const submitType = async () => {
  await typeFormRef.value.validate()
  const params = { dictType: typeForm.dictType, dictName: typeForm.dictName, status: typeForm.status, remark: typeForm.remark }
  if (typeForm.id) {
    await updateDictTypeAPI({ id: typeForm.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createDictTypeAPI(params)
    ElMessage.success('新增成功')
  }
  typeDialogVisible.value = false
  getTypeList()
}

const handleDeleteType = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('删除字典类型将同时删除其字典数据，是否继续？', '提示', { type: 'warning' })
  await deleteDictTypeAPI(row.id)
  ElMessage.success('删除成功')
  getTypeList()
}

/* ============ 字典数据 ============ */
const activeTab = ref('type')
const dataType = ref('')
const dataList = ref<Record<string, any>[]>([])
const dataLoading = ref(false)

const viewData = (row: Record<string, any>) => {
  dataType.value = row.dict_type
  activeTab.value = 'data'
  getDataList()
}

const getDataList = async () => {
  if (!dataType.value) return
  dataLoading.value = true
  try {
    const res = await getDictDataListAPI(dataType.value)
    dataList.value = res.data || []
  } finally {
    dataLoading.value = false
  }
}

const dataDialogVisible = ref(false)
const dataFormRef = ref()
const dataForm = reactive<Record<string, any>>({ id: null, dictLabel: '', dictValue: '', sort: 0, status: 1, remark: '' })
const dataRules = {
  dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典键值', trigger: 'blur' }],
}

const openDataDialog = (row?: Record<string, any>) => {
  Object.assign(dataForm, row ? { id: row.id, dictLabel: row.dict_label, dictValue: row.dict_value, sort: row.sort, status: row.status, remark: row.remark } : { id: null, dictLabel: '', dictValue: '', sort: 0, status: 1, remark: '' })
  dataDialogVisible.value = true
}

const submitData = async () => {
  await dataFormRef.value.validate()
  const params = { dictType: dataType.value, dictLabel: dataForm.dictLabel, dictValue: dataForm.dictValue, sort: dataForm.sort, status: dataForm.status, remark: dataForm.remark }
  if (dataForm.id) {
    await updateDictDataAPI({ id: dataForm.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createDictDataAPI(params)
    ElMessage.success('新增成功')
  }
  dataDialogVisible.value = false
  getDataList()
}

const handleDeleteData = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该字典数据？', '提示', { type: 'warning' })
  await deleteDictDataAPI(row.id)
  ElMessage.success('删除成功')
  getDataList()
}

onMounted(() => getTypeList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">字典管理</span>
        <div class="header-actions">
          <el-input v-model="typeQuery.dictName" placeholder="字典名称" clearable style="width: 180px" @keyup.enter="getTypeList" />
          <el-input v-model="typeQuery.dictType" placeholder="字典类型" clearable style="width: 180px" @keyup.enter="getTypeList" />
          <el-button type="primary" :icon="Search" @click="getTypeList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { typeQuery.dictName = ''; typeQuery.dictType = ''; getTypeList() }">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab" @tab-change="() => activeTab === 'data' && getDataList()">
        <el-tab-pane label="字典类型" name="type">
          <div class="table-toolbar">
            <span class="toolbar-title">类型列表</span>
            <el-button type="primary" :icon="Plus" @click="openTypeDialog()">新增类型</el-button>
          </div>
          <el-table :data="typeList" v-loading="typeLoading" border stripe>
            <el-table-column label="编号" prop="id" width="70" align="center" />
            <el-table-column label="字典类型" prop="dict_type" min-width="160" align="center" />
            <el-table-column label="字典名称" prop="dict_name" min-width="160" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column label="创建时间" width="170" align="center">
              <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" link @click="viewData(scope.row)">字典数据</el-button>
                <el-button size="small" type="primary" link @click="openTypeDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" link @click="handleDeleteType(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
            :total="typeTotal" v-model:current-page="typeQuery.pageNum" v-model:page-size="typeQuery.pageSize"
            :page-sizes="[10, 20, 50]" @current-change="getTypeList" @size-change="() => { typeQuery.pageNum = 1; getTypeList() }" />
        </el-tab-pane>

        <el-tab-pane :label="'字典数据' + (dataType ? '（' + dataType + '）' : '')" name="data">
          <div class="table-toolbar">
            <span class="toolbar-title">数据列表</span>
            <div>
              <el-button v-if="dataType" link type="primary" @click="activeTab = 'type'">返回类型列表</el-button>
              <el-button type="primary" :icon="Plus" :disabled="!dataType" @click="openDataDialog()">新增数据</el-button>
            </div>
          </div>
          <el-table :data="dataList" v-loading="dataLoading" border stripe>
            <el-table-column label="编号" prop="id" width="70" align="center" />
            <el-table-column label="字典标签" prop="dict_label" min-width="160" align="center" />
            <el-table-column label="字典键值" prop="dict_value" min-width="160" align="center" />
            <el-table-column label="排序" prop="sort" width="80" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" link @click="openDataDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" link @click="handleDeleteData(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 类型弹窗 -->
    <el-dialog v-model="typeDialogVisible" :title="typeForm.id ? '编辑字典类型' : '新增字典类型'" width="520px" destroy-on-close>
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="110px">
        <el-form-item label="字典类型编码" prop="dictType">
          <el-input v-model="typeForm.dictType" placeholder="如 order_status" :disabled="!!typeForm.id" />
        </el-form-item>
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="typeForm.dictName" placeholder="如 订单状态" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="typeForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="typeForm.remark" type="textarea" :rows="2" placeholder="备注说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据弹窗 -->
    <el-dialog v-model="dataDialogVisible" :title="dataForm.id ? '编辑字典数据' : '新增字典数据'" width="520px" destroy-on-close>
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="110px">
        <el-form-item label="所属类型">
          <el-input :model-value="dataType" disabled />
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model="dataForm.dictLabel" placeholder="如 待付款" />
        </el-form-item>
        <el-form-item label="字典键值" prop="dictValue">
          <el-input v-model="dataForm.dictValue" placeholder="如 0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dataForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dataForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dataForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitData">确定</el-button>
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
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
