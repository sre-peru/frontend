/**
 * Problems Analyzer - Hierarchical Sunburst Visualization
 * Shows infrastructure problems in a radial tree format with drill-down
 * Connected to MongoDB for real-time data
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Zap, Server, Database, Wifi, Eye, ChevronLeft, Settings, Loader2, AlertCircle } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { analyticsApi } from '@/lib/api/analytics.api';
import { useFiltersStore } from '@/store/filtersStore';

// ============================================================================
// TYPES
// ============================================================================

interface ProblemNode {
  id?: string;
  name: string;
  value: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  subcategory?: string;
  description?: string;
  mttr?: number;
  affectedServices?: string[];
  rootCause?: string;
  solution?: string;
  children?: ProblemNode[];
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
}

interface SelectedNode {
  name: string;
  value: number;
  severity?: string;
  description?: string;
  mttr?: number;
  affectedServices?: string[];
  rootCause?: string;
  solution?: string;
  category?: string;
}

interface HierarchyStats {
  total: number;
  totalOccurrences: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgMttr: number;
}

// ============================================================================
// COLORS AND CONFIGURATION
// ============================================================================

const severityColors: Record<string, string> = {
  CRITICAL: '#C41E3A',
  HIGH: '#E63946',
  MEDIUM: '#F77F00',
  LOW: '#FCBF49'
};

// ============================================================================
// COMPONENT
// ============================================================================

const ProblemsAnalyzer: React.FC = () => {
  const chartRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string[]>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
  const [chartKey, setChartKey] = useState(0); // For forcing chart re-render
  
  // Global filters from store
  const globalFilters = useFiltersStore((state) => state.filters);
  
  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hierarchyData, setHierarchyData] = useState<ProblemNode | null>(null);
  const [stats, setStats] = useState<HierarchyStats>({
    total: 0,
    totalOccurrences: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    avgMttr: 0
  });

  // Fetch data from MongoDB with global filters
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getProblemsHierarchy(globalFilters);
      if (response.hierarchy) {
        setHierarchyData(response.hierarchy);
      }
      if (response.stats) {
        setStats(response.stats);
      }
      setChartKey(prev => prev + 1); // Force chart re-render on new data
    } catch (err: any) {
      console.error('Error fetching problems hierarchy:', err);
      setError(err.message || 'Error al cargar los datos de problemas');
    } finally {
      setLoading(false);
    }
  }, [globalFilters]);

  // Re-fetch when global filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Filter data by severity
  const filteredData = useMemo(() => {
    if (!hierarchyData?.children) return [];
    
    return hierarchyData.children.filter(category => {
      // Map category names to severity
      const severityMap: Record<string, string> = {
        'Critical Issues': 'CRITICAL',
        'High Priority': 'HIGH',
        'Medium Priority': 'MEDIUM',
        'Low Priority': 'LOW'
      };
      const severity = severityMap[category.name] || 'LOW';
      return severityFilter.includes(severity);
    });
  }, [hierarchyData, severityFilter]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    let total = 0, critical = 0, high = 0, medium = 0, low = 0;
    let totalOccurrences = 0;
    
    filteredData.forEach(category => {
      totalOccurrences += category.value;
      if (category.children) {
        total += category.children.length;
        category.children.forEach(child => {
          switch (child.severity) {
            case 'CRITICAL': critical++; break;
            case 'HIGH': high++; break;
            case 'MEDIUM': medium++; break;
            case 'LOW': low++; break;
          }
        });
      }
    });
    
    return {
      total,
      totalOccurrences,
      critical,
      high,
      medium,
      low,
      avgMttr: stats.avgMttr
    };
  }, [filteredData, stats]);

  // Function to reset chart - force re-render
  const resetChart = useCallback(() => {
    setChartKey(prev => prev + 1);
    setSelectedNode(null);
  }, []);

  // ECharts configuration
  const chartOptions = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data;
        let content = `<div style="padding: 8px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${data.name}</div>
          <div style="color: #999;">Ocurrencias: <span style="color: #fff; font-weight: bold;">${data.value}</span></div>`;
        
        if (data.severity) {
          const severityColor = severityColors[data.severity as string];
          content += `<div style="margin-top: 4px;">Severidad: <span style="color: ${severityColor}; font-weight: bold;">${data.severity}</span></div>`;
        }
        if (data.mttr) {
          content += `<div style="margin-top: 4px;">MTTR: <span style="color: #10b981; font-weight: bold;">${data.mttr} min</span></div>`;
        }
        content += '</div>';
        return content;
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'sunburst',
        data: filteredData,
        radius: [0, '95%'],
        center: ['50%', '50%'],
        sort: undefined,
        emphasis: {
          focus: 'ancestor',
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        levels: [
          {},
          {
            r0: '15%',
            r: '45%',
            itemStyle: { borderWidth: 3, borderColor: 'rgba(15, 23, 42, 0.8)' },
            label: {
              rotate: 'tangential',
              fontSize: 12,
              fontWeight: 'bold',
              color: '#fff'
            }
          },
          {
            r0: '45%',
            r: '80%',
            itemStyle: { borderWidth: 2, borderColor: 'rgba(15, 23, 42, 0.6)' },
            label: {
              position: 'outside',
              padding: 3,
              silent: false,
              fontSize: 9,
              color: '#94a3b8'
            }
          }
        ]
      }
    ]
  }), [filteredData]);

  const handleChartClick = useCallback((params: any) => {
    if (params.data) {
      setSelectedNode({
        name: params.data.name,
        value: params.data.value,
        severity: params.data.severity,
        description: params.data.description,
        mttr: params.data.mttr,
        affectedServices: params.data.affectedServices,
        rootCause: params.data.rootCause,
        solution: params.data.solution,
        category: params.data.category
      });
    }
  }, []);

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      LOW: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[severity] || 'bg-gray-500/20 text-gray-400';
  };

  const getCategoryIcon = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': return <Server className="text-red-400" size={18} />;
      case 'HIGH': return <Wifi className="text-orange-400" size={18} />;
      case 'MEDIUM': return <Zap className="text-yellow-400" size={18} />;
      case 'LOW': return <Database className="text-green-400" size={18} />;
      default: return <Eye className="text-gray-400" size={18} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card variant="glass" className="border-2 border-purple-500/30">
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 size={48} className="animate-spin text-cyan-400 mb-4" />
            <p className="text-lg font-medium text-white">Cargando análisis de problemas...</p>
            <p className="text-sm text-muted-foreground mt-1">Conectando con MongoDB</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="glass" className="border-2 border-red-500/30">
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-lg font-medium text-white">Error al cargar datos</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="border-2 border-purple-500/30">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Problems Analyzer - Rueda Jerárquica
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-normal bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full">
              {filteredStats.totalOccurrences.toLocaleString()} ocurrencias
            </span>
            <span className="text-sm font-normal bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
              {filteredStats.total} / {stats.total} tipos de problemas
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Severity Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground mr-2">Filtrar por severidad:</span>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
            <button
              key={severity}
              onClick={() => {
                if (severityFilter.includes(severity)) {
                  setSeverityFilter(severityFilter.filter(s => s !== severity));
                } else {
                  setSeverityFilter([...severityFilter, severity]);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                severityFilter.includes(severity) 
                  ? getSeverityBadge(severity) + ' border'
                  : 'bg-white/5 text-gray-500 line-through'
              }`}
            >
              {severity} ({severity === 'CRITICAL' ? stats.critical : 
                severity === 'HIGH' ? stats.high : 
                severity === 'MEDIUM' ? stats.medium : stats.low})
            </button>
          ))}
          {severityFilter.length < 4 && (
            <button
              onClick={() => setSeverityFilter(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Mostrar todos
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sunburst Chart */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 rounded-xl p-4" style={{ height: '500px' }}>
              {filteredData.length > 0 ? (
                <ReactECharts 
                  key={chartKey}
                  ref={chartRef}
                  option={chartOptions} 
                  style={{ height: '100%', width: '100%' }}
                  onEvents={{
                    click: handleChartClick
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Eye size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin datos para mostrar</p>
                  <p className="text-sm mt-1">Selecciona al menos un nivel de severidad</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 rounded-xl p-4 h-[500px] overflow-y-auto">
              {selectedNode ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(selectedNode.severity)}
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{selectedNode.name}</h3>
                      {selectedNode.severity && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(selectedNode.severity)}`}>
                          {selectedNode.severity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Ocurrencias</p>
                      <p className="text-xl font-bold text-cyan-400">{selectedNode.value}</p>
                    </div>
                    {selectedNode.mttr && selectedNode.mttr > 0 && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">MTTR</p>
                        <p className="text-xl font-bold text-green-400">{selectedNode.mttr} min</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedNode.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Descripción</h4>
                      <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
                    </div>
                  )}

                  {/* Affected Services */}
                  {selectedNode.affectedServices && selectedNode.affectedServices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Entidades Afectadas</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.affectedServices.map((service, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Root Cause */}
                  {selectedNode.rootCause && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Causa Raíz</h4>
                      <p className="text-sm text-muted-foreground">{selectedNode.rootCause}</p>
                    </div>
                  )}

                  {/* Solution */}
                  {selectedNode.solution && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-1">
                        <Settings size={14} /> Recomendación
                      </h4>
                      <p className="text-sm text-green-300/80">{selectedNode.solution}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={resetChart}
                      className="flex-1 px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <ChevronLeft size={14} /> Volver al Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Eye size={32} className="text-cyan-400" />
                  </div>
                  <p className="text-lg font-medium text-white">Explora tus alertas</p>
                  <p className="text-sm mt-2 max-w-xs">Navega por la rueda jerárquica para analizar patrones de problemas y optimizar tus umbrales de monitoreo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend / Stats Bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Severity Legend */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Mostrando:</span>
              {severityFilter.includes('CRITICAL') && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-600"></span>
                  <span className="text-xs text-muted-foreground">CRITICAL ({filteredStats.critical})</span>
                </div>
              )}
              {severityFilter.includes('HIGH') && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-xs text-muted-foreground">HIGH ({filteredStats.high})</span>
                </div>
              )}
              {severityFilter.includes('MEDIUM') && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-xs text-muted-foreground">MEDIUM ({filteredStats.medium})</span>
                </div>
              )}
              {severityFilter.includes('LOW') && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  <span className="text-xs text-muted-foreground">LOW ({filteredStats.low})</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Tipos</p>
                <p className="text-lg font-bold text-white">{filteredStats.total}<span className="text-sm font-normal text-muted-foreground">/{stats.total}</span></p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Ocurrencias</p>
                <p className="text-lg font-bold text-cyan-400">{filteredStats.totalOccurrences.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">MTTR Prom.</p>
                <p className="text-lg font-bold text-green-400">{stats.avgMttr} min</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemsAnalyzer;
