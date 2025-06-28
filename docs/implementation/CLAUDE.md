# Indecisive Wear Official - Project Configuration

## Project Overview
**Name**: Indecisive Wear Official Store
**Type**: Next.js 15 E-commerce Application
**Location**: `/home/w3bsuki/MATRIX/projects/current/indecisive-wear-store/`

## Tech Stack
- **Framework**: Next.js 15.2.4
- **React**: v19
- **Styling**: Tailwind CSS + Radix UI
- **Forms**: React Hook Form + Zod validation
- **Language**: TypeScript
- **Package Manager**: pnpm

## Agent Roles & Responsibilities

### Orchestrator
- Coordinate all development tasks
- Manage agent communication
- Track progress in PROJECT_STATUS.md
- Ensure consistent architecture

### Frontend Agent
- Work in `/app` and `/components` directories
- Utilize Radix UI components from shadcn/ui
- Implement responsive, accessible UI
- Follow existing component patterns
- Use Tailwind CSS for styling

### Backend Agent
- Implement API routes in `/app/api`
- Handle authentication & authorization
- Integrate payment processing
- Manage data fetching and mutations

### Database Agent
- Design schema for products, users, orders
- Set up database connections
- Optimize queries
- Handle migrations

### Testing Agent
- Write tests for components and APIs
- Ensure accessibility compliance
- Test payment flows
- Maintain >80% coverage

### DevOps Agent
- Configure deployment
- Set up CI/CD
- Monitor performance
- Handle environment variables

## Development Guidelines

1. **Component Structure**: Follow shadcn/ui patterns
2. **Styling**: Use Tailwind utilities, avoid custom CSS
3. **State Management**: Use React hooks and context
4. **Forms**: Always use React Hook Form + Zod
5. **API Routes**: Use Next.js App Router conventions
6. **TypeScript**: Strict mode, no any types

## Current Sprint Focus
- [ ] Analyze existing codebase structure
- [ ] Set up database (PostgreSQL/Supabase?)
- [ ] Design product schema
- [ ] Create product listing page
- [ ] Implement shopping cart
- [ ] Add user authentication

## Important Files
- `/app/layout.tsx` - Root layout
- `/components/ui/` - Radix UI components
- `/lib/utils.ts` - Utility functions
- `/styles/globals.css` - Global styles

## Git Configuration
- Remote: https://github.com/w3bsuki/indecisive-wear-official.git
- Branch: main
- Commit style: Conventional commits

## Notes
- Using pnpm - always use `pnpm install` not npm
- Follow existing code patterns
- Keep components small and reusable
- Prioritize mobile-first design