# Contributing to Chess960

Thank you for your interest in contributing to Chess960! This document provides guidelines for contributing to our open-source chess platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm 8+
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/chess960.git
   cd chess960
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   pnpm db:setup
   pnpm db:seed
   ```

5. **Start Development**
   ```bash
   pnpm dev
   ```

## Contributing Process

### 1. Choose an Issue
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to claim it
- Wait for maintainer approval

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes
- Follow our coding standards
- Write tests for new functionality
- Update documentation as needed

### 4. Test Your Changes
```bash
pnpm test
pnpm lint
pnpm type-check
```

### 5. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code changes
- `test:` for tests
- `chore:` for maintenance

## Coding Standards

### TypeScript
- Use strict TypeScript
- Prefer interfaces over types
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React
- Use functional components with hooks
- Prefer `const` over `let`
- Use proper prop types
- Keep components small and focused

### CSS/Styling
- Use Tailwind CSS classes
- Follow the design system
- Use consistent spacing and colors
- Mobile-first responsive design

### File Organization
```
src/
├── components/     # Reusable components
├── pages/         # Next.js pages
├── hooks/         # Custom hooks
├── lib/           # Utility functions
├── types/         # TypeScript types
└── styles/        # Global styles
```

## Testing

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

### E2E Tests
```bash
pnpm test:e2e
```

### Test Coverage
```bash
pnpm test:coverage
```

## Pull Request Process

### 1. Update Your Branch
```bash
git fetch origin main
git rebase origin/main
```

### 2. Push Your Changes
```bash
git push origin your-branch-name
```

### 3. Create Pull Request
- Use the PR template
- Link to related issues
- Add screenshots if applicable
- Request review from maintainers

### 4. Address Feedback
- Respond to review comments
- Make requested changes
- Keep the PR up to date

## Areas for Contribution

### 🎮 Game Features
- New game modes
- Tournament systems
- Analysis tools
- Mobile responsiveness

### 🎨 UI/UX
- Design improvements
- Accessibility
- Performance optimization
- User experience

### 🔧 Backend
- API improvements
- Database optimization
- Real-time features
- Security enhancements

### 📱 Mobile
- Progressive Web App
- Mobile-specific features
- Offline functionality

### 🧪 Testing
- Unit tests
- Integration tests
- E2E tests
- Performance tests

## Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Create issues for bugs or feature requests
- **Discord**: Join our community Discord (link in README)

## Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Invited to our contributors' Discord channel

## License

By contributing, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0.

---

Thank you for contributing to Chess960! 🎉