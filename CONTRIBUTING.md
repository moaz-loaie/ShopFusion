# Contributing to ShopFusion

## Development Process

1. Fork the repository
2. Create a feature branch using conventional branch naming:
   - `feature/*` for new features
   - `fix/*` for bug fixes
   - `refactor/*` for code improvements
   - `chore/*` for maintenance tasks

### Branch Naming Examples

```bash
feature/seller-management
fix/seller-activation
refactor/admin-dashboard
chore/update-dependencies
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `style`: Changes that do not affect the meaning of the code
- `test`: Adding missing tests or correcting existing tests
- `docs`: Documentation only changes
- `chore`: Changes to the build process or auxiliary tools

Examples:

```bash
feat(admin): add seller bulk actions
fix(auth): resolve token expiration issue
test(api): improve coverage for seller endpoints
```

## Code Style

- Follow the ESLint configuration
- Run Prettier before committing
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- Write tests for new features

## Testing

Ensure all tests pass before submitting a PR:

```bash
# Client tests
cd client
npm run test
npm run test:coverage

# Server tests
cd server
npm run test
npm run test:coverage
```

Coverage requirements:

- Minimum 80% overall coverage
- 100% coverage for critical paths

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Update CHANGELOG.md
4. Ensure CI passes
5. Request review from maintainers

## Local Development Setup

1. Install dependencies:

   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd server
   npm install
   ```

2. Set up environment:

   ```bash
   # Copy environment files
   cp .env.example .env # Do this in both client and server directories
   ```

3. Set up database:

   ```bash
   cd server
   npm run db:migrate
   npm run db:seed
   ```

4. Start development servers:

   ```bash
   # Start server
   cd server
   npm run dev

   # Start client
   cd client
   npm run dev
   ```

## Questions?

Feel free to open an issue for:

- Bug reports
- Feature requests
- Documentation improvements
- General questions

Please check existing issues before opening a new one.
