const { getServiceUrl } = require('../utils/gatewayConfigHelper.js');
const axios = require('axios');

const services = [
  {
    name: 'authService',
    url: getServiceUrl('authService')
  },
  {
    name: 'userService',
    url: getServiceUrl('userService')
  }
];

async function checkServiceHealth(service) {
  try {
    const res = await axios.get(`${service.url}/health`);
    return {
      name: service.name,
      url: service.url,
      status: res.status === 200 ? 'up' : 'down',
      details: res.data || null
    };
  } catch (err) {
    return {
      name: service.name,
      url: service.url,
      status: 'down',
      details: err.message
    };
  }
}

async function getGatewayHealth() {
  const results = await Promise.all(services.map(checkServiceHealth));
  return {
    gateway: {
      status: 'up',
      timestamp: new Date().toISOString()
    },
    services: results
  };
}

module.exports = { getGatewayHealth, services };
