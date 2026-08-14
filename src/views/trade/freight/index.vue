<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft } from '@element-plus/icons-vue'
import { getFreightTemplateListAPI, createFreightTemplateAPI, updateFreightTemplateAPI, deleteFreightTemplateAPI } from '@/apis/trade'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, name: '' })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getFreightTemplateListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({
  id: null, name: '', chargeType: 1, firstUnit: 1, firstFee: 8, continueUnit: 1, continueFee: 2,
  freeFeeAmount: 99, regionIds: '0', deliveryTime: '48小时内发货', status: 1,
})
const rules = { name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }] }

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? {
        id: row.id, name: row.name, chargeType: row.charge_type, firstUnit: row.first_unit, firstFee: row.first_fee,
        continueUnit: row.continue_unit, continueFee: row.continue_fee, freeFeeAmount: row.free_fee_amount,
        regionIds: row.region_ids, deliveryTime: row.delivery_time, status: row.status,
      }
    : {
        id: null, name: '', chargeType: 1, firstUnit: 1, firstFee: 8, continueUnit: 1, continueFee: 2,
        freeFeeAmount: 99, regionIds: '0', deliveryTime: '48小时内发货', status: 1,
      })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = {
    name: form.name, chargeType: form.chargeType, firstUnit: form.firstUnit, firstFee: form.firstFee,
    continueUnit: form.continueUnit, continueFee: form.continueFee, freeFeeAmount: form.freeFeeAmount,
    regionIds: form.regionIds, deliveryTime: form.deliveryTime, status: form.status,
  }
  if (form.id) {
    await updateFreightTemplateAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createFreightTemplateAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该运费模板？', '提示', { type: 'warning' })
  await deleteFreightTemplateAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

const chargeTypeLabel = (t: number) => (t === 2 ? '按重量' : '按件数')
const regionLabel = (ids: string) => (ids === '0' || !ids ? '全国' : ids)

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">运费模板</span>
        <div class="header-actions">
          <el-input v-model="listQuery.name" placeholder="模板名称" clearable style="width: 200px" @keyup.enter="getList" />
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.name = ''; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">模板列表</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增模板</el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="模板名称" prop="name" min-width="150" align="center" />
        <el-table-column label="计费方式" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="primary" effect="plain">{{ chargeTypeLabel(scope.row.charge_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="首件/首重" width="110" align="center">
          <template #default="scope">{{ scope.row.first_unit }} / ￥{{ scope.row.first_fee }}</template>
        </el-table-column>
        <el-table-column label="续件/续重" width="110" align="center">
          <template #default="scope">{{ scope.row.continue_unit }} / ￥{{ scope.row.continue_fee }}</template>
        </el-table-column>
        <el-table-column label="包邮门槛" width="110" align="center">
          <template #default="scope">{{ scope.row.free_fee_amount > 0 ? '满￥' + scope.row.free_fee_amount : '不包邮' }}</template>
        </el-table-column>
        <el-table-column label="适用地区" width="100" align="center">
          <template #default="scope">{{ regionLabel(scope.row.region_ids) }}</template>
        </el-table-column>
        <el-table-column label="发货时效" prop="delivery_time" min-width="130" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="openDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑运费模板' : '新增运费模板'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="如 默认模板" />
        </el-form-item>
        <el-form-item label="计费方式">
          <el-radio-group v-model="form.chargeType">
            <el-radio :value="1">按件数</el-radio>
            <el-radio :value="2">按重量</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.chargeType === 2 ? '首重(kg)/费用' : '首件(件)/费用'">
          <el-input-number v-model="form.firstUnit" :min="0" :precision="2" style="width: 140px" />
          <span style="margin: 0 6px">/</span>
          <el-input-number v-model="form.firstFee" :min="0" :precision="2" style="width: 140px" />
        </el-form-item>
        <el-form-item :label="form.chargeType === 2 ? '续重(kg)/费用' : '续件(件)/费用'">
          <el-input-number v-model="form.continueUnit" :min="0" :precision="2" style="width: 140px" />
          <span style="margin: 0 6px">/</span>
          <el-input-number v-model="form.continueFee" :min="0" :precision="2" style="width: 140px" />
        </el-form-item>
        <el-form-item label="包邮门槛(元)">
          <el-input-number v-model="form.freeFeeAmount" :min="0" :precision="2" style="width: 200px" />
          <span class="tip">0 表示不包邮</span>
        </el-form-item>
        <el-form-item label="适用地区">
          <el-input v-model="form.regionIds" placeholder="地区ID逗号分隔，0=全国" />
        </el-form-item>
        <el-form-item label="发货时效">
          <el-input v-model="form.deliveryTime" placeholder="如 48小时内发货" />
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
.tip { color: #909399; font-size: 12px; margin-left: 8px; }
</style>
