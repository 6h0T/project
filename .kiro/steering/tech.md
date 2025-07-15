# Tech Stack

## Framework & Runtime
- **Next.js 13.5.1** - React framework with App Router
- **React 18.2.0** - UI library
- **TypeScript 5.2.2** - Type safety and development experience
- **Node.js** - Runtime environment

## Database & Backend
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Database-level security policies
- **Supabase Auth** - Authentication and user management

## Styling & UI
- **Tailwind CSS 3.3.3** - Utility-first CSS framework
- **Radix UI** - Headless UI components for accessibility
- **Lucide React** - Icon library
- **next-themes** - Dark/light mode support
- **tailwindcss-animate** - Animation utilities

## Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Security & Authentication
- **bcryptjs** - Password hashing
- **jose** - JWT handling
- **speakeasy** - 2FA/TOTP implementation
- **BotId** - Anti-bot captcha protection

## Development Tools
- **ESLint** - Code linting (builds ignore linting errors)
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
supabase start       # Start local Supabase
supabase db reset    # Reset local database
supabase gen types   # Generate TypeScript types
```

## Build Configuration
- Images are unoptimized for static export compatibility
- Webpack configured to handle Node.js modules in client-side code
- ESLint errors ignored during builds for faster deployment