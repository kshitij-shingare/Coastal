/**
 * API Client Service
 * Provides a fetch wrapper with authentication, error handling, and retry logic
 * Requirements: 11.1, 11.5
 */

import { ApiResponse, PaginatedResponse, ReportQueryParams, AlertQueryParams, LocationQueryParams, DashboardData, SystemStats, MapData } from '../shared/types/api';
import { Report, NewReportInput } from '../shared/types/report';
import { Alert } from '../shared/types/alert';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

// Token storage keys
const ACCESS_TOKEN_KEY = 'coastal_hazards_access_token';
const REFRESH_TOKEN_KEY = 'coastal_hazards_refresh_token';

// Error codes that should trigger retry
const RETRYABLE_STATUS_CODES = [503, 502, 504];

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Token management utilities
 */
export const tokenManager = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Build query string from params object
 */
function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Core fetch wrapper with authentication and retry logic
 */
async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Build headers with authentication
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject auth token if available
  const token = tokenManager.getAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && tokenManager.getRefreshToken()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        return fetchWithRetry<T>(endpoint, options, retryCount);
      }
      // Refresh failed, clear tokens
      tokenManager.clearTokens();
    }

    // Parse response
    const data = await response.json() as ApiResponse<T>;

    // Handle retryable errors
    if (RETRYABLE_STATUS_CODES.includes(response.status) && retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      await sleep(delay);
      return fetchWithRetry<T>(endpoint, options, retryCount + 1);
    }

    // Handle error responses
    if (!response.ok) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'An unknown error occurred',
        response.status,
        data.error?.details
      );
    }

    return data;
  } catch (error) {
    // Handle network errors with retry
    if (error instanceof TypeError && error.message.includes('fetch') && retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      await sleep(delay);
      return fetchWithRetry<T>(endpoint, options, retryCount + 1);
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      tokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// Reports API
// ============================================================================

export const reportsApi = {
  /**
   * Submit a new hazard report
   */
  async submit(report: NewReportInput): Promise<ApiResponse<Report>> {
    // Handle file uploads with FormData
    if (report.mediaFiles && report.mediaFiles.length > 0) {
      const formData = new FormData();
      formData.append('latitude', String(report.location.latitude));
      formData.append('longitude', String(report.location.longitude));
      if (report.location.accuracy) {
        formData.append('accuracy', String(report.location.accuracy));
      }
      if (report.location.address) {
        formData.append('address', report.location.address);
      }
      formData.append('originalText', report.content.originalText);
      if (report.content.language) {
        formData.append('language', report.content.language);
      }
      if (report.source) {
        formData.append('source', report.source);
      }
      report.mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      const token = tokenManager.getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/reports/submit`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return response.json();
    }

    // JSON request for reports without files
    return fetchWithRetry<Report>('/api/reports/submit', {
      method: 'POST',
      body: JSON.stringify({
        location: report.location,
        content: report.content,
        source: report.source || 'citizen',
      }),
    });
  },

  /**
   * Get paginated reports
   */
  async getAll(params: ReportQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Report>>> {
    const queryString = buildQueryString(params);
    return fetchWithRetry<PaginatedResponse<Report>>(`/api/v1/reports${queryString}`);
  },

  /**
   * Get a single report by ID
   */
  async getById(id: string): Promise<ApiResponse<Report>> {
    return fetchWithRetry<Report>(`/api/v1/reports/${id}`);
  },

  /**
   * Get reports by geographic location
   */
  async getByLocation(params: LocationQueryParams): Promise<ApiResponse<Report[]>> {
    const queryString = buildQueryString(params);
    return fetchWithRetry<Report[]>(`/api/v1/reports/location${queryString}`);
  },
};

// ============================================================================
// Alerts API
// ============================================================================

export const alertsApi = {
  /**
   * Get paginated alerts with filtering
   */
  async getAll(params: AlertQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Alert>>> {
    const queryString = buildQueryString(params);
    return fetchWithRetry<PaginatedResponse<Alert>>(`/api/v1/alerts${queryString}`);
  },

  /**
   * Get currently active alerts
   */
  async getActive(): Promise<ApiResponse<Alert[]>> {
    return fetchWithRetry<Alert[]>('/api/v1/alerts/active');
  },

  /**
   * Get a single alert by ID
   */
  async getById(id: string): Promise<ApiResponse<Alert>> {
    return fetchWithRetry<Alert>(`/api/v1/alerts/${id}`);
  },

  /**
   * Verify or dispute an alert
   */
  async verify(id: string, action: 'verify' | 'dispute', reason?: string): Promise<ApiResponse<Alert>> {
    return fetchWithRetry<Alert>(`/api/v1/alerts/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  },
};

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  /**
   * Get combined dashboard data
   */
  async getData(timeFilter?: '24h' | '7d' | '30d'): Promise<ApiResponse<DashboardData>> {
    const queryString = timeFilter ? `?timeFilter=${timeFilter}` : '';
    return fetchWithRetry<DashboardData>(`/api/v1/dashboard${queryString}`);
  },

  /**
   * Get system statistics
   */
  async getStats(timeFilter?: '24h' | '7d' | '30d'): Promise<ApiResponse<SystemStats>> {
    const queryString = timeFilter ? `?timeFilter=${timeFilter}` : '';
    return fetchWithRetry<SystemStats>(`/api/v1/dashboard/stats${queryString}`);
  },

  /**
   * Get map visualization data
   */
  async getMapData(): Promise<ApiResponse<MapData>> {
    return fetchWithRetry<MapData>('/api/v1/dashboard/map');
  },
};

// ============================================================================
// Authentication API
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await fetchWithRetry<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await fetchWithRetry<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Logout user
   */
  logout(): void {
    tokenManager.clearTokens();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  },

  /**
   * Get current access token
   */
  getToken(): string | null {
    return tokenManager.getAccessToken();
  },
};

// ============================================================================
// Health Check API
// ============================================================================

export const healthApi = {
  /**
   * Check API health status
   */
  async check(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return fetchWithRetry<{ status: string; timestamp: string }>('/api/health');
  },
};

// Default export with all API modules
const api = {
  reports: reportsApi,
  alerts: alertsApi,
  dashboard: dashboardApi,
  auth: authApi,
  health: healthApi,
  tokenManager,
};

export default api;
