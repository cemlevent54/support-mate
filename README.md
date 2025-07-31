# Support Mate

## Table of Contents

- [📖 Introduction](#introduction)
- [✨ Features](#features)
  - [🎫 Ticket Management](#ticket-management)
  - [💬 Real-Time Chat System](#real-time-chat-system)
  - [👥 User Role Management](#user-role-management)
  - [📊 Dashboard & Reporting](#dashboard--reporting)
  - [📧 Email Notifications](#email-notifications)
  - [✅ Task Management System](#task-management-system)
  - [📁 Category & Product Management](#category--product-management)
  - [🔍 Advanced Search & Filtering](#advanced-search--filtering)
  - [🌐 Multi-Language Support](#multi-language-support)
  - [📱 Responsive Design](#responsive-design)
  - [🔒 Security Features](#security-features)
  - [⚡ Performance & Scalability](#performance--scalability)
- [🔧 Technologies Used](#technologies-used)
  - [🖥️ Frontend](#frontend)
  - [🧠 Backend](#backend)
    - [API Gateway Service](#api-gateway-service)
    - [Authentication Service](#authentication-service)
    - [Ticket Service](#ticket-service)
    - [Notification Service](#notification-service)
  - [📊 Database & Infrastructure](#database--infrastructure)
- [⬇️ Installation Instructions](#installation-instructions)
  - [📚 Backend](#backend-instructions)
  - [📚 Frontend](#frontend-instructions)
  - [🧪 Unit Tests](#testing-backend-services)
  - [📁 Complete Folder Structure](#complete-folder-structure)
- [🖼️ Example Screenshots](#example-screenshots)


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
- **Apache Kafka** - Distributed streaming platform for event-driven architecture
- **Docker & Docker Compose** - Containerization and orchestration
- **gRPC** - High-performance RPC between services
- **REST APIs** - HTTP-based API communication
- **WebSocket/Socket.io** - Real-time bidirectional communication


