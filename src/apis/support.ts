import http from '@/utils/http'

export type TicketStatus = 'OPEN' | 'PROCESSING' | 'WAIT_USER' | 'RESOLVED' | 'CLOSED'
export type TicketContextType = 'ORDER' | 'TRACE' | 'OPERATION' | 'AFTER_SALE' | 'REFUND' | 'AGENT_RUN' | 'CASE_RUN'

export interface TicketContext {
  refType: TicketContextType
  refValue: string
  source: string
  isPrimary: number
}

export interface SupportTicket {
  id: number
  ticketSn: string
  memberName?: string
  source: string
  synthetic: number
  category: string
  title: string
  description: string
  priority: string
  status: TicketStatus
  assigneeId?: number
  assigneeName?: string
  primaryAnchorType?: string
  primaryAnchorValue?: string
  createTime: number
  updateTime: number
  contexts?: TicketContext[]
  timeline?: Array<{
    eventType: string
    operatorType: string
    operatorName?: string
    content?: string
    createTime: number
  }>
}

export const getTicketListAPI = (params: Record<string, unknown>) =>
  http<{ list: SupportTicket[]; total: number }>({ url: '/support/admin/tickets', method: 'get', params })

export const getTicketsByContextAPI = (params: { refType: TicketContextType; refValue: string; pageNum: number; pageSize: number }) =>
  http<{ list: SupportTicket[]; total: number }>({ url: '/support/admin/tickets/correlation', method: 'get', params })

export const getTicketDetailAPI = (id: number) =>
  http<SupportTicket>({ url: `/support/admin/tickets/${id}`, method: 'get' })

export const assignTicketAPI = (id: number, data: { assigneeId?: number; assigneeName: string }) =>
  http<void>({ url: `/support/admin/tickets/${id}/assign`, method: 'post', data })

export const changeTicketStatusAPI = (id: number, data: { status: TicketStatus; note?: string }) =>
  http<void>({ url: `/support/admin/tickets/${id}/status`, method: 'post', data })

export const commentTicketAPI = (id: number, content: string) =>
  http<void>({ url: `/support/admin/tickets/${id}/comment`, method: 'post', data: { content } })

export const attachTicketContextAPI = (id: number, data: { refType: TicketContextType; refValue: string }) =>
  http<boolean>({ url: `/support/admin/tickets/${id}/context`, method: 'post', data })
