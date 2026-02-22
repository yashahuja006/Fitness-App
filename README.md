# AI-Powered Fitness Web Application

A comprehensive web-based fitness platform that leverages artificial intelligence and machine learning to provide personalized fitness guidance, real-time form correction, diet planning, and interactive workout assistance.

## 🚀 Features

- **AI Form Correction**: Real-time pose detection and form feedback using TensorFlow.js and MediaPipe
- **Personalized Diet Plans**: AI-generated meal plans based on user metrics and fitness goals
- **Intelligent Chatbot**: Conversational AI assistant powered by Gemini API for exercise guidance
- **Voice Assistant**: Speech-enabled workout guidance and voice commands
- **Progress Tracking**: Comprehensive analytics and progress monitoring
- **Social Features**: Leaderboards and social sharing capabilities
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.1.4 with React 19.2.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Build Tool**: Turbopack (Next.js built-in)

### Backend (Planned)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage

### AI/ML Services
- **Computer Vision**: TensorFlow.js + MediaPipe
- **Conversational AI**: Google Gemini API
- **Speech**: Web Speech API

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier
- **Type Checking**: TypeScript compiler

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fitness-app-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Firebase configuration and API keys in `.env.local`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
fitness-app-website/
├── .kiro/                          # Kiro framework configuration
│   ├── specs/                      # Feature specifications
│   └── steering/                   # Project guidance documents
├── src/
│   ├── app/                        # Next.js app directory
│   ├── components/                 # React components
│   │   └── ui/                     # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   ├── types/                      # TypeScript type definitions
│   └── utils/                      # Utility functions
├── public/                         # Static assets
└── Configuration files
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use kebab-case for file and directory names
- Use PascalCase for React components

### Component Structure
- Place reusable UI components in `src/components/ui/`
- Use forwardRef for components that need ref forwarding
- Export components from index files for clean imports

### Type Safety
- Define interfaces for all data structures
- Use strict TypeScript configuration
- Avoid `any` types - use `unknown` or specific types

### Styling
- Use Tailwind CSS utility classes
- Create custom utilities in `src/utils/cn.ts` for className merging
- Follow responsive design principles

## 🚧 Current Status

This project is currently in the **implementation phase** following a specification-first development approach using the Kiro framework. 

**Completed:**
- ✅ Project setup and configuration
- ✅ Next.js with TypeScript and Tailwind CSS
- ✅ Basic UI components (Button, Input, Card)
- ✅ Project structure and development environment
- ✅ ESLint, Prettier, and TypeScript configuration

**Next Steps:**
- 🔄 Firebase integration and authentication
- 🔄 Express.js backend server setup
- 🔄 AI form correction system
- 🔄 Diet plan generation
- 🔄 Chatbot integration

## 📋 Requirements

- Node.js 18+ 
- npm 9+
- Modern web browser with camera access (for AI form correction)

## 🤝 Contributing

This project follows a specification-first development approach. All features are thoroughly planned in the `.kiro/specs/` directory before implementation.

1. Review the specifications in `.kiro/specs/fitness-app/`
2. Follow the task breakdown in `tasks.md`
3. Ensure all code passes linting and type checking
4. Test thoroughly before submitting changes

## 📄 License

This project is part of a specification-first development workflow using the Kiro framework.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS