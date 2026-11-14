import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, RotateCcw, Trophy, Flame, Play } from 'lucide-react';

export const GamesHubApp: React.FC = () => {
  const [activeGame, setActiveGame] = useState<'lander' | 'puzzle'>('lander');

  // --- PLUTO LANDER PHYSICS GAME ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'landed' | 'crashed'>('playing');
  const [fuel, setFuel] = useState(100);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(1450);

  // Ship physics ref
  const shipRef = useRef({
    x: 200,
    y: 60,
    vx: 0.8,
    vy: 0.2,
    angle: 0,
    fuel: 100,
  });

  const keysRef = useRef<{ left: boolean; right: boolean; thrust: boolean }>({
    left: false,
    right: false,
    thrust: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeGame !== 'lander') return;
      if (e.code === 'ArrowUp' || e.code === 'Space') keysRef.current.thrust = true;
      if (e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'ArrowRight') keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'Space') keysRef.current.thrust = false;
      if (e.code === 'ArrowLeft') keysRef.current.left = false;
      if (e.code === 'ArrowRight') keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeGame]);

  const resetLander = () => {
    shipRef.current = {
      x: 100 + Math.random() * 200,
      y: 50,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.2,
      angle: 0,
      fuel: 100,
    };
    setFuel(100);
    setGameState('playing');
  };

  useEffect(() => {
    if (activeGame !== 'lander') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Terrain geometry
    const terrain = [
      { x: 0, y: 340 },
      { x: 120, y: 310 },
      { x: 200, y: 310 }, // Landing Pad 1 (Flat)
      { x: 280, y: 350 },
      { x: 400, y: 320 },
      { x: 500, y: 320 }, // Landing Pad 2 (Flat)
      { x: 620, y: 360 },
      { x: 740, y: 330 },
    ];

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const width = canvas.width;
      const height = canvas.height;

      // Update ship
      const ship = shipRef.current;
      if (gameState === 'playing') {
        const gravity = 0.035; // Pluto low gravity
        ship.vy += gravity;

        if (keysRef.current.left) ship.angle -= 0.05;
        if (keysRef.current.right) ship.angle += 0.05;

        if (keysRef.current.thrust && ship.fuel > 0) {
          const power = 0.08;
          ship.vx += Math.sin(ship.angle) * power;
          ship.vy -= Math.cos(ship.angle) * power;
          ship.fuel = Math.max(0, ship.fuel - 0.25);
          setFuel(Math.round(ship.fuel));
        }

        ship.x += ship.vx;
        ship.y += ship.vy;

        // Wrap horizontal edges
        if (ship.x < 0) ship.x = width;
        if (ship.x > width) ship.x = 0;

        // Collision test with terrain
        if (ship.y >= 300) {
          // Check if on Landing Pad 1 or 2
          const onPad1 = ship.x >= 120 && ship.x <= 200 && Math.abs(ship.y - 300) < 10;
          const onPad2 = ship.x >= 400 && ship.x <= 500 && Math.abs(ship.y - 310) < 10;

          const softLanding = Math.abs(ship.vy) < 1.2 && Math.abs(ship.vx) < 0.8 && Math.abs(ship.angle) < 0.35;

          if ((onPad1 || onPad2) && softLanding) {
            setGameState('landed');
            const points = Math.round(500 + ship.fuel * 10);
            setScore((s) => s + points);
            setHighScore((h) => Math.max(h, points));
          } else {
            setGameState('crashed');
          }
        }
      }

      // Draw background
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137.5) % width;
        const sy = (i * 83.2) % 240;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Pluto Terrain
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(terrain[0].x, terrain[0].y);
      for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Highlight Landing Pads
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 310);
      ctx.lineTo(200, 310);
      ctx.moveTo(400, 320);
      ctx.lineTo(500, 320);
      ctx.stroke();

      // Draw Ship
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      // Ship body
      ctx.fillStyle = gameState === 'crashed' ? '#ef4444' : '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();

      // Thruster flame
      if (keysRef.current.thrust && ship.fuel > 0 && gameState === 'playing') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(0, 20 + Math.random() * 6);
        ctx.lineTo(5, 10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    loop();

    return () => cancelAnimationFrame(animId);
  }, [activeGame, gameState]);

  // --- NEON 2048 PUZZLE GAME ---
  const [board, setBoard] = useState<number[][]>([
    [2, 4, 8, 0],
    [0, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [puzzleScore, setPuzzleScore] = useState(384);

  const slideLeft = () => {
    setBoard((prev) => {
      const next = prev.map((row) => {
        const filtered = row.filter((v) => v !== 0);
        for (let i = 0; i < filtered.length - 1; i++) {
          if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            setPuzzleScore((s) => s + filtered[i]);
            filtered.splice(i + 1, 1);
          }
        }
        while (filtered.length < 4) filtered.push(0);
        return filtered;
      });
      return next;
    });
  };

  const slideRight = () => {
    setBoard((prev) => {
      const next = prev.map((row) => {
        const filtered = row.filter((v) => v !== 0);
        for (let i = filtered.length - 1; i > 0; i--) {
          if (filtered[i] === filtered[i - 1]) {
            filtered[i] *= 2;
            setPuzzleScore((s) => s + filtered[i]);
            filtered.splice(i - 1, 1);
          }
        }
        while (filtered.length < 4) filtered.unshift(0);
        return filtered;
      });
      return next;
    });
  };

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-slate-800 text-slate-200';
      case 4: return 'bg-cyan-950 text-cyan-300 border border-cyan-800/40';
      case 8: return 'bg-cyan-600 text-white font-bold';
      case 16: return 'bg-blue-600 text-white font-bold';
      case 32: return 'bg-indigo-600 text-white font-bold';
      case 64: return 'bg-purple-600 text-white font-bold';
      case 128: return 'bg-pink-600 text-white font-bold';
      case 256: return 'bg-rose-600 text-white font-bold';
      case 512: return 'bg-amber-500 text-slate-950 font-bold';
      default: return 'bg-slate-900/40 text-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">Pluto Arcade & Entertainment</h3>
            <span className="text-[11px] text-slate-400">Native 60 FPS Canvas Physics Games</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveGame('lander')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeGame === 'lander' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pluto Cyber Lander
          </button>
          <button
            onClick={() => setActiveGame('puzzle')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeGame === 'puzzle' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Neon 2048
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {activeGame === 'lander' && (
          <div className="w-full max-w-2xl flex flex-col items-center space-y-3">
            {/* HUD */}
            <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Fuel: <strong className="text-amber-400">{fuel}%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-cyan-400" />
                <span>Score: <strong className="text-cyan-400">{score}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">High: {highScore}</span>
              </div>
              <button
                onClick={resetLander}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restart
              </button>
            </div>

            {/* Canvas */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <canvas ref={canvasRef} width={680} height={380} className="w-full block bg-black" />

              {/* Status Banner Overlay */}
              {gameState === 'landed' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-3">
                  <div className="text-lg font-bold text-emerald-400">PERFECT TOUCHDOWN!</div>
                  <p className="text-xs text-slate-300">Safely docked on Pluto's frozen nitrogen basin.</p>
                  <button
                    onClick={resetLander}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-lg"
                  >
                    Launch Next Flight
                  </button>
                </div>
              )}
              {gameState === 'crashed' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-3">
                  <div className="text-lg font-bold text-rose-500">HULL CRUSHED!</div>
                  <p className="text-xs text-slate-300">Descent velocity exceeded landing gear tolerance.</p>
                  <button
                    onClick={resetLander}
                    className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg shadow-lg"
                  >
                    Deploy Replacement Lander
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono text-center">
              Controls: [Arrow Up / Space] Thrusters · [Arrow Left / Right] Rotate RCS · Land on green pads with low velocity!
            </div>
          </div>
        )}

        {activeGame === 'puzzle' && (
          <div className="w-full max-w-sm flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-cyan-400">Neon 2048</span>
              <span className="text-xs font-mono font-bold text-slate-200">Score: {puzzleScore}</span>
            </div>

            {/* 4x4 Board */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl grid grid-cols-4 gap-2.5 w-72 h-72">
              {board.flatMap((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`rounded-xl flex items-center justify-center text-sm font-mono transition-all ${getTileColor(
                      val
                    )}`}
                  >
                    {val > 0 ? val : ''}
                  </div>
                ))
              )}
            </div>

            {/* Move Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={slideLeft}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
              >
                ← Slide Left
              </button>
              <button
                onClick={slideRight}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
              >
                Slide Right →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
