// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'development' | 'production';
}

const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://your-function-app-name.azurewebsites.net/api/processor',
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development'
};

export default config; 