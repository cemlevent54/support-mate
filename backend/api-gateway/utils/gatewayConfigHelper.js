const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function getServiceUrl(serviceName) {
  const configPath = path.join(__dirname, '../gateway.config.yml');
  const file = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(file);
  if (
    config &&
    config.serviceEndpoints &&
    config.serviceEndpoints[serviceName] &&
    config.serviceEndpoints[serviceName].url
  ) {
    return config.serviceEndpoints[serviceName].url;
  }
  throw new Error(`Service URL for '${serviceName}' not found in gateway.config.yml`);
}

module.exports = { getServiceUrl }; 