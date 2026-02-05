import nlp from 'compromise';
import type { Node, NodeType} from "../data/cv-graph";

export class NLPSkillExtractor {
  private skillMappings: Map<string, string> = new Map();

  constructor(skillNodes: Node[]) {
    this.buildSkillMappings(skillNodes);
  }

  private buildSkillMappings(skillNodes: Node[]) {
    skillNodes.forEach(node => {
      if (!node.label) return;
      
      const mainSkill = node.label;
      
      // Add main skill
      this.skillMappings.set(mainSkill.toLowerCase(), mainSkill);
      
      // Add synonyms
      if (node.meta?.synonyms) {
        node.meta.synonyms.forEach((synonym: string) => {
          this.skillMappings.set(synonym.toLowerCase(), mainSkill);
        });
      }
      
      // Add semantic variations for soft skills
      if (node.type === 'soft_skill' as NodeType) {
        this.addSemanticVariations(mainSkill, node);
      }
    });
  }

  private addSemanticVariations(skill: string, node: Node) {
    // Use semantic_variations from CV graph if available
    if (node.meta?.semantic_variations) {
      node.meta.semantic_variations.forEach((variation: string) => {
        this.skillMappings.set(variation.toLowerCase(), skill);
      });
      return;
    }

    // Generate semantic variations using NLP patterns
    this.generateSemanticVariations(skill);
  }

  private generateSemanticVariations(skill: string) {
    const skillDoc = nlp(skill);
    const variations = new Set<string>();

    // Use Compromise's morphological analysis with correct API
    const nouns = skillDoc.nouns();
    const adjectives = skillDoc.adjectives();
    const verbs = skillDoc.verbs();
    
    // Generate noun variations
    if (nouns.length > 0) {
      variations.add(nouns.toPlural().text());
      variations.add(nouns.toSingular().text());
    }
    
    // Generate adjective variations
    if (adjectives.length > 0) {
      variations.add(adjectives.toComparative().text());
      variations.add(adjectives.toSuperlative().text());
    }
    
    // Generate verb variations
    if (verbs.length > 0) {
      variations.add(verbs.toPastTense().text());
      variations.add(verbs.toPresentTense().text());
      variations.add(verbs.toGerund().text());
    }

    // Add semantic patterns for soft skills
    const baseWords = skillDoc.match('#Noun').out('array');
    baseWords.forEach((noun: string) => {
      variations.add(`${noun} skills`);
      variations.add(`${noun} abilities`);
      variations.add(`strong ${noun}`);
      variations.add(`good ${noun}`);
    });

    // Add to mappings
    variations.forEach(variation => {
      if (variation.trim() && variation !== skill.toLowerCase()) {
        this.skillMappings.set(variation.toLowerCase(), skill);
      }
    });
  }

  extractSkills(text: string): string[] {
    const doc = nlp(text);
    const foundSkills = new Set<string>();

    // First, check for direct semantic variation matches in the full text
    const normalizedText = text.toLowerCase();
    for (const [key, skill] of this.skillMappings.entries()) {
      // For short keys (3 chars or less), require word boundaries to avoid false positives
      if (key.length <= 3) {
        const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normalizedText)) {
          foundSkills.add(skill);
        }
      } else if (normalizedText.includes(key)) {
        foundSkills.add(skill);
      }
    }

    // Extract skill-related phrases using NLP patterns
    const skillPhrases = [
      ...doc.match('#Adjective+ #Noun+').out('array'), // "Strong problem-solving"
      ...doc.match('#Noun+ skills?').out('array'),     // "Communication skills"
      ...doc.match('#Verb+ #Preposition+ #Noun+').out('array'), // "work in team"
      ...doc.match('experience #Preposition+ #Noun+').out('array'), // "experience in C#"
      ...doc.match('#Noun+ #Noun+').out('array'),      // "team work"
    ];

    // Direct skill matching
    skillPhrases.forEach(phrase => {
      const normalizedPhrase = phrase.toLowerCase().trim();
      
      // Check direct mapping
      if (this.skillMappings.has(normalizedPhrase)) {
        foundSkills.add(this.skillMappings.get(normalizedPhrase)!);
      }
      
      // Check partial matches for compound phrases (more restrictive)
      for (const [key, skill] of this.skillMappings.entries()) {
        // Only match if the key is a significant portion of the phrase
        if (key.length >= 3 && normalizedPhrase.includes(key)) {
          // Ensure it's a word boundary match, not just substring
          const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(normalizedPhrase)) {
            foundSkills.add(skill);
          }
        }
      }
    });

    // Extract technical terms (likely skills)
    const technicalTerms = doc.match('#Acronym').out('array'); // C#, SQL, etc.
    technicalTerms.forEach((term: string) => {
      const normalizedTerm = term.toLowerCase();
      if (this.skillMappings.has(normalizedTerm)) {
        foundSkills.add(this.skillMappings.get(normalizedTerm)!);
      }
    });

    // Extract programming languages and frameworks
    const techPatterns = doc.match('(#Noun|#Acronym)+ (#Noun|#Acronym)*').out('array');
    techPatterns.forEach((pattern: string) => {
      const normalizedPattern = pattern.toLowerCase();
      if (this.skillMappings.has(normalizedPattern)) {
        foundSkills.add(this.skillMappings.get(normalizedPattern)!);
      }
    });

    return Array.from(foundSkills);
  }
}