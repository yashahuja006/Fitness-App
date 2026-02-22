# Technology Stack & Build System

## Current Status
**Technology stack selected and implemented** - Core frontend infrastructure is now in place with Next.js, TypeScript, and Tailwind CSS.

## Development Framework
- **Kiro Framework**: Used for specification-first development workflow
- **IDE**: VS Code with Kiro Agent MCP enabled
- **Documentation**: Markdown-based specifications and steering documents

## Implemented Technology Stack

### Frontend
- **Framework**: Next.js 16.1.4 with React 19.2.3
- **Language**: TypeScript 5.x
- **Build tooling**: Turbopack (Next.js built-in)
- **CSS framework**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **State management**: React hooks (Context API for global state when needed)

### Backend (Planned)
- **Runtime environment**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **API design**: RESTful APIs

### AI/ML Services (Planned)
- **Computer Vision**: TensorFlow.js + MediaPipe
- **Conversational AI**: Google Gemini API
- **Speech Processing**: Web Speech API

### Development Tools
- **Package manager**: npm
- **Testing framework**: Jest + React Testing Library (to be configured)
- **Property-based testing**: Fast-check (to be configured)
- **Linting**: ESLint with Next.js configuration
- **Formatting**: Prettier
- **Type checking**: TypeScript compiler

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking

# Testing (to be implemented)
npm test            # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run test:pbt    # Run property-based tests
```

## Build Process

### Development Build
1. Next.js development server with Turbopack
2. Hot module replacement for fast development
3. TypeScript compilation on-the-fly
4. Tailwind CSS compilation with JIT mode

### Production Build
1. Next.js optimized production build
2. Static site generation where applicable
3. Code splitting and optimization
4. Asset optimization and compression

## Project Structure

```
fitness-app-website/
├── .kiro/                          # Kiro framework configuration
│   ├── specs/                      # Feature specifications
│   └── steering/                   # Project guidance documents
├── src/                            # Source code
│   ├── app/                        # Next.js app directory (pages and layouts)
│   ├── components/                 # React components
│   │   └── ui/                     # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries and configurations
│   ├── types/                      # TypeScript type definitions
│   └── utils/                      # Utility functions
├── public/                         # Static assets
├── .env.example                    # Environment variables template
└── Configuration files             # package.json, tsconfig.json, etc.
```

## Environment Configuration

### Required Environment Variables
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# AI Services
GEMINI_API_KEY=your_gemini_api_key
```

## Development Workflow
1. ✅ Complete requirements specification
2. ✅ Create detailed design documents
3. ✅ Select appropriate technology stack
4. ✅ Initialize project with chosen technologies
5. 🔄 Implement following specification-driven approach
6. 🔄 Iterative development with testing and validation

## Next Implementation Steps
1. Configure testing framework (Jest + React Testing Library + Fast-check)
2. Set up Firebase integration
3. Create Express.js backend server
4. Implement AI/ML service integrations
5. Build core application features following the task breakdown