"use client";

import { useState } from "react";
import { JobMatcherService } from "./job-matcher-service";

const DEBUG = false; // Set to true for debugging

export default function JobMatcher() {
  const [jobAd, setJobAd] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysis, setAnalysis] = useState<{
    requiredSkills: string[];
    skillMatch: number;
    matchedSkills: string[];
    missingSkills: string[];
    overallScore: number;
  } | null>(null);

  
  const jobMatcherService = new JobMatcherService();
  const log = (...args: unknown[]) => DEBUG && console.log(...args);

  const analyzeJob = async () => {
    if (!jobAd.trim()) return;

    setIsAnalyzing(true);
    try {
      log('🚀 Starting job analysis...');
      log('📄 Job ad text:', jobAd);
      
      const result = await jobMatcherService.analyzeJob(jobAd);
      
      log('🎯 Final analysis result:', result);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold">Job Match for Benjamin Kuek</h2>
      
      <div className="space-y-4">
        <textarea
          value={jobAd}
          onChange={(e) => setJobAd(e.target.value)}
          placeholder="Paste job description here..."
          className="w-full h-64 p-3 border rounded resize-none"
        />
        
        <button
          onClick={analyzeJob}
          disabled={isAnalyzing || !jobAd.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Match'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-semibold text-lg">Skills Match: {analysis.overallScore}%</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Matched Skills ({analysis.matchedSkills.length})</h4>
              {analysis.matchedSkills.map((skill: string, idx: number) => (
                <div key={idx} className="p-2 bg-green-100 rounded text-sm">
                  ✓ {skill}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Missing Skills ({analysis.missingSkills.length})</h4>
              {analysis.missingSkills.map((skill: string, idx: number) => (
                <div key={idx} className="p-2 bg-red-100 rounded text-sm">
                  ✗ {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}