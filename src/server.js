import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import app from './app.js';
import { connectDb } from './config/db.js';

dotenv.config();

const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

async function startServer() {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
