import express from 'express';
import cors from 'cors';
import { authRoutes } from './src/modules/auth';
import chatRoutes from './src/modules/chat/chat.route';
import fileRoutes from './src/modules/file/file.route';
import path from 'path';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Healthcare Chatbot API is running' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/file', fileRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
