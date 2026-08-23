import http from '@/utils/http'

export interface CaseFamily {
  familyId: string
  name: string
  groupCode: string
  groupName: string
  faultType: string
  hookIds: string[]
  action?: string
  scopeKeys: string[]
  scopeKey?: string
  oracle: string
  executionStatus: 'EXECUTABLE' | 'PLANNED'
  executionNote: string
}

export interface CaseLabStatus {
  enabled: boolean
  environment: string
  killSwitchOn: boolean
  sessionDirectoryConfigured: boolean
  sessionDirectoryReady: boolean
  ready: boolean
  message: string
}

export interface CaseLabSession {
  sessionId: string
  familyId: string
  hookId: string
  action: string
  sessionTraceId?: string
  status: string
  createdAt?: string
  expiresAt?: string
  maxAffectedRequests: number
  firedCount: number
  scope: Record<string, string>
}

export interface CaseLabTriggerEvent {
  sessionId: string
  familyId: string
  hookId: string
  action: string
  event: string
  firedAt: string
  businessTraceId?: string
  orderId?: string
  scope: Record<string, string>
}

export const getCaseFamiliesAPI = () =>
  http<CaseFamily[]>({ url: '/caseLab/read/families', method: 'get' })
export const getCaseStatusAPI = () =>
  http<CaseLabStatus>({ url: '/caseLab/read/status', method: 'get' })
export const getCaseSessionsAPI = () =>
  http<CaseLabSession[]>({ url: '/caseLab/read/sessions', method: 'get' })
export const getCaseEventsAPI = (id: string) =>
  http<string[]>({ url: `/caseLab/read/sessions/${id}/events`, method: 'get' })
export const createCaseSessionAPI = (data: {
  familyId: string; ttlSeconds: number; maxAffectedRequests: number; scope: Record<string, string>
}) => http<string>({ url: '/caseLab/manage/sessions', method: 'post', data })
export const stopCaseSessionAPI = (id: string) =>
  http<boolean>({ url: `/caseLab/manage/sessions/${id}/stop`, method: 'post' })
export const createCaseTicketAPI = (id: string) =>
  http<number>({ url: `/caseLab/manage/sessions/${id}/ticket`, method: 'post' })
