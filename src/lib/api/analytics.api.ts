/**
 * Analytics API
 */
import apiClient from './client';
import { DashboardKPIs, ProblemFilters } from '@/types/problem.types';
import { ApiResponse } from '@/types/api.types';

export const analyticsApi = {
  /**
   * Get dashboard KPIs
   */
  getKPIs: async (filters?: ProblemFilters): Promise<DashboardKPIs> => {
    const response = await apiClient.get<ApiResponse<DashboardKPIs>>('/analytics/kpis', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get time series data
   */
  getTimeSeries: async (granularity: 'day' | 'week' | 'month' = 'day', filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/time-series', {
      params: { granularity, ...filters },
    });
    return response.data;
  },

  /**
   * Get impact vs severity matrix
   */
  getImpactSeverityMatrix: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/impact-severity-matrix', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get top entities
   */
  getTopEntities: async (limit: number = 10, filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/top-entities', {
      params: { limit, ...filters },
    });
    return response.data;
  },

  /**
   * Get management zones
   */
  getManagementZones: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/management-zones', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get remediation funnel
   */
  getRemediationFunnel: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/remediation-funnel', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get duration distribution
   */
  getDurationDistribution: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/duration-distribution', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get evidence types
   */
  getEvidenceTypes: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/evidence-types', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get root cause analysis (treemap)
   */
  getRootCauseAnalysis: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/root-cause-analysis', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get root cause distribution (pie chart)
   */
  getRootCauseDistribution: async (filters?: ProblemFilters) => {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/root-cause-distribution', {
      params: filters,
    });
    return response.data;
  },
};
