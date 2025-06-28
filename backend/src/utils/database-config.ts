export const getDatabaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(process.env.DATABASE_URL);
  
  // Add pooling parameters to connection string
  const poolParams = [
    'pool_min=2',
    'pool_max=10',
    'pool_timeout=60000',
    'idle_timeout=30000',
    'connect_timeout=10000'
  ].join('&');

  // Append pool parameters
  const separator = url.search ? '&' : '?';
  const pooledUrl = `${process.env.DATABASE_URL}${separator}${poolParams}`;

  return {
    url: pooledUrl,
    options: {
      logging: process.env.NODE_ENV !== 'production',
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false
    }
  };
};
