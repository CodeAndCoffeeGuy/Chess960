'use client';

import React, { useState } from 'react';
import { AnalysisBoard, GameAnalysisPanel, EvaluationBar } from '@/components/analysis';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

export default function AnalysisPage() {
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [evaluation] = useState(0.2);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_gameAnalysis, _setGameAnalysis] = useState(null);
  
  // Sample PGN for testing
  const samplePGN = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7';

  const handlePositionChange = (fen: string) => {
    setCurrentFen(fen);
  };

  const handleGameAnalysisComplete = (_analysis: any) => {
    // Analysis completed but not used in this demo
  };

  return (
    <div className="relative min-h-screen bg-[#1f1d1a] text-white overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.35), rgba(59,130,246,0.15) 45%, transparent 60%)' }} />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      </div>
      <div className="relative container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Chess Analysis</h1>
          <p className="text-[#b6aea2]">
            Analyze positions and games with Stockfish engine
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Analysis Board Section */}
          <div className="xl:col-span-2">
            <div className="bg-[#35322e] border border-[#474239] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Position Analysis</h2>
              <div className="flex gap-4">
                <div className="flex-1">
                  <AnalysisBoard
                    game={{ id: 'analysis', color: 'white', moves: [], toMove: 'white', ended: false }}
                    onMove={() => {}}
                    initialFen={currentFen}
                    onPositionChange={handlePositionChange}
                    showEvaluation={true}
                  />
                </div>
                
                {/* Evaluation Bar */}
                <div className="flex flex-col items-center">
                  <EvaluationBar
                    evaluation={evaluation}
                    orientation="vertical"
                    className="mb-4"
                  />
                </div>
              </div>
              
              {/* Position Info */}
              <div className="mt-6 p-4 bg-[#292622]/70 border border-[#3e3a33] rounded">
                <h3 className="text-sm font-medium text-[#c1b9ad] mb-2">Current Position (FEN)</h3>
                <code className="text-xs text-orange-300 break-all">
                  {currentFen}
                </code>
              </div>
            </div>
          </div>

          {/* Game Analysis Section */}
          <div className="xl:col-span-2">
            <GameAnalysisPanel
              pgn={samplePGN}
              onAnalysisComplete={handleGameAnalysisComplete}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#35322e] border border-[#474239] rounded-lg p-6">
            <h3 className="text-xl font-bold mb-3">Position Analysis</h3>
            <p className="text-[#b6aea2] mb-4">
              Analyze any chess position with Stockfish to find the best moves and evaluate the position.
            </p>
            <ul className="text-sm text-[#c1b9ad] space-y-2">
              <li>• Real-time position evaluation</li>
              <li>• Best move suggestions</li>
              <li>• Depth-based analysis</li>
              <li>• Interactive board</li>
            </ul>
          </div>

          <div className="bg-[#35322e] border border-[#474239] rounded-lg p-6">
            <h3 className="text-xl font-bold mb-3">Game Analysis</h3>
            <p className="text-[#b6aea2] mb-4">
              Analyze complete games to identify mistakes, inaccuracies, and missed opportunities.
            </p>
            <ul className="text-sm text-[#c1b9ad] space-y-2">
              <li>• Move-by-move analysis</li>
              <li>• Accuracy calculations</li>
              <li>• Mistake classification</li>
              <li>• Opening identification</li>
            </ul>
          </div>

          <div className="bg-[#35322e] border border-[#474239] rounded-lg p-6">
            <h3 className="text-xl font-bold mb-3">Engine Features</h3>
            <p className="text-[#b6aea2] mb-4">
              Powered by Stockfish, one of the world&apos;s strongest chess engines.
            </p>
            <ul className="text-sm text-[#c1b9ad] space-y-2">
              <li>• Stockfish 16+ engine</li>
              <li>• Configurable depth</li>
              <li>• Multi-PV analysis</li>
              <li>• Fast evaluation</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-[#35322e] border border-[#474239] rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#c1b9ad]">
            <div>
              <h4 className="font-semibold mb-2">Position Analysis:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Make moves on the analysis board</li>
                <li>The engine will automatically analyze each position</li>
                <li>View the evaluation and best move suggestions</li>
                <li>Use the controls to undo moves or reset the board</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Game Analysis:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Enter a PGN or move sequence</li>
                <li>Click &quot;Analyze Game&quot; to start analysis</li>
                <li>Review move accuracy and classifications</li>
                <li>Identify areas for improvement</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}