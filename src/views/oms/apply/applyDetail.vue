<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAfterSaleDetailAPI,
  approveAfterSaleAPI,
  rejectAfterSaleAPI,
  receiveAfterSaleAPI,
  getCompanyAddressListAPI,
} from '@/apis/afterSale'
import { formatDateTime } from '@/utils/datetime'
import type {
  AfterSaleDetail,
  AfterSaleApproveParam,
  AfterSaleRejectParam,
  AfterSaleReceiveParam,
  AfterSaleStatus,
  AfterSaleType,
  RefundStatus,
  InspectionResult,
  OmsCompanyAddress,
} from '@/types/afterSale'
import {
  AfterSaleStatusText,
  AfterSaleTypeText,
  RefundStatusText,
  InspectionResultText,
} from '@/types/afterSale'

const route = useRoute()
const router = useRouter()

const id = ref<number>(0)
const detail = ref<AfterSaleDetail>({} as AfterSaleDetail)
const loading = ref(false)

// 审核表单
const approveForm = ref<AfterSaleApproveParam>({
  companyAddressId: undefined,
  refundAmount: undefined,
  handleMan: 'admin',
  handleNote: '',
})
const approveDialogVisible = ref(false)

// 拒绝表单
const rejectForm = ref<AfterSaleRejectParam>({
  handleMan: 'admin',
  reason: '',
})
const rejectDialogVisible = ref(false)

// 收货表单
const receiveForm = ref<AfterSaleReceiveParam>({
  inspectionResult: 1,
  restock: true,
  receiveMan: 'admin',
  receiveNote: '',
})
const receiveDialogVisible = ref(false)

// 公司地址列表
const companyAddressList = ref<OmsCompanyAddress[]>([])

