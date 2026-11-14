import React, { useState } from 'react';
import { Calculator as CalcIcon, Delete, Copy, Check } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const CalculatorApp: React.FC = () => {
  const { copyToClipboard } = useOS();
  const [expr, setExpr] = useState('0');
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const appendToken = (tok: string) => {
    setExpr((prev) => (prev === '0' && /^[0-9(πe]/.test(tok) ? tok : prev + tok));
  };

  const evaluateExpression = () => {
    try {
      const normalized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, `(${Math.PI})`)
        .replace(/\be\b/g, `(${Math.E})`)
        .replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(');

      if (!/^[0-9+\-*/().,\sMathsincoqrtlgE]+$/.test(normalized)) {
        setExpr('Error');
        return;
      }

      const rawResult = Function(`"use strict"; return (${normalized});`)();
      if (typeof rawResult !== 'number' || !Number.isFinite(rawResult)) {
        setExpr('Error');
        return;
      }
      const formatted = Number.isInteger(rawResult) ? String(rawResult) : String(+rawResult.toFixed(10));
      setHistory((prev) => [{ expr, result: formatted }, ...prev].slice(0, 12));
      setExpr(formatted);
    } catch {
      setExpr('Error');
    }
  };

  const buttons = [
    ['sin(', 'cos(', 'tan(', 'C', 'DEL'],
    ['sqrt(', 'log(', 'ln(', '(', ')'],
    ['7', '8', '9', '÷', '^'],
    ['4', '5', '6', '×', '%'],
    ['1', '2', '3', '-', 'π'],
    ['0', '.', '=', '+', 'e'],
  ];

  return (
    <div className="flex-1 flex h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col p-5 max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold flex items-center gap-2 text-cyan-500">
            <CalcIcon className="w-4 h-4" />
            Scientific Calculator
          </span>
          <button
            onClick={() => {
              copyToClipboard({ type: 'text', label: 'Calculation Result', data: expr });
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="px-2.5 py-1 text-xs dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            Copy Result
          </button>
        </div>

        {/* Display */}
        <div className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl shadow-inner text-right">
          <input
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                evaluateExpression();
              }
            }}
            className="w-full bg-transparent text-right text-2xl font-mono font-bold focus:outline-none dark:text-white text-slate-900"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-5 gap-2 flex-1">
          {buttons.flat().map((btn) => {
            const isEquals = btn === '=';
            const isClear = btn === 'C' || btn === 'DEL';
            const isOp = ['÷', '×', '-', '+', '^', '%'].includes(btn);
            return (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  if (btn === 'C') setExpr('0');
                  else if (btn === 'DEL') setExpr((p) => (p.length <= 1 ? '0' : p.slice(0, -1)));
                  else if (btn === '=') evaluateExpression();
                  else appendToken(btn);
                }}
                className={`rounded-xl font-mono text-sm font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer border ${
                  isEquals
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400'
                    : isClear
                    ? 'dark:bg-rose-950/60 bg-rose-50 text-rose-500 dark:border-rose-900/50 border-rose-200 hover:bg-rose-500/20'
                    : isOp
                    ? 'dark:bg-slate-800 bg-slate-200 text-cyan-500 dark:border-slate-700 border-slate-300'
                    : 'dark:bg-slate-900 bg-white dark:hover:bg-slate-800 hover:bg-slate-100 dark:border-slate-800 border-slate-200'
                }`}
              >
                {btn === 'DEL' ? <Delete className="w-4 h-4" /> : btn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculation History Tape */}
      <div className="hidden sm:flex w-56 dark:bg-slate-900 bg-white border-l dark:border-slate-800 border-slate-200 flex-col p-4">
        <span className="text-xs font-bold dark:text-slate-300 text-slate-700 pb-2 border-b dark:border-slate-800 border-slate-200">
          Tape History
        </span>
        <div className="flex-1 overflow-y-auto space-y-2 pt-3">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono">No calculations yet.</p>
          ) : (
            history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setExpr(item.result)}
                className="w-full text-right p-2 rounded-xl dark:bg-slate-950/60 bg-slate-50 border dark:border-slate-800 border-slate-200 hover:border-cyan-500/50 transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-mono text-slate-500 block truncate">{item.expr}</span>
                <span className="text-xs font-mono font-bold text-cyan-500 block">= {item.result}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
