import Fuse from "fuse.js";
import type { Node, Link } from "../data/cv-graph";
import { normalizeText, generateNgrams, getEditDistance } from "./job-matcher-utils";
import { NLPSkillExtractor } from "./nlp-skill-extractor";
import logger from "../lib/logger";

export class JobMatcherService {
  private skillsCache: { nodes: Node[] } | null = null;
  private fullCache: { nodes: Node[], links?: Link[] } | null = null;

  async loadCvGraph(skillsOnly: true): Promise<{ nodes: Node[] }>;
  async loadCvGraph(skillsOnly: false): Promise<{ nodes: Node[], links: Link[] }>;
  async loadCvGraph(skillsOnly = true): Promise<{ nodes: Node[], links?: Link[] }> {
    const cache = skillsOnly ? this.skillsCache : this.fullCache;
    if (cache) return cache;
    
    const url = skillsOnly ? '/api/cv-graph?skills=true' : '/api/cv-graph';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (skillsOnly) {
      this.skillsCache = data;
    } else {
      this.fullCache = data;
    }
    return data;
  }

  async extractSkills(text: string): Promise<string[]> {
    const cvGraph = await this.loadCvGraph(true);
    if (!cvGraph || !cvGraph.nodes) {
      throw new Error('Invalid CV data structure');
    }
    
    const skillNodes = cvGraph.nodes.filter((n: Node) => ['skill', 'soft_skill'].includes(n.type));
    
    // Use NLP extraction first
    const nlpExtractor = new NLPSkillExtractor(skillNodes);
    const nlpSkills = nlpExtractor.extractSkills(text);
    
    // Fallback to traditional n-gram matching for missed skills
    const foundSkills = new Set<string>(nlpSkills);
    const { allNgrams } = generateNgrams(text);
    
    skillNodes.forEach((node: Node) => {
      const mainSkill = node.label;
      if (!mainSkill || foundSkills.has(mainSkill)) return;
      
      const skillsToCheck = [mainSkill, ...(node.meta?.synonyms || [])];
      
      for (const skill of skillsToCheck) {
        const normalizedSkill = normalizeText(skill);
        
        if (allNgrams.includes(normalizedSkill)) {
          foundSkills.add(mainSkill);
          break;
        }
        
        const fuse = new Fuse(allNgrams, { threshold: 0.2, includeScore: true });
        const fuzzyResults = fuse.search(normalizedSkill);
        
        for (const result of fuzzyResults) {
          if (result.score && result.score < 0.2) {
            const match = result.item;
            const skillWords = normalizedSkill.split(' ');
            const matchWords = match.split(' ');
            
            if (skillWords.length > 1) {
              const overlap = skillWords.filter(w => matchWords.includes(w)).length;
              const overlapRatio = overlap / skillWords.length;
              
              if (overlapRatio >= 0.7) {
                foundSkills.add(mainSkill);
                break;
              }
            } else {
              const editDistance = getEditDistance(normalizedSkill, match);
              if (editDistance <= 2 && match.length >= normalizedSkill.length - 1) {
                foundSkills.add(mainSkill);
                break;
              }
            }
          }
        }
      }
    });
    
    return Array.from(foundSkills);
  }

  async getSkillDetails(skillName: string) {
    logger.info('Getting skill details', { skillName });
    
    const cvGraph = await this.loadCvGraph(false);
    if (!cvGraph?.nodes) {
      logger.warn('No CV graph nodes available');
      return null;
    }
    
    const skillNode = cvGraph.nodes.find(n => 
      n.label?.toLowerCase() === skillName.toLowerCase() ||
      n.meta?.synonyms?.some((syn: string) => syn.toLowerCase() === skillName.toLowerCase())
    );
    
    if (!skillNode) {
      logger.warn('Skill node not found', { skillName });
      return null;
    }
    
    const links = (cvGraph as { nodes: Node[], links?: Link[] }).links?.filter((l: Link) => l.to === skillNode.id) || [];
    const relatedNodes = links.map((l: Link) => cvGraph.nodes.find(n => n.id === l.from)).filter((n): n is Node => Boolean(n));
    
    const result = {
      skill: skillNode,
      projects: relatedNodes.filter((n: Node) => n.type === 'project'),
      roles: relatedNodes.filter((n: Node) => n.type === 'role'),
      companies: relatedNodes.filter((n: Node) => n.type === 'company')
    };
    
    logger.info('Skill details found', { skillId: skillNode.id, relatedCount: relatedNodes.length });
    return result;
  }

  async calculateMatch(requiredSkills: string[]) {
    if (requiredSkills.length === 0) {
      return {
        skillMatch: 0,
        matchedSkills: [],
        missingSkills: []
      };
    }

    const cvGraph = await this.loadCvGraph(true);
    if (!cvGraph || !cvGraph.nodes) {
      throw new Error('Invalid CV data structure');
    }
    
    const skillNodes = cvGraph.nodes.filter((n: Node) => ['skill', 'soft_skill'].includes(n.type));
    
    const allMySkills = new Set<string>();
    skillNodes.forEach((node: Node) => {
      if (node.meta?.level > 0) {
        if (node.label) allMySkills.add(node.label.toLowerCase());
        if (node.meta?.synonyms) {
          node.meta.synonyms.forEach((syn: string) => allMySkills.add(syn.toLowerCase()));
        }
      }
    });
    
    const matchedSkills = requiredSkills.filter((skill: string) => {
      const skillLower = skill.toLowerCase().trim();
      return Array.from(allMySkills).some((mySkill: string) => {
        const mySkillLower = mySkill.toLowerCase().trim();
        return mySkillLower === skillLower ||
               mySkillLower.includes(` ${skillLower} `) ||
               mySkillLower.startsWith(`${skillLower} `) ||
               mySkillLower.endsWith(` ${skillLower}`) ||
               skillLower.includes(` ${mySkillLower} `) ||
               skillLower.startsWith(`${mySkillLower} `) ||
               skillLower.endsWith(` ${mySkillLower}`);
      });
    });

    return {
      skillMatch: Math.round((matchedSkills.length / requiredSkills.length) * 100),
      matchedSkills,
      missingSkills: requiredSkills.filter(skill => !matchedSkills.includes(skill))
    };
  }

  async analyzeJob(jobText: string) {
    try {
      const requiredSkills = await this.extractSkills(jobText);
      const match = await this.calculateMatch(requiredSkills);
      
      return {
        requiredSkills,
        ...match,
        overallScore: match.skillMatch
      };
    } catch {
      return {
        requiredSkills: [],
        skillMatch: 0,
        matchedSkills: [],
        missingSkills: [],
        overallScore: 0
      };
    }
  }
}