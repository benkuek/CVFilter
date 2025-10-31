"use client";

import { useState } from "react";
import nlp from "compromise";
import Fuse from "fuse.js";
import type { Node } from "../data/cv-graph";

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

  
  const log = (...args: unknown[]) => DEBUG && console.log(...args);

  const extractSkills = async (text: string) => {
    log('🔍 Extracting skills from:', text.substring(0, 100) + '...');
    
    try {
      const response = await fetch('/api/cv-graph/');
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }
      const cvGraph = await response.json();
      
      if (!cvGraph || !cvGraph.nodes) {
        throw new Error('Invalid CV data structure');
      }
      
      const skillNodes = cvGraph.nodes.filter((n: Node) => n.type === 'skill');
      const stackNodes = cvGraph.nodes.filter((n: Node) => n.type === 'stack');
      
      if (skillNodes.length === 0) {
        console.warn('No skill nodes found in CV data');
        return [];
      }
    
    const allSkills = [
      ...skillNodes.map((n: Node) => n.label || ''),
      ...skillNodes.flatMap((n: Node) => n.meta?.synonyms || []),
      ...stackNodes.flatMap((n: Node) => n.meta?.skills || [])
    ];
    log('📋 All skills dictionary:', allSkills);
    
    const foundSkills = new Set<string>();
    const unmatchedTerms = new Set<string>();
    const fuse = new Fuse(allSkills, { threshold: 0.05 }); // Much stricter threshold
    
    // 1. NLP: Extract candidate terms using built-in phrase extraction
    const doc = nlp(text);
    
    const nouns = doc.nouns().out('array');
    const terms = doc.terms().out('array');
    const properNouns = doc.match('#ProperNoun').out('array');
    const entities = doc.topics().out('array');
    
    log('🧠 NLP extracted by category:');
    log('  Terms:', terms);
    log('  Nouns:', nouns);
    log('  Proper Nouns:', properNouns);
    log('  Topics/Entities:', entities);
    
    const nlpTerms = [...terms, ...nouns, ...properNouns, ...entities];
    log('🧠 Combined NLP terms:', nlpTerms);
    
    // 2. Direct matching: Check dictionary terms against NLP terms only
    const nlpTermsLower = nlpTerms.map(t => t.toLowerCase().replace(/[()\[\]{}]/g, ''));
    
    allSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (nlpTermsLower.includes(skillLower)) {
        log(`🎯 Direct match found: "${skillLower}" in NLP terms`);
        const skillNode = skillNodes.find((n: Node) => 
          n.label?.toLowerCase() === skillLower || 
          n.meta?.synonyms?.some((syn: string) => syn.toLowerCase() === skillLower)
        );
        const mainSkill = skillNode?.label || skillLower;
        log(`   -> Mapped to skill: ${mainSkill}`);
        foundSkills.add(mainSkill);
      }
    });
    
    // 3. Fuzzy matching: Check NLP terms + individual words against known skills
    const words = text.toLowerCase().split(/[\s,;.()\-]+/).filter(w => w.length > 2);
    const termsToCheck = [...nlpTerms, ...words].map(t => t.replace(/[()\[\]{}]/g, ''));
    log('📝 Terms for fuzzy matching:', termsToCheck);
    
    termsToCheck.forEach((term: string) => {
      const results = fuse.search(term);
      if (results.length > 0 && results[0].score! < 0.05) { // Much stricter threshold
        log(`✅ Fuzzy match for "${term}":`, results[0]);
        const skill = results[0].item;
        const skillNode = skillNodes.find((n: Node) => 
          n.label?.toLowerCase() === skill.toLowerCase() || 
          n.meta?.synonyms?.some((syn: string) => syn.toLowerCase() === skill.toLowerCase())
        );
        const mainSkill = skillNode?.label || skill;
        foundSkills.add(mainSkill);
      }
    });
    
    // Track unmatched NLP terms
    [ ...properNouns, ...entities].forEach(nonTerm => {
      if (!foundSkills.has(nonTerm.toLowerCase())) {
        unmatchedTerms.add(nonTerm);
      }
    });
    
    log('❌ Unmatched NLP terms:', Array.from(unmatchedTerms));

    const result = Array.from(foundSkills);
    log('🎯 Final extracted skills:', result);
    return result;
    } catch (error) {
      console.error('Error extracting skills:', error);
      return [];
    }
  };



  const calculateMatch = async (requiredSkills: string[]) => {
    try {
      const response = await fetch('/api/cv-graph/');
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }
      const cvGraph = await response.json();
      
      if (!cvGraph || !cvGraph.nodes) {
        throw new Error('Invalid CV data structure');
      }
      
      const skillNodes = cvGraph.nodes.filter((n: Node) => n.type === 'skill');
      const mySkills = skillNodes.map((s: Node) => s.label?.toLowerCase() || '');
    
    const matchedSkills = requiredSkills.filter(skill => 
      mySkills.some((mySkill:string) => 
        mySkill.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(mySkill)
      )
    );

    return {
      skillMatch: Math.round((matchedSkills.length / requiredSkills.length) * 100),
      matchedSkills,
      missingSkills: requiredSkills.filter(skill => !matchedSkills.includes(skill))
    };
    } catch (error) {
      console.error('Error calculating match:', error);
      return {
        skillMatch: 0,
        matchedSkills: [],
        missingSkills: requiredSkills
      };
    }
  };

  const analyzeJob = async () => {
    if (!jobAd.trim()) return;

    setIsAnalyzing(true);
    try {
      log('🚀 Starting job analysis...');
      log('📄 Job ad text:', jobAd);
      
      const requiredSkills = await extractSkills(jobAd);
      const match = await calculateMatch(requiredSkills);
      
      const finalAnalysis = {
        requiredSkills,
        ...match,
        overallScore: match.skillMatch
      };
      
      log('🎯 Final analysis result:', finalAnalysis);
      setAnalysis(finalAnalysis);
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

            {/* <div className="space-y-2">
              <h4 className="font-medium">Missing Skills ({analysis.missingSkills.length})</h4>
              {analysis.missingSkills.map((skill: string, idx: number) => (
                <div key={idx} className="p-2 bg-red-100 rounded text-sm">
                  ✗ {skill}
                </div>
              ))}
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}