'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Building2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { employeesApi, OrgNode } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { getPhotoUrl } from '@/lib/utils';



export default function OrgChartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch org chart data
  const fetchOrgChart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getOrgChart();
      setOrgData(data);

      // Initially expand first 2 levels
      const initialExpanded = new Set<string>();
      const expandLevel = (node: OrgNode, level: number) => {
        if (level < 2) {
          initialExpanded.add(node.id);
          node.children?.forEach(child => expandLevel(child, level + 1));
        }
      };
      if (data) expandLevel(data, 0);
      setExpandedNodes(initialExpanded);

    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar organograma',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    if (!orgData) return;
    const all = new Set<string>();
    const collect = (node: OrgNode) => {
      all.add(node.id);
      node.children?.forEach(collect);
    };
    collect(orgData);
    setExpandedNodes(all);
  };

  // Collapse all nodes
  const collapseAll = () => {
    if (!orgData) return;
    setExpandedNodes(new Set([orgData.id]));
  };

  // Search filter
  const matchesSearch = (node: OrgNode): boolean => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      node.name.toLowerCase().includes(searchLower) ||
      node.position.toLowerCase().includes(searchLower) ||
      node.department.toLowerCase().includes(searchLower)
    );
  };

  // Render org node
  const renderNode = (node: OrgNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    const matches = matchesSearch(node);

    if (!matches && !node.children?.some(child => matchesSearch(child))) {
      return null;
    }

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          onClick={() => setSelectedNode(isSelected ? null : node)}
          className={`relative bg-white border-2 rounded-lg p-4 min-w-[200px] max-w-[250px] cursor-pointer transition-all ${isSelected
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            } ${!matches ? 'opacity-50' : ''}`}
        >
          {/* Avatar */}
          <div className="flex items-center gap-3 mb-2">
            {node.photoUrl ? (
              <Image
                src={getPhotoUrl(node.photoUrl, node.updatedAt) || ''}
                alt={node.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{node.name}</p>
              <p className="text-sm text-gray-500 truncate">{node.position}</p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{node.department}</span>
          </div>

          {/* Team count */}
          {hasChildren && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
              <Users className="w-3 h-3" />
              {node.children.length}
            </div>
          )}

          {/* Expand button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>

        {/* Connector line */}
        {hasChildren && isExpanded && (
          <>
            <div className="w-0.5 h-8 bg-gray-300" />

            {/* Horizontal connector */}
            <div className="relative">
              <div
                className="absolute top-0 h-0.5 bg-gray-300"
                style={{
                  left: `calc(50% - ${(node.children.length - 1) * 130}px)`,
                  width: `${(node.children.length - 1) * 260}px`,
                }}
              />
            </div>

            {/* Children */}
            <div className="flex gap-4 pt-8">
              {node.children.map(child => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-gray-300 -mt-8" />
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Organograma</h1>
              <p className="text-sm text-gray-500">Visualize a estrutura organizacional</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
              <button
                onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Expand/Collapse */}
            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Expandir Tudo
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Recolher Tudo
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={() => containerRef.current?.requestFullscreen()}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="overflow-auto p-8"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando organograma...</p>
            </div>
          </div>
        ) : orgData ? (
          <div
            className="flex justify-center transition-transform origin-top"
            style={{ transform: `scale(${zoom})` }}
          >
            {renderNode(orgData)}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum dado de organograma disponível</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="fixed bottom-4 right-4 w-80">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {selectedNode.photoUrl ? (
                  <Image
                    src={getPhotoUrl(selectedNode.photoUrl, selectedNode.updatedAt) || ''}
                    alt={selectedNode.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-500">{selectedNode.position}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedNode.department}</p>
                  {selectedNode.email && (
                    <a
                      href={`mailto:${selectedNode.email}`}
                      className="text-xs text-blue-600 hover:underline mt-1 block"
                    >
                      {selectedNode.email}
                    </a>
                  )}
                  {selectedNode.children && selectedNode.children.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedNode.children.length} subordinado(s) direto(s)
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => router.push(`/employees/${selectedNode.id}`)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Perfil
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