// 获取详情
const getDetail = async () => {
  loading.value = true
  try {
    const res = await getAfterSaleDetailAPI(id.value)
    detail.value = res
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 获取公司地址列表
const getCompanyAddressList = async () => {
  try {
    const res = await getCompanyAddressListAPI()
    companyAddressList.value = res.data || []
  } catch (e) {
    console.error('加载公司地址失败', e)
  }
}

onMounted(() => {
  id.value = Number(route.query.id)
  if (id.value) {
    getDetail()
    getCompanyAddressList()
  }
})

// 计算属性
const statusText = computed(() => AfterSaleStatusText[detail.value.status as AfterSaleStatus] || '未知')
const typeText = computed(() => AfterSaleTypeText[detail.value.serviceType as AfterSaleType] || '未知')
const refundStatusText = computed(() => {
  if (!detail.value.refund) return '-'
  return RefundStatusText[detail.value.refund.status as RefundStatus] || '未知'
})
const inspectionResultText = computed(() => {
  if (!detail.value.inspectionResult) return '-'
  return InspectionResultText[detail.value.inspectionResult as InspectionResult] || '未知'
})

const allowedActions = computed(() => detail.value.allowedActions || [])
const canApprove = computed(() => allowedActions.value.includes('ADMIN_APPROVE'))
const canReject = computed(() => allowedActions.value.includes('ADMIN_REJECT'))
const canReceive = computed(() => allowedActions.value.includes('ADMIN_RECEIVE'))

const isReturnRefund = computed(() => detail.value.serviceType === 2)
const isRefundOnly = computed(() => detail.value.serviceType === 1)

// 打开审核对话框
const openApproveDialog = () => {
  approveForm.value = {
    companyAddressId: isReturnRefund.value ? companyAddressList.value[0]?.id : undefined,
    refundAmount: detail.value.applyAmount,
    handleMan: 'admin',
    handleNote: '',
  }
  approveDialogVisible.value = true
}

// 提交审核
const handleApprove = async () => {
  if (isReturnRefund.value && !approveForm.value.companyAddressId) {
    ElMessage.warning('请选择退货地址')
    return
  }
  if (!approveForm.value.refundAmount || approveForm.value.refundAmount <= 0) {
    ElMessage.warning('请输入退款金额')
    return
  }
  if (approveForm.value.refundAmount > detail.value.applyAmount) {
    ElMessage.warning('退款金额不能超过申请金额')
    return
  }
  try {
    await approveAfterSaleAPI(id.value, approveForm.value)
    ElMessage.success('审核通过')
    approveDialogVisible.value = false
    getDetail()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 打开拒绝对话框
const openRejectDialog = () => {
  rejectForm.value = { handleMan: 'admin', reason: '' }
  rejectDialogVisible.value = true
}

// 提交拒绝
const handleReject = async () => {
  if (!rejectForm.value.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await rejectAfterSaleAPI(id.value, rejectForm.value)
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    getDetail()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 打开收货对话框
const openReceiveDialog = () => {
  receiveForm.value = {
    inspectionResult: 1,
    restock: true,
    receiveMan: 'admin',
    receiveNote: '',
  }
  receiveDialogVisible.value = true
}

// 验货结果变化
const handleInspectionChange = (val: number) => {
  if (val !== 1) {
    receiveForm.value.restock = false
  }
}

// 提交收货
const handleReceive = async () => {
  if (receiveForm.value.inspectionResult !== 1 && receiveForm.value.restock) {
    ElMessage.warning('商品非完好状态不能恢复库存')
    return
  }
  try {
    await receiveAfterSaleAPI(id.value, receiveForm.value)
    ElMessage.success('确认收货成功')
    receiveDialogVisible.value = false
    getDetail()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// 查看订单详情
const handleViewOrder = () => {
  router.push({ path: '/oms/orderDetail', query: { id: detail.value.orderId } })
}

// 格式化地址
const formatAddress = (addr: any) => {
  if (!addr) return '-'
  return `${addr.province || ''}${addr.city || ''}${addr.region || ''}${addr.detailAddress || ''}`
}
</script>

<template>
  <div class="detail-container" v-loading="loading">
    <!-- 状态头部 -->
    <el-card shadow="never" class="status-card">
      <div class="status-header">
        <div>
          <span class="status-label">售后状态：</span>
          <el-tag :type="detail.status === 70 ? 'success' : detail.status >= 80 ? 'info' : 'warning'" size="large">
            {{ statusText }}
          </el-tag>
          <span v-if="detail.refund" class="refund-label">
            退款状态：
            <el-tag :type="detail.refund.status === 2 ? 'success' : detail.refund.status === 3 ? 'danger' : 'warning'" size="small">
              {{ refundStatusText }}
            </el-tag>
          </span>
        </div>
        <div class="action-btns">
          <el-button v-if="canApprove" type="primary" @click="openApproveDialog">审核通过</el-button>
          <el-button v-if="canReject" type="danger" @click="openRejectDialog">审核拒绝</el-button>
          <el-button v-if="canReceive" type="success" @click="openReceiveDialog">确认收货</el-button>
        </div>
      </div>
    </el-card>

    <!-- 商品信息 -->
    <el-card shadow="never" class="standard-margin">
      <span class="font-title-medium">商品信息</span>
      <el-table border class="standard-margin" :data="[detail]">
        <el-table-column label="商品图片" width="120" align="center">
          <template #default="scope">
            <img style="height:80px" :src="scope.row.productPic" />
          </template>
        </el-table-column>
        <el-table-column label="商品名称" align="center">
          <template #default="scope">
            <span class="font-small">{{ scope.row.productName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格属性" width="200" align="center">
          <template #default="scope">{{ scope.row.productAttr || '-' }}</template>
        </el-table-column>
        <el-table-column label="数量" width="80" align="center">
          <template #default="scope">{{ scope.row.productCount || '-' }}</template>
        </el-table-column>
        <el-table-column label="申请金额" width="120" align="center">
          <template #default="scope">
            <span class="color-danger">￥{{ scope.row.applyAmount }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 售后信息 -->
    <el-card shadow="never" class="standard-margin">
      <span class="font-title-medium">售后信息</span>
      <div class="form-container-border">
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">售后单号</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.afterSaleSn }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">售后类型</el-col>
          <el-col class="form-border font-small" :span="6">{{ typeText }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">订单编号</el-col>
          <el-col class="form-border font-small" :span="6">
            {{ detail.orderSn }}
            <el-button type="text" size="small" @click="handleViewOrder">查看</el-button>
          </el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">用户账号</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.memberUsername || '-' }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">申请时间</el-col>
          <el-col class="form-border font-small" :span="6">{{ formatDateTime(detail.createTime) }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">售后截止时间</el-col>
          <el-col class="form-border font-small" :span="6">{{ formatDateTime(detail.afterSaleDeadline) }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">售后原因</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.reason }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">确认退款金额</el-col>
          <el-col class="form-border font-small" :span="6">
            <span class="color-danger">￥{{ detail.returnAmount || detail.applyAmount }}</span>
          </el-col>
        </el-row>
        <el-row v-if="detail.description">
          <el-col :span="6" class="form-border form-left-bg font-small">问题描述</el-col>
          <el-col class="form-border font-small" :span="18">{{ detail.description }}</el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 凭证图片 -->
    <el-card v-if="detail.proofPics && detail.proofPics.length > 0" shadow="never" class="standard-margin">
      <span class="font-title-medium">凭证图片</span>
      <div class="proof-list">
        <el-image
          v-for="(pic, index) in detail.proofPics"
          :key="index"
          :src="pic"
          :preview-src-list="detail.proofPics"
          :initial-index="index"
          fit="cover"
          class="proof-img"
        />
      </div>
    </el-card>

    <!-- 退货地址 -->
    <el-card v-if="detail.returnAddress" shadow="never" class="standard-margin">
      <span class="font-title-medium">退货地址</span>
      <div class="address-card">
        <div class="address-row">
          <span class="address-name">{{ detail.returnAddress.name }}</span>
          <span class="address-phone">{{ detail.returnAddress.phone }}</span>
        </div>
        <div class="address-detail">{{ formatAddress(detail.returnAddress) }}</div>
        <div v-if="detail.returnShipDeadline" class="deadline-tip">
          请在 {{ formatDateTime(detail.returnShipDeadline) }} 前寄出
        </div>
      </div>
    </el-card>

    <!-- 买家退货物流 -->
    <el-card v-if="detail.buyerShipment" shadow="never" class="standard-margin">
      <span class="font-title-medium">买家退货物流</span>
      <div class="form-container-border">
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">快递公司</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.buyerShipment.deliveryCompany }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">快递单号</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.buyerShipment.deliverySn }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">寄出时间</el-col>
          <el-col class="form-border font-small" :span="18">{{ formatDateTime(detail.buyerShipment.deliveryTime) }}</el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 验货信息 -->
    <el-card v-if="detail.inspectionResult" shadow="never" class="standard-margin">
      <span class="font-title-medium">验货信息</span>
      <div class="form-container-border">
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">验货结果</el-col>
          <el-col class="form-border font-small" :span="6">{{ inspectionResultText }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">库存恢复</el-col>
          <el-col class="form-border font-small" :span="6">
            {{ detail.restockStatus === 1 ? '已恢复' : detail.restockStatus === 2 ? '不恢复' : '未处理' }}
          </el-col>
        </el-row>
        <el-row v-if="detail.receiveNote">
          <el-col :span="6" class="form-border form-left-bg font-small">收货备注</el-col>
          <el-col class="form-border font-small" :span="18">{{ detail.receiveNote }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">收货人</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.receiveMan || '-' }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">收货时间</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.receiveTime ? formatDateTime(detail.receiveTime) : '-' }}</el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 退款信息 -->
    <el-card v-if="detail.refund" shadow="never" class="standard-margin">
      <span class="font-title-medium">退款信息</span>
      <div class="form-container-border">
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">退款单号</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.refund.refundSn }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">退款金额</el-col>
          <el-col class="form-border font-small" :span="6">
            <span class="color-danger">￥{{ detail.refund.refundAmount }}</span>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">退款渠道</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.refund.channelCode }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">退款状态</el-col>
          <el-col class="form-border font-small" :span="6">{{ refundStatusText }}</el-col>
        </el-row>
        <el-row v-if="detail.refund.errorMsg">
          <el-col :span="6" class="form-border form-left-bg font-small">失败原因</el-col>
          <el-col class="form-border font-small color-danger" :span="18">{{ detail.refund.errorMsg }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="6" class="form-border form-left-bg font-small">创建时间</el-col>
          <el-col class="form-border font-small" :span="6">{{ formatDateTime(detail.refund.createTime) }}</el-col>
          <el-col :span="6" class="form-border form-left-bg font-small">完成时间</el-col>
          <el-col class="form-border font-small" :span="6">{{ detail.refund.finishTime ? formatDateTime(detail.refund.finishTime) : '-' }}</el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 售后时间线 -->
    <el-card v-if="detail.timeline && detail.timeline.length > 0" shadow="never" class="standard-margin">
      <span class="font-title-medium">售后进度</span>
      <el-timeline class="timeline">
        <el-timeline-item
          v-for="(item, index) in detail.timeline"
          :key="index"
          :timestamp="formatDateTime(item.createTime)"
          placement="top"
          :type="index === 0 ? 'primary' : ''"
        >
          <div class="timeline-content">
            <span class="timeline-action">{{ item.actionText || item.action }}</span>
            <span v-if="item.operatorName" class="timeline-operator">（{{ item.operatorName }}）</span>
            <div v-if="item.note" class="timeline-note">{{ item.note }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 审核通过对话框 -->
    <el-dialog v-model="approveDialogVisible" title="审核通过" width="500px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item v-if="isReturnRefund" label="退货地址" required>
          <el-select v-model="approveForm.companyAddressId" placeholder="请选择退货地址" style="width: 100%">
            <el-option
              v-for="addr in companyAddressList"
              :key="addr.id"
              :label="`${addr.name} - ${addr.addressName}`"
              :value="addr.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="退款金额" required>
          <el-input-number v-model="approveForm.refundAmount" :min="0.01" :max="detail.applyAmount" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="approveForm.handleMan" />
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
        <el-form-item label="处理人">
          <el-input v-model="rejectForm.handleMan" />
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
        <el-form-item label="收货人">
          <el-input v-model="receiveForm.receiveMan" />
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
  </div>
</template>

<style scoped>
.detail-container {
  padding: 20px;
}
.status-card {
  margin-bottom: 20px;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-label {
  font-size: 16px;
  font-weight: bold;
}
.refund-label {
  margin-left: 20px;
  font-size: 14px;
}
.action-btns {
  display: flex;
  gap: 10px;
}
.standard-margin {
  margin-top: 20px;
}
.font-title-medium {
  font-size: 16px;
  font-weight: bold;
}
.font-small {
  font-size: 14px;
}
.color-danger {
  color: #f56c6c;
}
.form-container-border {
  margin-top: 15px;
}
.form-border {
  border: 1px solid #ebeef5;
  padding: 10px;
  min-height: 40px;
  line-height: 20px;
}
.form-left-bg {
  background: #f5f7fa;
  font-weight: bold;
}
.proof-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}
.proof-img {
  width: 120px;
  height: 120px;
  border-radius: 4px;
}
.address-card {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}
.address-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}
.address-name {
  font-size: 16px;
  font-weight: bold;
}
.address-phone {
  font-size: 14px;
  color: #666;
}
.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
.deadline-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #f56c6c;
}
.timeline {
  margin-top: 20px;
}
.timeline-content {
  font-size: 14px;
}
.timeline-action {
  font-weight: bold;
}
.timeline-operator {
  color: #999;
  font-size: 12px;
}
.timeline-note {
  margin-top: 5px;
  color: #666;
  font-size: 13px;
}
</style>
