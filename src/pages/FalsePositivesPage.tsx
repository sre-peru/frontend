/**
 * False Positives Dashboard Page
 * Main dashboard showing FP metrics, distributions, and recommendations
 */
import React, { useEffect, useState } from 'react';
import { falsePositivesApi, FPSummary, FPAnalysisFilters } from '@/lib/api/false-positives.api';
import { useFiltersStore } from '@/store/filtersStore';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PieChartWithPadAngle from '@/components/charts/PieChartWithPadAngle';
import FPBarChart from '@/components/charts/FPBarChart';
import Spinner from '@/components/ui/Spinner';
import { AlertTriangle, CheckCircle, HelpCircle, Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface DashboardData {
  summary: FPSummary;
  recommendations: string[];
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'purple';
}> = ({ title, value, subtitle, icon, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ClassificationBadge: React.FC<{ type: string; count: number }> = ({ type, count }) => {
  const config = {
    FALSE_POSITIVE: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <AlertTriangle size={16} /> },
    TRUE_POSITIVE: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle size={16} /> },
    UNCERTAIN: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <HelpCircle size={16} /> },
  }[type] || { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: null };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} ${config.text}`}>
      {config.icon}
      <span className="font-medium">{type.replace('_', ' ')}</span>
      <span className="font-bold">{count.toLocaleString()}</span>
    </div>
  );
};

const RecommendationCard: React.FC<{ recommendation: string; index: number }> = ({ recommendation, index }) => {
  const isWarning = recommendation.includes('⚠️') || recommendation.includes('CRÍTICO') || recommendation.includes('ALTO');
  const isInfo = recommendation.includes('ℹ️') || recommendation.includes('MODERADO');
  const isGood = recommendation.includes('✅') || recommendation.includes('BUENO');

  const bgColor = isWarning ? 'bg-red-500/10 border-red-500/30' 
    : isInfo ? 'bg-yellow-500/10 border-yellow-500/30' 
    : isGood ? 'bg-green-500/10 border-green-500/30'
    : 'bg-blue-500/10 border-blue-500/30';

  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
        <p className="text-sm">{recommendation}</p>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const FalsePositivesPage: React.FC = () => {
  const { filters } = useFiltersStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Convert store filters to FP API filters format
        const apiFilters: FPAnalysisFilters = {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          managementZones: filters.managementZones,
          severityLevels: filters.severityLevel,
        };
        
        const response = await falsePositivesApi.getSummary(apiFilters);
        setData(response);
      } catch (err) {
        console.error('Failed to fetch FP analysis:', err);
        setError('Error al cargar el análisis de falsos positivos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]); // Re-fetch when filters change

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-red-400">Error</h2>
        <p className="text-muted-foreground">{error || 'No se pudo cargar los datos'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { summary, recommendations } = data;

  // Prepare chart data
  const classificationPieData = [
    { name: 'Falsos Positivos', value: summary.falsePositives, color: '#ef4444' },
    { name: 'Verdaderos Positivos', value: summary.truePositives, color: '#22c55e' },
    { name: 'Inciertos', value: summary.uncertain, color: '#f59e0b' },
  ];

  const durationBarData = Object.entries(summary.byDuration || {}).map(([range, count]) => ({
    name: range,
    count: count as number,
  }));

  const severityBarData = Object.entries(summary.bySeverity || {}).map(([severity, count]) => ({
    name: severity.replace('_', ' '),
    count: count as number,
  }));

  const reasonBarData = Object.entries(summary.byReason || {}).map(([reason, count]) => ({
    name: reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    count: count as number,
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  const fpRatePercent = (summary.falsePositiveRate * 100).toFixed(1);
  const autoRemRate = (summary.autoRemediationRate * 100).toFixed(1);

  // Calculate alert health score (100 - FP rate)
  const healthScore = Math.round((1 - summary.falsePositiveRate) * 100);
  const healthColor = healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Análisis de Falsos Positivos</h1>
          <p className="text-muted-foreground mt-1">
            Período: {summary.dateRange?.from?.substring(0, 10) || 'N/A'} - {summary.dateRange?.to?.substring(0, 10) || 'N/A'}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${healthColor}-500/20 border border-${healthColor}-500/30`}>
          <Activity className={`text-${healthColor}-400`} size={20} />
          <span className="text-sm text-muted-foreground">Alert Health Score</span>
          <span className={`text-2xl font-bold text-${healthColor}-400`}>{healthScore}</span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Problemas"
          value={summary.totalProblems?.toLocaleString() || 0}
          subtitle="Analizados"
          icon={<Activity size={20} />}
          color="blue"
        />
        <MetricCard
          title="Falsos Positivos"
          value={summary.falsePositives?.toLocaleString() || 0}
          subtitle={`${fpRatePercent}% del total`}
          icon={<AlertTriangle size={20} />}
          color="red"
          trend={Number(fpRatePercent) > 30 ? 'up' : 'stable'}
        />
        <MetricCard
          title="Verdaderos Positivos"
          value={summary.truePositives?.toLocaleString() || 0}
          subtitle="Alertas válidas"
          icon={<CheckCircle size={20} />}
          color="green"
        />
        <MetricCard
          title="Auto-Remediación"
          value={`${autoRemRate}%`}
          subtitle="Problemas auto-resueltos"
          icon={<Zap size={20} />}
          color="purple"
        />
      </div>

      {/* Classification Badges */}
      <div className="flex flex-wrap gap-4">
        <ClassificationBadge type="FALSE_POSITIVE" count={summary.falsePositives || 0} />
        <ClassificationBadge type="TRUE_POSITIVE" count={summary.truePositives || 0} />
        <ClassificationBadge type="UNCERTAIN" count={summary.uncertain || 0} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification Pie Chart */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Distribución de Clasificación</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartWithPadAngle data={classificationPieData} height="300px" />
          </CardContent>
        </Card>

        {/* Duration Distribution */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Distribución por Duración</CardTitle>
          </CardHeader>
          <CardContent>
            <FPBarChart data={durationBarData} />
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Distribución por Severidad</CardTitle>
          </CardHeader>
          <CardContent>
            <FPBarChart data={severityBarData} />
          </CardContent>
        </Card>

        {/* FP Reasons */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Razones de Falsos Positivos</CardTitle>
          </CardHeader>
          <CardContent>
            <FPBarChart data={reasonBarData} />
          </CardContent>
        </Card>
      </div>

      {/* Top Recurring Entities */}
      {summary.topRecurringEntities && summary.topRecurringEntities.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Top Entidades Recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4">Entidad</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-center py-3 px-4">Problemas</th>
                    <th className="text-center py-3 px-4">FP Rate</th>
                    <th className="text-left py-3 px-4">Recomendación</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topRecurringEntities.slice(0, 5).map((entity, idx) => (
                    <tr key={entity.entityId || idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium truncate max-w-[200px]" title={entity.entityName}>
                        {entity.entityName?.substring(0, 40)}...
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {entity.entityType?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {entity.totalProblems}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded ${
                          entity.falsePositiveRate > 0.5 ? 'bg-red-500/20 text-red-400' :
                          entity.falsePositiveRate > 0.3 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {(entity.falsePositiveRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[200px]" title={entity.recommendation}>
                        {entity.recommendation || 'Sin recomendación'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} index={idx} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Trend */}
      {summary.dailyTrend && summary.dailyTrend.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Tendencia Diaria de FP Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <FPBarChart 
              data={summary.dailyTrend.slice(-14).map(d => ({
                name: d.date.substring(5),
                count: Math.round(d.fpRate * 100),
              }))} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FalsePositivesPage;
