<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  approveAfterSaleAPI,
  rejectAfterSaleAPI,
  receiveAfterSaleAPI,
  shipExchangeAfterSaleAPI,
} from '@/apis/afterSale'
import type {
  AfterSaleDetail,
  AfterSaleApproveParam,
  AfterSaleRejectParam,
  AfterSaleReceiveParam,
  AfterSaleShipParam,
  OmsCompanyAddress,
} from '@/types/afterSale'

const props = defineProps<{
  detail: AfterSaleDetail
  companyAddressList: OmsCompanyAddress[]
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

// 审核对话框
const approveDialogVisible = ref(false)
const approveForm = ref<AfterSaleApproveParam>({
  companyAddressId: undefined,
  handleNote: '',
})

const openApproveDialog = () => {
  approveForm.value = {
    companyAddressId: props.detail.serviceType === 2 ? props.companyAddressList[0]?.id : undefined,
    handleNote: '',
  }
  approveDialogVisible.value = true
}

const handleApprove = async () => {
  if (props.detail.serviceType === 2 && !approveForm.value.companyAddressId) {
    ElMessage.warning('请选择退货地址')
    return
  }
  // Release A: 退款金额由系统计算（= applyAmount），客户端不输入
  try {
    await approveAfterSaleAPI(props.detail.id, approveForm.value)
    ElMessage.success('审核通过')
    approveDialogVisible.value = false
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectForm = ref<AfterSaleRejectParam>({
  reason: '',
  handleNote: '',
})

const openRejectDialog = () => {
  rejectForm.value = { reason: '', handleNote: '' }
  rejectDialogVisible.value = true
}

const handleReject = async () => {
  if (!rejectForm.value.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await rejectAfterSaleAPI(props.detail.id, rejectForm.value)
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 收货对话框
const receiveDialogVisible = ref(false)
const receiveForm = ref<AfterSaleReceiveParam>({
  inspectionResult: 1,
  restock: true,
  receiveNote: '',
})

const openReceiveDialog = () => {
  receiveForm.value = {
    inspectionResult: 1,
    restock: true,
    receiveNote: '',
  }
  receiveDialogVisible.value = true
}

const handleInspectionChange = (val: number) => {
  if (val !== 1) {
    receiveForm.value.restock = false
  }
}

const handleReceive = async () => {
  if (receiveForm.value.inspectionResult !== 1 && receiveForm.value.restock) {
    ElMessage.warning('商品非完好状态不能恢复库存')
    return
  }
  try {
    await receiveAfterSaleAPI(props.detail.id, receiveForm.value)
    ElMessage.success('确认收货成功')
    receiveDialogVisible.value = false
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 换货发出对话框
const shipExchangeDialogVisible = ref(false)
const shipExchangeForm = ref<AfterSaleShipParam>({
  deliveryCode: '',
  deliveryCompany: '',
  deliverySn: '',
  handleNote: '',
})

const openShipExchangeDialog = () => {
  shipExchangeForm.value = {
    deliveryCode: '',
    deliveryCompany: '',
    deliverySn: '',
    handleNote: '',
  }
  shipExchangeDialogVisible.value = true
}

const handleShipExchange = async () => {
  if (!shipExchangeForm.value.deliveryCompany.trim()) {
    ElMessage.warning('请输入快递公司名称')
    return
  }
  if (!shipExchangeForm.value.deliveryCode.trim()) {
    ElMessage.warning('请输入快递公司编码')
    return
  }
  if (!shipExchangeForm.value.deliverySn.trim()) {
    ElMessage.warning('请输入物流单号')
    return
  }
  try {
    await shipExchangeAfterSaleAPI(props.detail.id, shipExchangeForm.value)
    ElMessage.success('换货发出成功')
    shipExchangeDialogVisible.value = false
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 暴露方法给父组件
defineExpose({
  openApproveDialog,
  openRejectDialog,
  openReceiveDialog,
  openShipExchangeDialog,
})
</script>

<template>
  <!-- 审核通过对话框 -->
  <el-dialog v-model="approveDialogVisible" title="审核通过" width="500px">
    <el-form :model="approveForm" label-width="100px">
      <el-form-item v-if="detail.serviceType === 2" label="退货地址" required>
        <el-select v-model="approveForm.companyAddressId" placeholder="请选择退货地址" style="width: 100%">
          <el-option
            v-for="addr in companyAddressList"
            :key="addr.id"
            :label="`${addr.name} - ${addr.addressName}`"
            :value="addr.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退款金额">
        <!-- Release A: 退款金额由系统计算（= applyAmount），客户端只读显示，不可编辑 -->
        <span class="readonly-amount">¥{{ detail.applyAmount?.toFixed(2) || '0.00' }}</span>
        <span class="amount-tip">（系统计算，不可修改）</span>
      </el-form-item>
      <el-form-item label="处理备注">
        <el-input v-model="approveForm.handleNote" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="approveDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleApprove">确认</el-button>
    </template>
  </el-dialog>

  <!-- 审核拒绝对话框 -->
  <el-dialog v-model="rejectDialogVisible" title="审核拒绝" width="500px">
    <el-form :model="rejectForm" label-width="100px">
      <el-form-item label="拒绝原因" required>
        <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      </el-form-item>
      <el-form-item label="处理备注">
        <el-input v-model="rejectForm.handleNote" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="rejectDialogVisible = false">取消</el-button>
      <el-button type="danger" @click="handleReject">确认拒绝</el-button>
    </template>
  </el-dialog>

  <!-- 确认收货对话框 -->
  <el-dialog v-model="receiveDialogVisible" title="确认收货" width="500px">
    <el-form :model="receiveForm" label-width="100px">
      <el-form-item label="验货结果" required>
        <el-select v-model="receiveForm.inspectionResult" style="width: 100%" @change="handleInspectionChange">
          <el-option label="正常，可重新销售" :value="1" />
          <el-option label="商品有损，不恢复可售库存" :value="2" />
          <el-option label="退回商品不符" :value="3" />
          <el-option label="数量异常" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="恢复库存">
        <el-switch v-model="receiveForm.restock" :disabled="receiveForm.inspectionResult !== 1" />
        <span v-if="receiveForm.inspectionResult !== 1" style="color: #999; margin-left: 10px">商品非完好状态不能恢复库存</span>
      </el-form-item>
      <el-form-item label="收货备注">
        <el-input v-model="receiveForm.receiveNote" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="receiveDialogVisible = false">取消</el-button>
      <el-button type="success" @click="handleReceive">确认收货</el-button>
    </template>
  </el-dialog>

  <!-- 换货发出对话框 -->
  <el-dialog v-model="shipExchangeDialogVisible" title="确认换货发出" width="500px">
    <el-form :model="shipExchangeForm" label-width="100px">
      <el-form-item label="快递公司" required>
        <el-input v-model="shipExchangeForm.deliveryCompany" placeholder="请输入快递公司名称，如：顺丰速运" />
      </el-form-item>
      <el-form-item label="快递编码" required>
        <el-input v-model="shipExchangeForm.deliveryCode" placeholder="请输入快递公司编码，如：SF" />
      </el-form-item>
      <el-form-item label="物流单号" required>
        <el-input v-model="shipExchangeForm.deliverySn" placeholder="请输入物流单号" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="shipExchangeForm.handleNote" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="shipExchangeDialogVisible = false">取消</el-button>
      <el-button type="success" @click="handleShipExchange">确认发货</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.readonly-amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}
.amount-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
