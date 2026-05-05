# Quick Start Guide - Frontend

## Installation

```bash
cd packages/frontend
npm install --no-workspaces
```

## Configuration

1. Create `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Credentials
- Email: `test@judiciary.ke`
- Password: `Test@123456`

## Building

```bash
npm run build
npm start
```

## Available Routes

### Public Routes
- `/` - Homepage
- `/login` - Sign in
- `/register` - Create account
- `/forgot-password` - Password recovery

### Protected Routes (require login)
- `/dashboard` - Main dashboard
- `/dashboard/cases` - Case management
- `/dashboard/research` - Legal research
- `/dashboard/tdr` - Tax dispute resolution
- `/dashboard/conveyancing` - Property transactions
- `/dashboard/board` - Board services
- `/dashboard/compliance` - Compliance monitoring
- `/dashboard/admin` - Administration (admin only)

## Features

### Authentication
- ✅ Login with email/password
- ✅ User registration
- ✅ Password reset
- ✅ Automatic token management
- ✅ Session management

### Case Management
- ✅ File new cases
- ✅ View cases
- ✅ Case details with documents
- ✅ Hearing schedule
- ✅ Status tracking

### Legal Research
- ✅ Semantic search
- ✅ Resource access
- ✅ Search history

### Tax Dispute Resolution
- ✅ Objection tracking
- ✅ Status management
- ✅ Timeline tracking
- ✅ Amount tracking

### Conveyancing
- ✅ Transaction management
- ✅ Status tracking
- ✅ Property details

### Board Services
- ✅ Meeting management
- ✅ Attendee tracking
- ✅ Document management

### Compliance
- ✅ Compliance scoring
- ✅ Alert management
- ✅ Audit trails
- ✅ Bias detection

### Administration
- ✅ User management
- ✅ System monitoring

## Troubleshooting

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --no-workspaces
```

### TypeScript errors
```bash
# Run type check
npm run type-check
```

## Development Tips

1. **Hot Reload**: Changes automatically refresh the browser
2. **Debug**: Use browser DevTools (F12)
3. **API Calls**: Check Network tab in DevTools
4. **Console**: Check for JavaScript errors

## API Integration

The frontend expects the backend to be running at `http://localhost:3001`.

### Key Endpoints Used
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /cases` - Get all cases
- `POST /cases` - Create new case
- `GET /cases/:id` - Get case details

## Performance

- Code splitting per route
- Image optimization
- CSS bundling with Tailwind
- Caching strategies built-in

## Security

- XSS protection
- CSRF ready
- JWT token handling
- Secure cookie storage
- HTTP-only cookies ready

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Next Steps

1. Start backend: `cd packages/backend && npm run dev`
2. Start AI service: `cd packages/ai-service && python -m uvicorn app.main:app --reload`
3. Start frontend: `cd packages/frontend && npm run dev`
4. Visit http://localhost:3000

## Need Help?

Check the [README.md](./README.md) for more detailed information.
