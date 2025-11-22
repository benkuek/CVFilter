# Smart CV Platform

A Next.js application that stores CV data in a graph format and intelligently matches skills against job advertisements using regex, fuzzy matching, and NLP techniques.

## Project Purpose

This platform transforms traditional CV data into a searchable graph structure, enabling:
- **Intelligent Job Matching**: Automatically identify relevant skills from job ads
- **Skill Synonym Recognition**: Match variations like "C#", "C sharp", "csharp" 
- **Experience Quantification**: Track skill levels and years of experience
- **Relationship Mapping**: Connect skills, roles, companies, and projects
- **Future NLP Integration**: Semantic search via vector embeddings

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Design Reference

### Frontend
- **Framework:** React via Next.js
- **Deployment:** Provider agnostic static web application, target Vercel hosting for testing.
- **Styling:** Tailwind CSS

### Authentication
- **Deployment:** Provider agnostic API routes via Next.js serverless functions
- **Protocol:** OpenID Connect (OIDC)
- **Library:** openid-client in API routes
- **Session:** JWT cookies (secure, httpOnly, stateless)
- **Provider:** Auth0

### Security
- Stateless JWT tokens
- Secure cookie configuration
- CSRF protection via SameSite cookies
- PKCE for OAuth2 authorization code flow

### Authorization
- **Storage:** Local database for user roles (provider agnostic).
- **Role Mapping:** OIDC user ID (sub) to local roles on login
- **Integration:** Middleware for route protection and role checks
- **Decision Logic:** Simple role-based access control
- **Decision Point:** API routes and page components
- **Role Management:** Admin API routes for role assignment
- **Session Enhancement:** Include roles in JWT claims after local lookup
- **Migration Ready:** Authorization logic independent of OIDC provider

### Code Architecture (Key Files - DO NOT DUPLICATE)
- **`src/lib/jwt.ts`** - JWT creation, verification, session handling (EXISTING)
- **`src/lib/auth/`** - Role management, storage adapters (EXISTING)
- **`middleware.js`** - Route protection, auth headers (EXISTING)
- **`src/components/job-matcher-service.ts`** - Client-side CV matching (EXISTING)
- **`src/data/cv-graph.ts`** - CV data structure and graph (EXISTING)

optionally install
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### CV Graph Data Model
- **Storage Options:** Local TypeScript for development, DynamoDB for production
- **Data Structure:** Graph-based CV with nodes and links
- **Job Matching Capabilities:**
  - **Regex Matching**: Direct skill name matching in job descriptions
  - **Fuzzy Matching**: Synonym arrays for skill variations ("React", "ReactJS", "React.js")
  - **NLP Ready**: Vector field prepared for semantic search implementation
  - **Skill Quantification**: Level (0-5) and years of experience per skill

#### Node Structure
- `id`: Unique identifier
- `type`: Node category (person, role, skill, company, project, education)
- `label`: Display name
- `meta.synonyms`: Array of skill variations for matching
- `meta.level`: Skill proficiency (0-5)
- `meta.years`: Years of experience
- `meta.category`: Skill grouping (Language, Frontend, Database, etc.)
- `vector`: Future semantic search embeddings

#### Link Structure
- `from`: Source node ID
- `to`: Target node ID  
- `type`: Relationship (worked_on, used, studied_at, at_company)
- `weight`: Connection strength for graph traversal
