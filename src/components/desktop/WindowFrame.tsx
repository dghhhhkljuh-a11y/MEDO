import React, { useRef, useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { WindowState } from '../../types/os';
import { useOS } from '../../context/OSContext';

interface WindowFrameProps {
  window: WindowState;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, icon, children }) => {
  const { focusApp, minimizeApp, maximizeApp, closeApp, updateWindowPos, updateWindowSize, activeAppId } = useOS();
  const isActive = activeAppId === win.id;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const winRef = useRef<HTMLDivElement>(null);

  // Titlebar drag start
  const handleMouseDownTitle = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return; // Ignore window control buttons
    focusApp(win.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y,
    });
  };

  // Resize handle drag start
  const handleMouseDownResize = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    e.stopPropagation();
    focusApp(win.id);
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: win.size.width,
      h: win.size.height,
    });
  };

  // Global mousemove and mouseup listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const nextX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
        const nextY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
        updateWindowPos(win.id, { x: nextX, y: nextY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const nextW = Math.max(480, Math.min(window.innerWidth - 20, resizeStart.w + deltaX));
        const nextH = Math.max(340, Math.min(window.innerHeight - 60, resizeStart.h + deltaY));
        updateWindowSize(win.id, { width: nextW, height: nextH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, win.id, updateWindowPos, updateWindowSize]);

  if (win.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = win.isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)', // leave taskbar visible
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={winRef}
      style={style}
      onClick={() => focusApp(win.id)}
      className={`flex flex-col rounded-xl overflow-hidden shadow-2xl transition-[border-color,box-shadow] duration-150 ${
        isActive
          ? 'ring-1 ring-cyan-500/30 border dark:border-slate-700/80 border-slate-300 shadow-cyan-950/30'
          : 'border dark:border-slate-800/80 border-slate-300/70 opacity-95'
      } dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl dark:text-slate-100 text-slate-900 select-none`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={() => maximizeApp(win.id)}
        className={`h-10 px-3.5 flex items-center justify-between border-b transition-colors cursor-default ${
          isActive
            ? 'dark:bg-slate-800/90 bg-slate-100/95 dark:border-slate-700/80 border-slate-200 dark:text-slate-100 text-slate-900'
            : 'dark:bg-slate-900/70 bg-slate-50/90 dark:border-slate-800/70 border-slate-200 dark:text-slate-400 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 text-cyan-500">{icon}</div>
          <span className="text-xs font-semibold tracking-wide truncate max-w-sm">
            {win.title}
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => minimizeApp(win.id)}
            title="Minimize"
            aria-label="Minimize"
            className="w-7 h-7 flex items-center justify-center rounded-md dark:hover:bg-slate-700/60 hover:bg-slate-200 dark:active:bg-slate-700 dark:text-slate-400 text-slate-500 dark:hover:text-slate-200 hover:text-slate-900 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => maximizeApp(win.id)}
            title={win.isMaximized ? 'Restore' : 'Maximize'}
            aria-label={win.isMaximized ? 'Restore' : 'Maximize'}
            className="w-7 h-7 flex items-center justify-center rounded-md dark:hover:bg-slate-700/60 hover:bg-slate-200 dark:active:bg-slate-700 dark:text-slate-400 text-slate-500 dark:hover:text-slate-200 hover:text-slate-900 transition-colors"
          >
            {win.isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={() => closeApp(win.id)}
            title="Close"
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/20 active:bg-rose-500/30 dark:text-slate-400 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-hidden relative flex flex-col dark:bg-slate-900/40 bg-slate-50">
        {children}
      </div>

      {/* Resize Grip (bottom-right corner) */}
      {!win.isMaximized && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5 group"
          title="Resize"
        >
          <svg className="w-2.5 h-2.5 text-slate-600 group-hover:text-cyan-400 transition-colors" viewBox="0 0 10 10">
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};
