# Support Mate

## Table of Contents

- [📖 Introduction](#introduction)
- [✨ Features](#features)
- [🔧 Technologies Used](#technologies-used)
- [⬇️ Installation Instructions](#installation-instructions)
  - [🗄️ Database Infrastructure](#database-infrastructure)
  - [💻 Backend](#backend)
  - [🖥️ Frontend](#frontend)
- [📁 Complete Folder Structure](#complete-folder-structure)
- [🖼️ Project Screenshots](#project-screenshots)
- [💬 Questions](#questions)

### Introduction

Support Mate is a comprehensive customer support and ticket management system built with a microservices architecture. The system provides a complete solution for handling customer inquiries, managing support tickets, and facilitating communication between customers and support agents.

The system supports multiple user roles including users, customer supporters, leaders, employees of leaders and admins, with real-time chat capabilities, ticket tracking, and comprehensive reporting features.

### Features

**🎫 Ticket Management**

- Create and manage support tickets with detailed information
- File attachment support for tickets
- Ticket status tracking (OPEN, IN_REVIEW, IN_PROGRESS, CLOSED)
- Category-based ticket organization
- Product-specific ticket creation
- Priority-based ticket handling

**💬 Real-Time Chat System**

- WebSocket-based real-time messaging
- Live chat between customers and support agents
- Typing indicators and read status
- Chat history preservation
- Multi-language chat support (Turkish/English)
- File sharing in chat conversations

**👥 User Role Management**

- Multi-role system: Users, Customer Supporters, Leaders, Employees, Admins
- Role-based access control and permissions
- User authentication and authorization
- Google OAuth integration
- Email verification system

**📊 Dashboard & Reporting**

- Comprehensive dashboard statistics
- Real-time analytics and metrics
- User activity tracking
- Ticket performance reports
- Category and product statistics
- Export functionality for reports

**📧 Email Notifications**

- Automated email notifications for ticket creation
- Task assignment notifications
- Task completion alerts
- User registration confirmations
- Multi-language email templates (Turkish/English)

**✅ Task Management System**

- Create and assign tasks to employees
- Task priority levels (Low, Medium, High)
- Deadline management and tracking
- Task status monitoring (PENDING, IN_PROGRESS, DONE)
- Task-ticket relationship linking
- Progress tracking and updates

**📁 Category & Product Management**

- Dynamic category creation and management
- Product categorization system
- Multi-language category/product names
- Leader assignment to categories
- Hierarchical organization structure

**🔍 Advanced Search & Filtering**

- Ticket search by various criteria
- Category and product filtering
- Status-based filtering
- Date range filtering
- User-based ticket filtering

**🌐 Multi-Language Support**

- Turkish and English language support
- Localized user interface
- Multi-language email templates
- Dynamic language switching

**📱 Responsive Design**

- Mobile-friendly interface
- Modern Material-UI components
- Tailwind CSS styling
- Cross-browser compatibility

**🔒 Security Features**

- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- Secure file upload handling
- Bad word filtering system

**⚡ Performance & Scalability**

- Microservices architecture
- Docker containerization
- Load balancing support
- Caching mechanisms
- Database optimization

### Technologies Used

#### 🖥️ Frontend

- **React 19.1.0** - Modern JavaScript library for building user interfaces
- **Material-UI (MUI) 7.2.0** - React component library
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Socket.io Client 4.8.1** - Real-time communication
- **Chart.js & Recharts** - Data visualization
- **i18next** - Internationalization (Turkish/English)

#### 🧠 Backend

**API Gateway Service:**

- **Node.js & Express** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **HTTP Proxy Middleware** - Proxy requests to microservices

**Authentication Service:**

- **Node.js & Express** - Web application framework
- **MongoDB & Mongoose** - NoSQL database and ODM
- **Redis** - In-memory cache for sessions
- **JWT** - JSON Web Token authentication
- **Google OAuth** - Third-party authentication
- **gRPC** - High-performance RPC framework
- **Kafka** - Message streaming platform

**Ticket Service:**

- **Python 3.x** - Programming language
- **FastAPI** - Modern, fast web framework
- **MongoDB** - NoSQL database
- **Redis** - Caching and session management
- **gRPC** - High-performance RPC framework
- **Kafka** - Message streaming platform
- **Socket.io** - Real-time communication

**Notification Service:**

- **Node.js & Express** - Web application framework
- **Kafka** - Message streaming platform
- **Nodemailer** - Email sending

#### 📊 Database & Infrastructure

- **MongoDB** - Primary NoSQL database for user data, tickets, and chat messages
- **Redis** - In-memory cache for session management and real-time data
- **Kafka** - Distributed streaming platform for event-driven architecture
- **Docker & Docker Compose** - Containerization and orchestration
- **gRPC** - High-performance RPC between services
- **REST APIs** - HTTP-based API communication
- **WebSocket/Socket.io** - Real-time bidirectional communication

## Installation Instructions

### Database Infrastructure

The following database and messaging infrastructure must be installed first for the system to work:

#### 1. MongoDB Installation

MongoDB is used as the main database of the system. User data, tickets, and chat messages are stored here.

```bash
cd mongodb
docker-compose up -d
```

```bash
# sample .env values

# MongoDB service configuration
MONGO_PORT=27017
MONGO_ROOT_USERNAME=yourusername
MONGO_ROOT_PASSWORD=yourpassword

# Mongo Express configuration
MONGO_EXPRESS_PORT=5000
MONGO_EXPRESS_ADMIN_USERNAME=youradminusername
MONGO_EXPRESS_ADMIN_PASSWORD=youradminpassword
MONGO_EXPRESS_BASICAUTH_USERNAME=youradminauthusername
MONGO_EXPRESS_BASICAUTH_PASSWORD=youradminauthpassword


```

**Access Information:**

- **MongoDB**: localhost:27017
- **MongoDB Express**: http://localhost:5000
  - Username: admin
  - Password: admin123

#### 2. Redis Installation

Redis is used for session management and caching.

```bash
cd redis
docker-compose up -d
```

```bash
# sample .env values

# Redis service settings
REDIS_PORT=6379
REDIS_CONTAINER_NAME=redis_service

# Redis Commander (admin interface) settings
REDIS_COMMANDER_PORT=5002
REDIS_COMMANDER_CONTAINER_NAME=redis_commander
REDIS_COMMANDER_HOSTS=local:redis_service:6379
```

**Access Information:**

- **Redis**: localhost:6379
- **Redis Commander**: http://localhost:5002

#### 3. Kafka Installation

Kafka is used for event-driven communication between microservices.

```bash
cd kafka
docker-compose up -d
```

```bash
# sample .env values

# Zookeeper settings
ZOOKEEPER_PORT=2181
ZOOKEEPER_CONTAINER_NAME=zookeeper

# Kafka settings
KAFKA_PORT=9092
KAFKA_CONTAINER_NAME=kafka
KAFKA_BROKER_ID=1
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1

# Kafka UI settings
KAFKA_UI_PORT=5008
KAFKA_UI_CONTAINER_NAME=kafka-ui
KAFKA_UI_CLUSTER_NAME=local
KAFKA_UI_BOOTSTRAPSERVERS=kafka:9092
KAFKA_UI_ZOOKEEPER=zookeeper:2181
```

**Access Information:**

- **Kafka**: localhost:9092
- **Kafka UI**: http://localhost:5008
- **Zookeeper**: localhost:2181

#### Installation Order

1. **MongoDB** - Main database
2. **Redis** - Cache and session management
3. **Kafka** - Event streaming platform

Wait for these services to start completely before starting the backend services.

### Backend

Follow the steps below to install backend services:

#### API Gateway Service

```bash
cd backend/api-gateway
docker compose up --build -d
```

```bash
# sample .env values
PORT=9000
AUTH_SERVICE_URL=http://auth_service:8080
NOTIFICATION_SERVICE_URL=http://notification_service:8082
TICKET_SERVICE_URL=http://ticket_service:8086
CORS_ORIGIN=http://localhost:3000

NODE_ENV=development
```

#### Authentication Service

```bash
cd backend/auth-service
docker compose up --build -d
```

```bash
# sample .env values
PORT=8080
MONGO_URI=mongodb://yourusername:yourpassword@localhost:27017/auth-service?authSource=admin
NODE_ENV=development
REDIS_URL=redis://127.0.0.1:6379


# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=my_dummy_refresh_secret_123456
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

KAFKA_BROKERS=localhost:9092

# your frontend url
WEBSITE_URL=http://localhost:3000

# your application's logs language (en/tr)
DEFAULT_LOCALE=en

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

EMAIL_CODE_LENGTH=6 # confirmation password length
EMAIL_CODE_EXPIRATION_MINUTES=10
```

#### Ticket Service

```bash
cd backend/ticket-service
docker compose up --build -d
```

```bash
# sample .env values
DEFAULT_LANGUAGE=tr


MONGO_URI=mongodb://yourusername:yourpassword@mongodb_service:27017/ticket-service?authSource=admin
REDIS_URL=redis://127.0.0.1:6379

KAFKA_BROKERS=kafka:9092

JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=my_dummy_refresh_secret_123456
JWT_ALGORITHM=HS256

PORT=8086

GRPC_PORT=50051

AUTH_GRPC_HOST=auth_service
AUTH_GRPC_PORT=50051
```

#### Notification Service

```bash
cd backend/notification-service
docker compose up --build -d
```

```bash
# sample .env values
PORT=8082
KAFKA_BROKERS=kafka:9092

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=yourmail
MAIL_PASS= #your application password value
MAIL_FROM=yourmail
MAIL_DISPLAY_NAME="Support Mate"

NODE_ENV=development
```

### Frontend

To install the frontend application:

```bash
cd frontend/support-mate-frontend
npm install
npm start
```

```bash
# sample .env values
REACT_APP_API_BASE_URL=http://localhost:9000


# Google OAuth Configuration , same with backend
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret
```

### Complete Folder Structure

```
support-mate/
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── ticket-service/
│   └── notification-service/
├── frontend/
│   └── support-mate-frontend/
├── kafka/
├── mongodb/
├── redis/
└── README.md
```

### Project Screenshots

<div>
  <img src="screenshots/1.png" alt="Login" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/2.png" alt="Signup" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/3.png" alt="Dashboard" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/4.png" alt="Product Management Screen" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/5.png" alt="User Ticket Requests Panel" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/6.png" alt="Customer Supporter Ticket Requests Panel" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/7.png" alt="User Chat Screen" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/8.png" alt="Customer Supporter Chat Screen" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/9.png" alt="Ticket Create After Chat" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/10.png" alt="Kanban Board for following task status" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/11.png" alt="Leader Ticket Requests Panel" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/12.png" alt="Leader Task Details" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/13.png" alt="Leader Chat Details" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
  <img src="screenshots/14.png" alt="Employee Kanban Board" style="display: block; margin-bottom: 16px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
</div>

## Questions

For any questions or support, please contact: **cemlevent54@gmail.com**
