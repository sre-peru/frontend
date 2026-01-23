import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { downtimeApi, DowntimeStats, MonthlySummary } from '../../lib/api/downtime.api';
import { format } from 'date-fns';

const MONTH_NAMES: Record<string, string> = {
  '09': 'Septiembre',
  '10': 'Octubre',
  '11': 'Noviembre',
  '12': 'Diciembre'
};

const SEVERITY_COLORS: Record<string, string> = {
  'AVAILABILITY': '#d63031',
  'ERROR': '#e17055',
  'PERFORMANCE': '#fdcb6e',
  'RESOURCE_CONTENTION': '#74b9ff',
  'CUSTOM_ALERT': '#a29bfe'
};

export const DowntimeDashboard: React.FC = () => {
  const [data, setData] = useState<DowntimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching downtime data from DB...');
        
        const stats = await downtimeApi.getDowntimeStats('2025-09-01', '2025-12-31');
        console.log('📊 Real DB data received:', stats);
        
        setData(stats);
        
      } catch (err) {
        console.error('❌ Error loading downtime data:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No hay datos disponibles</div>
      </div>
    );
  }

  // Donut Chart Options - Monthly Distribution
  const donutChartOptions = {
    title: {
      text: 'Distribución por Indisponibilidad',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {

        return `${params.name}: ${params.value.toLocaleString()} horas`;
      }
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: {
        color: '#fff'
      }
    },
    series: [
      {
        name: 'Indisponibilidad',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#1a1a2e',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: {
          show: false
        },
        data: data.monthlySummary.map((month: MonthlySummary, index: number) => {
          const monthNum = month.month.split('-')[1];
          const monthNames: Record<string, string> = {
            '07': 'Julio',
            '08': 'Agosto',
            '09': 'Septiembre',
            '10': 'Octubre',
            '11': 'Noviembre',
            '12': 'Diciembre'
          };
          const colors = ['#0984e3', '#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#d63031'];
          
          return {
            name: monthNames[monthNum] || month.month,
            value: month.hours,
            itemStyle: { color: colors[index % colors.length] }
          };
        })
      }
    ]
  };

  // Calculate trend
  const getTrend = () => {
    if (data.monthlySummary.length < 2) return 'Estable';
    const lastMonth = data.monthlySummary[data.monthlySummary.length - 1];
    const prevMonth = data.monthlySummary[data.monthlySummary.length - 2];
    const change = lastMonth.downtimePercent - prevMonth.downtimePercent;
    
    if (change < -0.01) return 'Mejorando 📉';
    if (change > 0.01) return 'Empeorando 📈';
    return 'Estable';
  };

  return (
    <div className="p-6 space-y-6 bg-[#0f0f23] min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          📊 Dashboard de Indisponibilidad Real
        </h1>
        <p className="text-gray-400">
          Septiembre - Diciembre 2025
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Problemas Reales</div>
          <div className="text-3xl font-bold text-blue-400">{data.totalProblems}</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Horas Downtime</div>
          <div className="text-3xl font-bold text-blue-400">{data.totalHours.toFixed(2)} h</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Downtime Global</div>
          <div className="text-3xl font-bold text-blue-400">{data.downtimePercent.toFixed(3)}%</div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Tendencia</div>
          <div className="text-2xl font-bold text-blue-400">{getTrend()}</div>
        </div>
      </div>

      {/* Donut Chart and Monthly Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-700">
          <ReactECharts option={donutChartOptions} style={{ height: '400px' }} />
        </div>

        {/* Monthly Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Resumen Mensual</h2>
          {data.monthlySummary.map((month: MonthlySummary) => {
            const monthNum = month.month.split('-')[1];
            const monthName = MONTH_NAMES[monthNum] || month.month;
            
            return (
              <div key={month.month} className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">{monthName}</h3>
                  <span className="text-sm text-gray-400">
                    {month.problems} problemas | {month.hours.toFixed(2)} h | {month.downtimePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(month.bySeverity).map(([severity, stats]) => (
                    <div key={severity} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: SEVERITY_COLORS[severity] || '#95a5a6' }}
                      />
                      <span className="text-gray-300">
                        {severity}: {stats.hours.toFixed(1)}h ({stats.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 10 Problems Table */}
      <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Top 10 Problemas Más Largos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">#</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Problema</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Servicio</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Severidad</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Fecha</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Horas</th>
              </tr>
            </thead>
            <tbody>
              {data.topProblems.map((problem, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-[#252542]">
                  <td className="py-3 px-4 text-gray-300">{index + 1}</td>
                  <td className="py-3 px-4 text-blue-400 font-mono text-xs">{problem.displayId}</td>
                  <td className="py-3 px-4 text-white max-w-md truncate">{problem.title}</td>
                  <td className="py-3 px-4 text-gray-300">{problem.affectedService}</td>
                  <td className="py-3 px-4">
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        backgroundColor: `${SEVERITY_COLORS[problem.severity]}20`,
                        color: SEVERITY_COLORS[problem.severity] || '#95a5a6'
                      }}
                    >
                      {problem.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {format(new Date(problem.startTime), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-400">
                    {problem.durationHours.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
