# Healthcare Chatbot

A full-stack healthcare chatbot application with React frontend and Express backend.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
healthcare-chatbot/
├── backend/
│   ├── src/
│   │   └── index.ts          # Backend entry point
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── main.tsx          # Frontend entry point
    │   ├── App.tsx           # Main App component
    │   ├── index.css         # Global styles
    │   └── App.css           # App-specific styles
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## Features

- ✅ Basic Express server with TypeScript
- ✅ React frontend with Vite
- ✅ Tailwind CSS for styling
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Proxy configuration for API calls

## Next Steps

- [ ] Implement chat functionality
- [ ] Add user authentication
- [ ] Integrate healthcare AI services
- [ ] Add database connectivity
- [ ] Implement real-time messaging
