const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT;

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL,
  notification: process.env.NOTIFICATION_SERVICE_URL,
  ticket: process.env.TICKET_SERVICE_URL
};

module.exports = { PORT, SERVICES };