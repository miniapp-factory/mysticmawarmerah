"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? 2 : 4;
}

function emptyPositions(grid: number[][]) {
  const positions: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) positions.push([r, c]);
    }
  }
  return positions;
}

function addRandomTile(grid: number[][]) {
  const empty = emptyPositions(grid);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = getRandomTile();
  return newGrid;
}

function slideAndMerge(row: number[]) {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return merged;
}

function transpose(grid: number[][]) {
  return grid[0].map((_, i) => grid.map(row => row[i]));
}

function reverse(grid: number[][]) {
  return grid.map(row => [...row].reverse());
}

function move(grid: number[][], direction: "up" | "down" | "left" | "right") {
  let newGrid = [...grid];
  if (direction === "up") newGrid = transpose(newGrid);
  if (direction === "down") newGrid = reverse(transpose(newGrid));
  if (direction === "right") newGrid = reverse(newGrid);

  newGrid = newGrid.map(row => slideAndMerge(row));

  if (direction === "up") newGrid = transpose(newGrid);
  if (direction === "down") newGrid = transpose(reverse(newGrid));
  if (direction === "right") newGrid = reverse(newGrid);

  return newGrid;
}

export default function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    let g = addRandomTile(grid);
    g = addRandomTile(g);
    setGrid(g);
  }, []);

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const newGrid = move(grid, direction);
    if (JSON.stringify(newGrid) === JSON.stringify(grid)) return; // no change
    const newScore = newGrid.flat().reduce((a, b) => a + b, 0);
    setGrid(newGrid);
    setScore(newScore);
    if (newGrid.flat().includes(2048)) setWon(true);
    if (!emptyPositions(newGrid).length && !hasMoves(newGrid)) setGameOver(true);
  };

  const hasMoves = (g: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && g[r][c] === g[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((value, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-16 w-16 rounded-md text-xl font-bold ${
              value === 0
                ? "bg-gray-200"
                : value <= 4
                ? "bg-yellow-200"
                : value <= 16
                ? "bg-yellow-300"
                : value <= 64
                ? "bg-yellow-400"
                : value <= 256
                ? "bg-yellow-500"
                : value <= 1024
                ? "bg-yellow-600"
                : "bg-yellow-700"
            }`}
          >
            {value !== 0 ? value : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <Button onClick={() => handleMove("left")}>←</Button>
        <Button onClick={() => handleMove("right")}>→</Button>
        <Button onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">Game Over</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
      {won && !gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">You Win!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
