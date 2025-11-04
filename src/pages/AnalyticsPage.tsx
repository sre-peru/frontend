/**
 * Analytics Page - Advanced Visualizations
 */
import React, { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/analytics.api';
import { useFiltersStore } from '@/store/filtersStore';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import BarChart from '@/components/charts/BarChart';
import TreemapChart from '@/components/charts/TreemapChart';
import FunnelChart from '@/components/charts/FunnelChart';
import GaugeChart from '@/components/charts/GaugeChart';
import PieChartWithPadAngle from '@/components/charts/PieChartWithPadAngle';
import Spinner from '@/components/ui/Spinner';

const AnalyticsPage: React.FC = () => {
  const { filters } = useFiltersStore();
  const [topEntities, setTopEntities] = useState<any>(null);
  const [managementZones, setManagementZones] = useState<any>(null);
  const [remediationFunnel, setRemediationFunnel] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState<any>(null);
  const [rootCauseDistribution, setRootCauseDistribution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [entitiesRes, zonesRes, funnelRes, kpisRes, rootCauseRes, rootDistRes] = await Promise.all([
          analyticsApi.getTopEntities(10, filters),
          analyticsApi.getManagementZones(filters),
          analyticsApi.getRemediationFunnel(filters),
          analyticsApi.getKPIs(filters),
          analyticsApi.getRootCauseAnalysis(filters),
          analyticsApi.getRootCauseDistribution(filters),
        ]);

        setTopEntities(entitiesRes);
        setManagementZones(zonesRes);
        setRemediationFunnel(funnelRes);
        setKpis(kpisRes);
        setRootCauseAnalysis(rootCauseRes);
        setRootCauseDistribution(rootDistRes);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  const closedPercentage = kpis ? (kpis.closedProblems / kpis.totalProblems) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into problem patterns and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Affected Entities */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Affected Entities</CardTitle>
          </CardHeader>
          <CardContent>
            {topEntities && <BarChart data={topEntities.entities} />}
          </CardContent>
        </Card>

        {/* Problem Status Gauge */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <GaugeChart value={Number(closedPercentage.toFixed(1))} title="Closed Problems" />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {kpis?.closedProblems} of {kpis?.totalProblems} problems resolved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Management Zones Treemap */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Problems by Management Zone</CardTitle>
          </CardHeader>
          <CardContent>
            {managementZones && <TreemapChart data={managementZones.zones} height="500px" />}
          </CardContent>
        </Card>

        {/* Remediation Funnel */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Remediation Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {remediationFunnel && <FunnelChart data={remediationFunnel.stages} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Root Cause Analysis Treemap */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Root Cause Entities</CardTitle>
          </CardHeader>
          <CardContent>
            {rootCauseAnalysis && <TreemapChart data={rootCauseAnalysis.data} height="500px" />}
          </CardContent>
        </Card>

        {/* Root Cause Distribution Pie */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Root Cause Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {rootCauseDistribution && <PieChartWithPadAngle data={rootCauseDistribution.data} height="500px" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
