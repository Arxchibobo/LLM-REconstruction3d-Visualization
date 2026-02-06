'use client';

import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { X, FileText, Tag, Link2, Clock, Calendar, Sparkles, Eye } from 'lucide-react';

export default function Sidebar() {
  const { selectedNode, setSelectedNode, isOpen, setIsOpen } = useKnowledgeStore();

  if (!isOpen || !selectedNode) return null;

  // 根据节点类型获取 Vaporwave 背景色
  const getTypeColor = () => {
    switch (selectedNode.type) {
      case 'document':
        return 'from-cyan-500/20 to-cyan-600/10';
      case 'error':
        return 'from-pink-500/20 to-pink-600/10';
      case 'mcp':
        return 'from-cyan-500/20 to-cyan-600/10';
      case 'skill':
        return 'from-green-400/20 to-green-500/10';
      case 'plugin':
        return 'from-yellow-400/20 to-yellow-500/10';
      case 'config':
        return 'from-purple-500/20 to-purple-600/10';
      default:
        return 'from-pink-500/20 to-cyan-500/10';
    }
  };

  return (
    <div className="w-96 bg-black/95 backdrop-blur-md border-l border-cyan-500/30 flex flex-col h-full overflow-hidden relative">
      {/* Cyberpunk 扫描线效果 */}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_0%,rgba(0,255,255,0.03)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none" />

      {/* Header - HUD 风格 */}
      <div className={`p-6 border-b border-cyan-500/30 bg-black/80 relative overflow-hidden`}>
        {/* 角落装饰 */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
                <div className="w-1 h-2 bg-cyan-400/60" />
                <div className="w-1 h-2 bg-cyan-400/30" />
              </div>
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
                [{selectedNode.type}]
              </span>
            </div>
            <h2 className="text-lg font-bold leading-tight text-cyan-400 font-mono tracking-wide">
              {selectedNode.title}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              setSelectedNode(null);
            }}
            className="p-2 border border-magenta-500/60 bg-black/60 hover:bg-magenta-500/10 transition-all relative"
          >
            <X className="w-4 h-4 text-magenta-400" />
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-magenta-400" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-magenta-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-pink-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Description
          </h3>
          <p className="text-sm leading-relaxed text-gray-300">
            {selectedNode.description}
          </p>
        </div>

        {/* Visual Info - Vaporwave 风格 */}
        <div className="bg-gradient-to-br from-pink-950/30 to-cyan-950/30 rounded-xl p-4 space-y-3 border border-pink-500/20">
          <h3 className="text-sm font-semibold text-pink-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Visual Properties
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-pink-300/70 text-xs">Shape</span>
              <p className="font-medium text-cyan-300 capitalize">Planet</p>
            </div>
            <div>
              <span className="text-pink-300/70 text-xs">Size</span>
              <p className="font-medium text-cyan-300">{selectedNode.visual.size.toFixed(2)}x</p>
            </div>
            <div>
              <span className="text-pink-300/70 text-xs">Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-white/20 shadow-lg"
                  style={{ backgroundColor: selectedNode.visual.color, boxShadow: `0 0 8px ${selectedNode.visual.color}` }}
                />
                <span className="font-mono text-xs text-cyan-300">{selectedNode.visual.color}</span>
              </div>
            </div>
            <div>
              <span className="text-pink-300/70 text-xs">Glow</span>
              <p className="font-medium text-cyan-300">{selectedNode.visual.glow ? '✨ Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags ({selectedNode.tags.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedNode.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {selectedNode.links && selectedNode.links.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Connections ({selectedNode.links.length})
            </h3>
            <div className="space-y-2">
              {selectedNode.links.slice(0, 5).map((link, idx) => (
                <div
                  key={`${link}-${idx}`}
                  className="text-sm text-primary hover:text-primary/80 cursor-pointer truncate bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <Link2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{link}</span>
                </div>
              ))}
              {selectedNode.links.length > 5 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  +{selectedNode.links.length - 5} more links
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Metadata
          </h3>
          <div className="space-y-3 text-sm bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created</span>
              </div>
              <span className="font-medium">
                {new Date(selectedNode.metadata.created).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Modified</span>
              </div>
              <span className="font-medium">
                {new Date(selectedNode.metadata.modified).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Size</span>
              </div>
              <span className="font-medium">
                {(selectedNode.metadata.size / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>Views</span>
              </div>
              <span className="font-medium">{selectedNode.metadata.accessCount}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Importance</span>
                <span className="font-medium">{(selectedNode.metadata.importance * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-primary/50 to-primary"
                  style={{ width: `${selectedNode.metadata.importance * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* File Path */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            File Location
          </h3>
          <code className="text-xs bg-secondary/50 p-3 rounded-lg block overflow-x-auto font-mono border border-border/50">
            {selectedNode.filePath}
          </code>
        </div>
      </div>

      {/* Actions - Vaporwave 风格 */}
      <div className="p-4 border-t border-pink-500/30 bg-black/40 flex gap-2">
        <button
          onClick={() => {
            if (selectedNode.filePath) {
              // 在浏览器中提示用户文件路径
              alert(`File path: ${selectedNode.filePath}\n\n(Open functionality requires Electron)`);
            }
          }}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all text-sm font-semibold shadow-lg shadow-pink-500/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Open File
        </button>
        <button
          onClick={() => {
            alert(`Edit functionality coming soon!\nNode: ${selectedNode.title}`);
          }}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all text-sm font-semibold shadow-lg shadow-cyan-500/50 border border-cyan-400/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
