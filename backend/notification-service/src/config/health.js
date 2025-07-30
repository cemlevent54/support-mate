

export async function healthCheck(req, res) {
  
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
    
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    uptimeSeconds: uptime,
  });
} 