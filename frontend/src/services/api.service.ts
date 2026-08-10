import axios, { AxiosError, AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

class ApiService {
  client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('fiim_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor - handle errors & token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('fiim_refresh_token')
            if (!refreshToken) {
              throw new Error('No refresh token')
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data
            localStorage.setItem('fiim_access_token', accessToken)
            localStorage.setItem('fiim_refresh_token', newRefreshToken)

            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return this.client(originalRequest)
          } catch (refreshError) {
            // Clear tokens and redirect to login
            localStorage.removeItem('fiim_access_token')
            localStorage.removeItem('fiim_refresh_token')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  // Auth endpoints
  async login(email: string, password: string, mfaCode?: string) {
    const response = await this.client.post('/auth/login', { email, password, mfaCode })
    return response.data
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  async logout(refreshToken: string) {
    const response = await this.client.post('/auth/logout', { refreshToken })
    localStorage.removeItem('fiim_access_token')
    localStorage.removeItem('fiim_refresh_token')
    return response.data
  }

  async getMe() {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  // Athlete endpoints
  async getAthletes(orgId: string, params?: { status?: string; sportId?: string; search?: string }) {
    const response = await this.client.get('/athletes', {
      params: { orgId, ...params },
    })
    return response.data
  }

  async getAthlete(id: string, orgId: string) {
    const response = await this.client.get(`/athletes/${id}`, { params: { orgId } })
    return response.data
  }

  async createAthlete(data: any, orgId: string) {
    const response = await this.client.post('/athletes', data, { params: { orgId } })
    return response.data
  }

  async updateAthlete(id: string, data: any, orgId: string) {
    const response = await this.client.patch(`/athletes/${id}`, data, { params: { orgId } })
    return response.data
  }

  async deleteAthlete(id: string, orgId: string) {
    const response = await this.client.delete(`/athletes/${id}`, { params: { orgId } })
    return response.data
  }

  async getAthleteStats(orgId: string) {
    const response = await this.client.get('/athletes/stats', { params: { orgId } })
    return response.data
  }

  // Training Load endpoints
  async getTrainingSessions(
    orgId: string,
    params?: { dateFrom?: string; dateTo?: string; teamId?: string },
  ) {
    const response = await this.client.get('/training/sessions', {
      params: { orgId, ...params },
    })
    return response.data
  }

  async createTrainingSession(orgId: string, data: any) {
    const response = await this.client.post('/training/sessions', data, { params: { orgId } })
    return response.data
  }

  async addAthleteLoad(sessionId: string, orgId: string, data: any) {
    const response = await this.client.post(`/training/sessions/${sessionId}/athlete-load`, data, {
      params: { orgId },
    })
    return response.data
  }

  async getAthleteLoadHistory(athleteId: string, orgId: string, days = 30) {
    const response = await this.client.get(`/training/athlete-load/${athleteId}`, {
      params: { orgId, days },
    })
    return response.data
  }

  // Calculations: team ACWR + Monotony/Strain snapshot
  async getCalcTeamSummary(orgId: string, date?: string) {
    const response = await this.client.get('/calculations/team-summary', {
      params: { orgId, date },
    })
    return response.data
  }

  // Alerts endpoints
  async getAlerts(orgId: string, params?: { status?: string; severity?: string; athleteId?: string }) {
    const response = await this.client.get('/alerts', { params: { orgId, ...params } })
    return response.data
  }

  async getAlertStats(orgId: string) {
    const response = await this.client.get('/alerts/stats', { params: { orgId } })
    return response.data
  }

  async generateAlerts(orgId: string) {
    const response = await this.client.post('/alerts/generate', {}, { params: { orgId } })
    return response.data
  }

  async acknowledgeAlert(id: string, orgId: string) {
    const response = await this.client.patch(`/alerts/${id}/acknowledge`, {}, { params: { orgId } })
    return response.data
  }

  async resolveAlert(id: string, orgId: string, note?: string) {
    const response = await this.client.patch(`/alerts/${id}/resolve`, { note }, { params: { orgId } })
    return response.data
  }

  // Notifications
  async getNotifications(unread = false) {
    const response = await this.client.get('/notifications', { params: { unread } })
    return response.data
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count')
    return response.data
  }

  async markNotificationRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`, {})
    return response.data
  }

  async markAllNotificationsRead() {
    const response = await this.client.patch('/notifications/read-all', {})
    return response.data
  }

  async getNotificationPreferences(orgId: string) {
    const response = await this.client.get('/notifications/preferences', { params: { orgId } })
    return response.data
  }

  async updateNotificationPreferences(orgId: string, data: any) {
    const response = await this.client.post('/notifications/preferences', data, { params: { orgId } })
    return response.data
  }

  // Admin endpoints
  async getAdminOverview(orgId: string) {
    const response = await this.client.get('/admin/overview', { params: { orgId } })
    return response.data
  }

  async getOrganization(orgId: string) {
    const response = await this.client.get('/admin/organization', { params: { orgId } })
    return response.data
  }

  async updateOrganization(orgId: string, data: any) {
    const response = await this.client.patch('/admin/organization', data, { params: { orgId } })
    return response.data
  }

  // Import endpoints
  async previewWellnessImport(csv: string) {
    const response = await this.client.post('/import/wellness/preview', { csv })
    return response.data
  }

  async importWellness(orgId: string, csv: string) {
    const response = await this.client.post('/import/wellness', { csv }, { params: { orgId } })
    return response.data
  }

  // Audit endpoints
  async getAuditLogs(
    orgId: string,
    params?: { action?: string; entityType?: string; limit?: number; offset?: number },
  ) {
    const response = await this.client.get('/audit', { params: { orgId, ...params } })
    return response.data
  }

  async getAuditStats(orgId: string) {
    const response = await this.client.get('/audit/stats', { params: { orgId } })
    return response.data
  }

  // Reports endpoints
  async getTeamSummaryReport(orgId: string, params?: { dateFrom?: string; dateTo?: string }) {
    const response = await this.client.get('/reports/team-summary', { params: { orgId, ...params } })
    return response.data
  }

  async downloadAthletesCsv(orgId: string): Promise<Blob> {
    const response = await this.client.get('/reports/export/athletes.csv', {
      params: { orgId },
      responseType: 'blob',
    })
    return response.data
  }

  // Generated PDF/CSV reports
  async generateTeamSummaryReport(orgId: string, format: 'pdf' | 'csv' = 'pdf') {
    const response = await this.client.post(
      '/reports/generate/team-summary',
      {},
      { params: { orgId, format } },
    )
    return response.data
  }

  async getReportHistory(orgId: string) {
    const response = await this.client.get('/reports/history', { params: { orgId } })
    return response.data
  }

  async downloadReport(id: string, orgId: string): Promise<Blob> {
    const response = await this.client.get(`/reports/${id}/download`, {
      params: { orgId },
      responseType: 'blob',
    })
    return response.data
  }

  // Scheduled reports
  async getReportSchedules(orgId: string) {
    const response = await this.client.get('/reports/schedules', { params: { orgId } })
    return response.data
  }

  async createReportSchedule(orgId: string, data: any) {
    const response = await this.client.post('/reports/schedules', data, { params: { orgId } })
    return response.data
  }

  async updateReportSchedule(id: string, orgId: string, data: any) {
    const response = await this.client.patch(`/reports/schedules/${id}`, data, { params: { orgId } })
    return response.data
  }

  async deleteReportSchedule(id: string, orgId: string) {
    const response = await this.client.delete(`/reports/schedules/${id}`, { params: { orgId } })
    return response.data
  }

  // Injuries endpoints
  async getInjuries(orgId: string, params?: { status?: string; severity?: string; athleteId?: string }) {
    const response = await this.client.get('/injuries', { params: { orgId, ...params } })
    return response.data
  }

  async getInjuryStats(orgId: string) {
    const response = await this.client.get('/injuries/stats', { params: { orgId } })
    return response.data
  }

  async createInjury(orgId: string, data: any) {
    const response = await this.client.post('/injuries', data, { params: { orgId } })
    return response.data
  }

  async updateInjury(id: string, orgId: string, data: any) {
    const response = await this.client.patch(`/injuries/${id}`, data, { params: { orgId } })
    return response.data
  }

  async deleteInjury(id: string, orgId: string) {
    const response = await this.client.delete(`/injuries/${id}`, { params: { orgId } })
    return response.data
  }

  // Injury medical workflow: RTP, diagnoses, notes, clearance
  async getInjuryCase(id: string, orgId: string) {
    const response = await this.client.get(`/injuries/${id}/case`, { params: { orgId } })
    return response.data
  }

  async startRtp(id: string, orgId: string) {
    const response = await this.client.post(`/injuries/${id}/rtp/start`, {}, { params: { orgId } })
    return response.data
  }

  async advanceRtp(id: string, orgId: string, body: { notes?: string } = {}) {
    const response = await this.client.post(`/injuries/${id}/rtp/advance`, body, { params: { orgId } })
    return response.data
  }

  async updateRtpStage(id: string, orgId: string, body: { criteria?: any[]; notes?: string }) {
    const response = await this.client.patch(`/injuries/${id}/rtp/stage`, body, { params: { orgId } })
    return response.data
  }

  async addDiagnosis(id: string, orgId: string, body: { icd10Code?: string; description: string }) {
    const response = await this.client.post(`/injuries/${id}/diagnoses`, body, { params: { orgId } })
    return response.data
  }

  async addTreatmentNote(id: string, orgId: string, body: { note: string; medicalHold?: boolean }) {
    const response = await this.client.post(`/injuries/${id}/notes`, body, { params: { orgId } })
    return response.data
  }

  async addClearance(
    id: string,
    orgId: string,
    body: { status: string; expiresAt?: string; followUpDate?: string; notes?: string },
  ) {
    const response = await this.client.post(`/injuries/${id}/clearances`, body, { params: { orgId } })
    return response.data
  }

  // Algorithm configuration (Settings)
  async getAlgorithmConfig(orgId: string) {
    const response = await this.client.get('/calculations/config', { params: { orgId } })
    return response.data
  }

  async updateAlgorithmConfig(orgId: string, data: any) {
    const response = await this.client.post('/calculations/config', data, { params: { orgId } })
    return response.data
  }
}

export const apiService = new ApiService()
export default apiService
