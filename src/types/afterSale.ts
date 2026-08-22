/** 后台售后类型：1->仅退款；2->退货退款；3->换货 */
export type AfterSaleType = 1 | 2 | 3

/** 售后范围：1->整单；2->订单明细 */
export type AfterSaleScope = 1 | 2

/**
 * 售后状态
 * 0->等待商家处理(APPLIED)
 * 10->等待买家寄回(WAIT_BUYER_SHIP)
 * 20->买家已寄回(BUYER_SHIPPED)
 * 30->商家已收到(RECEIVED)
 * 40->退款处理中(REFUNDING)
 * 50->等待商家发换货(WAIT_SELLER_SHIP)
 * 60->换货商品已发出(SELLER_SHIPPED)
 * 70->售后完成(COMPLETED)
 * 80->已拒绝(REJECTED)
 * 90->用户已撤销(CANCELLED)
 * 91->已超时关闭(EXPIRED)
 */
export type AfterSaleStatus = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 91

/** 售后状态文本映射 */
export const AfterSaleStatusText: Record<AfterSaleStatus, string> = {
  0: '等待商家处理',
  10: '等待买家寄回',
  20: '买家已寄回',
  30: '商家已收到',
  40: '退款处理中',
  50: '等待商家发换货',
  60: '换货商品已发出',
  70: '售后完成',
  80: '已拒绝',
  90: '用户已撤销',
  91: '已超时关闭',
}

/** 售后类型文本映射 */
export const AfterSaleTypeText: Record<AfterSaleType, string> = {
  1: '仅退款',
  2: '退货退款',
  3: '换货',
}

/** 退款状态：0->待退款；1->退款中；2->已退款；3->退款失败 */
export type RefundStatus = 0 | 1 | 2 | 3

/** 退款状态文本映射 */
export const RefundStatusText: Record<RefundStatus, string> = {
  0: '待退款',
  1: '退款中',
  2: '退款成功',
  3: '退款失败',
}

/** 验货结果：1->正常可售；2->商品有损；3->商品不符；4->数量异常 */
export type InspectionResult = 1 | 2 | 3 | 4

/** 验货结果文本映射 */
export const InspectionResultText: Record<InspectionResult, string> = {
  1: '正常，可重新销售',
  2: '商品有损，不恢复可售库存',
  3: '退回商品不符',
  4: '数量异常',
}

/** 售后列表查询参数 */
export interface AfterSaleQueryParam {
  pageNum: number
  pageSize: number
  status?: number
  type?: number
  orderSn?: string
  afterSaleSn?: string
}

/** 售后列表项 */
export interface AfterSaleSummary {
  id: number
  afterSaleSn: string
  orderSn: string
  serviceType: AfterSaleType
  status: AfterSaleStatus
  productName: string
  productPic: string
  productCount: number
  applyAmount: number
  createTime: string
  memberUsername?: string
}

/** 售后时间线项 */
export interface AfterSaleTimelineItem {
  action: string
  actionText?: string
  operatorType: number
  operatorName?: string
  note?: string
  createTime: string
}

/** 退货地址信息 */
export interface ReturnAddressInfo {
  id: number
  name: string
  phone: string
  province: string
  city: string
  region: string
  detailAddress: string
}

/** 买家退货物流信息 */
export interface BuyerShipmentInfo {
  deliveryCompany: string
  deliveryCode: string
  deliverySn: string
  deliveryTime: string
}

/** 退款信息 */
export interface RefundInfo {
  id: number
  refundSn: string
  refundAmount: number
  channelCode: string
  channelRefundNo?: string
  status: RefundStatus
  errorMsg?: string
  createTime: string
  finishTime?: string
}

/** 售后详情 */
export interface AfterSaleDetail {
  id: number
  afterSaleSn: string
  orderId: number
  orderSn: string
  memberId: number
  memberUsername?: string
  orderItemId?: number
  productId: number
  productSkuId?: number
  serviceType: AfterSaleType
  scopeType: AfterSaleScope
  status: AfterSaleStatus
  productCount?: number
  productName: string
  productPic: string
  productAttr?: string
  applyAmount: number
  returnAmount?: number
  reasonId: number
  reason: string
  description?: string
  proofPics: string[]
  returnName: string
  returnPhone: string
  afterSaleDeadline: string
  returnShipDeadline?: string
  returnAddress?: ReturnAddressInfo
  buyerShipment?: BuyerShipmentInfo
  refund?: RefundInfo
  inspectionResult?: InspectionResult
  restockStatus?: number
  handleMan?: string
  handleNote?: string
  handleTime?: string
  receiveMan?: string
  receiveNote?: string
  receiveTime?: string
  rejectReason?: string
  cancelTime?: string
  finishTime?: string
  createTime: string
  updateTime: string
  timeline: AfterSaleTimelineItem[]
  allowedActions: string[]
}

/**
 * 审核通过参数（Release A: Command 化）
 * 客户端不传 handleMan/returnAmount，操作人和金额由后端决定
 */
export interface AfterSaleApproveParam {
  companyAddressId?: number
  handleNote?: string
}

/** 审核拒绝参数 */
export interface AfterSaleRejectParam {
  reason: string
  handleNote?: string
}

/** 确认收货参数 */
export interface AfterSaleReceiveParam {
  inspectionResult: InspectionResult
  restock: boolean
  receiveNote?: string
}

/** 商家发货参数（换货发出） */
export interface AfterSaleShipParam {
  deliveryCode: string
  deliveryCompany: string
  deliverySn: string
  handleNote?: string
}

/** 售后原因 */
export interface OmsOrderReturnReason {
  id: number
  name: string
  code?: string
  needProof?: number
  sort: number
  status: number
}

/** 快递公司 */
export interface OmsExpressCompany {
  id: number
  name: string
  code: string
  sort: number
}

/** 公司地址 */
export interface OmsCompanyAddress {
  id: number
  addressName: string
  name: string
  phone: string
  province: string
  city: string
  region: string
  detailAddress: string
}
