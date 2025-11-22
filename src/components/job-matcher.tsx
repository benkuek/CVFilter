"use client";

import { useState, useEffect } from "react";
import { JobMatcherService } from "./job-matcher-service";
import type { Node } from "../data/cv-graph";

const DEBUG = false; // Set to true for debugging

export default function JobMatcher() {
  const [jobAd, setJobAd] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillDetails, setSkillDetails] = useState<{
    skill: Node;
    projects: Node[];
    roles: Node[];
    companies: Node[];
  } | null>(null);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [analysis, setAnalysis] = useState<{
    requiredSkills: string[];
    skillMatch: number;
    matchedSkills: string[];
    missingSkills: string[];
    overallScore: number;
  } | null>(null);

  
  const jobMatcherService = new JobMatcherService();
  const log = (...args: unknown[]) => DEBUG && console.log(...args);

  useEffect(() => {
    fetch('/api/session-check')
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.authenticated))
      .catch(() => setIsLoggedIn(false));
  }, []);

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

  const handleSkillClick = async (skill: string) => {
    if (!isLoggedIn) return;
    setSkillError(null);
    try {
      const details = await jobMatcherService.getSkillDetails(skill);
      setSelectedSkill(skill);
      setSkillDetails(details);
    } catch {
      setSkillError('Failed to load skill details');
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
                <div key={idx} className="w-full p-2 bg-green-100 rounded text-sm flex justify-between items-center">
                  {isLoggedIn ? (
                    <button
                      onClick={() => handleSkillClick(skill)}
                      className="flex-1 text-left hover:bg-green-200 p-1 -m-1 rounded transition-colors"
                    >
                      ✓ {skill}
                    </button>
                  ) : (
                    <span>✓ {skill}</span>
                  )}
                  {!isLoggedIn && <span className="text-xs text-gray-500">log in to view</span>}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Skill Details</h4>
              {skillError && (
                <div className="p-4 bg-red-50 rounded text-red-700">
                  {skillError}
                </div>
              )}

              {skillDetails && (
                <div className="p-4 bg-blue-50 rounded">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-lg">{selectedSkill}</h4>
                    <button
                      onClick={() => { setSelectedSkill(null); setSkillDetails(null); }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  
                  {skillDetails.skill?.meta && (
                    <div className="mb-3 text-sm">
                      <span className="font-medium">Level:</span> {skillDetails.skill.meta.level}/5 
                      <span className="ml-4 font-medium">Experience:</span> {skillDetails.skill.meta.years} years
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {skillDetails.roles?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-1">Used in Roles:</h5>
                        {skillDetails.roles.map((role: Node, idx: number) => (
                          <div key={idx} className="text-gray-700">{role.label}</div>
                        ))}
                      </div>
                    )}
                    
                    {skillDetails.projects?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-1">Projects:</h5>
                        {skillDetails.projects.map((project: Node, idx: number) => (
                          <div key={idx} className="text-gray-700">{project.label}</div>
                        ))}
                      </div>
                    )}
                    
                    {skillDetails.companies?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-1">Companies:</h5>
                        {skillDetails.companies.map((company: Node, idx: number) => (
                          <div key={idx} className="text-gray-700">{company.label}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
      )}
    </div>
  );
}