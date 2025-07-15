# Project Structure

## Next.js App Router Structure

```
app/                          # Next.js 13+ App Router
├── api/                      # API routes
├── (game-routes)/            # Game-specific pages
│   ├── counter-strike/
│   ├── mu-online/
│   ├── perfect-world/
│   ├── ragnarok-online/
│   └── silkroad/
├── admin/                    # Admin dashboard
├── dashboard/                # User dashboard
├── login/                    # Authentication pages
├── registro/                 # Registration page
├── globals.css               # Global styles
├── layout.tsx                # Root layout
└── page.tsx                  # Home page (Lineage II)
```

## Core Directories

### Components (`/components`)
- **UI Components**: Reusable React components
- **Game-specific**: `GameLayout.tsx`, `ServerCard.tsx`
- **Auth**: `AuthModal.tsx`, authentication forms
- **Admin**: Administrative interface components
- **UI Library**: `/ui` folder with shadcn/ui components
- **MagicUI**: `/magicui` folder with enhanced UI components

### Hooks (`/hooks`)
- Custom React hooks for data fetching and state management
- `useAuth.ts` - Authentication state
- `useServers.ts` - Server data management
- `useAdmin.ts` - Admin functionality

### Library (`/lib`)
- **Database**: `database.ts`, `supabase.ts` - Database connections
- **Utilities**: `utils.ts` - Helper functions
- **Validation**: Server validation and filtering logic
- **Auth**: Simple authentication utilities

### Configuration Files
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui configuration

## File Naming Conventions

- **Pages**: `page.tsx` (App Router convention)
- **Layouts**: `layout.tsx` (App Router convention)
- **Components**: PascalCase (e.g., `ServerCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useServers.ts`)
- **Utilities**: camelCase (e.g., `serverFilters.ts`)
- **API Routes**: `route.ts` (App Router convention)

## Import Patterns

- Use `@/` alias for absolute imports from project root
- Components imported from `@/components/`
- Hooks imported from `@/hooks/`
- Utilities imported from `@/lib/`

## Database Structure

- **Supabase**: PostgreSQL with Row Level Security
- **Tables**: `user_profiles`, `banners`, server tables
- **SQL Files**: `/supabase` directory for migrations and setup
- **Type Safety**: Generated types from Supabase schema

## Asset Organization

- **Public**: Static assets in `/public` directory
- **Images**: Game logos, banners, icons
- **Email Templates**: HTML/text templates in `/email-templates`