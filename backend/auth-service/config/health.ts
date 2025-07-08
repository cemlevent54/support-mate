import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redisClient from './cache';

export async function healthCheck(req: Request, res: Response) {
  // Database durumu
  let dbStatus = 'down';
  let dbInfo: any = {};
  if (mongoose.connection.readyState === 1) {
    dbStatus = 'up';
    dbInfo = {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      user: mongoose.connection.user,
      readyState: mongoose.connection.readyState,
    };
  }

  // Redis durumu
  let redisStatus = 'down';
  try {
    const pong = await redisClient.ping();
    if (pong === 'PONG') redisStatus = 'up';
  } catch {
    redisStatus = 'down';
  }

  // Bellek ve uptime
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    app: {
      node: process.version,
      env: process.env.NODE_ENV,
    },
    database: {
      status: dbStatus,
      ...dbInfo,
    },
    redis: {
      status: redisStatus,
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    uptimeSeconds: uptime,
  });
}
