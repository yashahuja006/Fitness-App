'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Program, ProgramScore, UserProgramProfile } from '@/types/program';
import { ProgramScoringEngine } from '@/lib/programScoringEngine';
import { programDatabase } from '@/data/programDatabase';

interface ProgramRecommendationsProps {
  userProfile: UserProgramProfile;
  onSelectProgram: (program: Program, score: ProgramScore) => void;
  isPro?: boolean;
}

export function ProgramRecommendations({ userProfile, onSelectProgram, isPro = false }: ProgramRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ProgramScore[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<Map<string, Program>>(new Map());

  useEffect(() => {
    const scores = ProgramScoringEngine.getTopRecommendations(programDatabase, userProfile, isPro ? 3 : 1);
    setRecommendations(scores);
  }, [userProfile, isPro]);

  const getProgram = (programId: string): Program | undefined => {
    return programDatabase.find(p => p.id === programId);
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[confidence as keyof typeof colors] || colors.medium;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI-Powered Recommendations
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Programs ranked by intelligent scoring algorithm
          </p>
        </div>
        {!isPro && (
          <Button variant="primary" onClick={() => alert('Upgrade to Pro for full recommendations!')}>
            🚀 Upgrade to Pro
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {recommendations.map((score, index) => {
          const program = getProgram(score.programId);
          if (!program) return null;

          const isTopPick = index === 0;

          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 ${isTopPick ? 'border-2 border-blue-500 shadow-lg' : ''} ${!isPro && index > 0 ? 'opacity-50 blur-sm pointer-events-none' : ''}`}>
                {isTopPick && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                      ⭐ Best Match
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {program.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {program.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {program.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {program.daysPerWeek} days/week
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {program.duration} weeks
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getConfidenceBadge(score.confidence)}`}>
                        {score.confidence} confidence
                      </span>
                    </div>
                  </div>

                  <div className="ml-6 text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(score.totalScore)}`}>
                      {score.totalScore}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      / 100
                    </div>
                  </div>
                </div>

                {isPro && (
                  <>
                    {/* Score Breakdown */}
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Score Breakdown
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(score.breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${(value / getMaxScore(key)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                {value}/{getMaxScore(key)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Why This Program?
                      </h4>
                      <ul className="space-y-1">
                        {score.reasoning.map((reason, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => onSelectProgram(program, score)}
                    className="flex-1"
                  >
                    Select Program
                  </Button>
                  <Button variant="secondary">
                    View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {!isPro && recommendations.length > 1 && (
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Unlock {recommendations.length - 1} More Recommendations
              </h3>
              <p className="text-blue-100">
                See full scoring breakdown, detailed reasoning, and compare programs side-by-side
              </p>
            </div>
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function getMaxScore(key: string): number {
  const maxScores: Record<string, number> = {
    goalAlignment: 30,
    experienceMatch: 25,
    timeCommitment: 20,
    equipmentMatch: 15,
    recoveryFit: 10,
  };
  return maxScores[key] || 10;
}
