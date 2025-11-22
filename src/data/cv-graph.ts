export type NodeType = "person" | "role" | "company" | "project" | "skill" | "education" | "stack";
type LinkType = "worked_on" | "used" | "studied_at" | "at_company" | "alias_of" | "includes";

interface CVGraph {
  nodes: Node[];
  links: Link[];
}

export interface Node {
  id: string;
  type: NodeType;
  label?: string;
  name?: string;
  start?: string;
  end?: string;
  // vector?: number[];              // TODO: Add when implementing semantic search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

export interface Link {
  from: string;
  to: string;
  type: LinkType;
  weight?: number;               // Relationship strength for graph traversal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

export const CV_GRAPH: CVGraph = {
  nodes: [
    // Person
    { id: "me", type: "person", name: "Developer" },
    
    // Roles
    { id: "senior-dev", type: "role", label: "Senior Developer", start: "2021-01", end: "2024-01", meta: { domain: "Fintech", years: 3 } },
    
    // Skills with synonyms
    { id: "react", type: "skill", label: "React", meta: { level: 5, years: 5, category: "Frontend", synonyms: ["ReactJS", "React.js", "JavaScript framework", "JS framework"] } },
    
    // Stacks
    { id: "mern", type: "stack", label: "MERN", meta: { skills: ["MongoDB", "Express", "React", "Node.js"] } },
  ],
  links: [
    // Person worked roles
    { from: "me", to: "senior-dev", type: "worked_on", weight: 0.9 },
    
    // Roles used skills (weighted by proficiency)
    { from: "senior-dev", to: "react", type: "used", weight: 0.9 },
    
    // Stacks include skills
    { from: "mern", to: "react", type: "includes", weight: 1.0 },
  ]
};