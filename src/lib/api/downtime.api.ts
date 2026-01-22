/**
 * Downtime API Client
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface SeverityStats {
  count: number;
  hours: number;
}

export interface MonthlySummary {
  month: string;
  problems: number;
  hours: number;
  downtimePercent: number;
  bySeverity: Record<string, SeverityStats>;
}

export interface TopProblem {
  title: string;
  severity: string;
  durationHours: number;
  startTime: string;
  affectedService: string;
}

export interface DowntimeStats {
  totalProblems: number;
  totalHours: number;
  downtimePercent: number;
  monthlySummary: MonthlySummary[];
  severityDistribution: Record<string, SeverityStats>;
  topProblems: TopProblem[];
}

export const downtimeApi = {
  /**
   * Get downtime statistics for a date range
   */
  async getDowntimeStats(startDate: string, endDate: string): Promise<DowntimeStats> {
    const response = await axios.get<DowntimeStats>(`${API_BASE_URL}/analytics/downtime`, {
      params: { startDate, endDate },
      withCredentials: true
    });
    return response.data;
  }
};
