# AI BRD Architect

A comprehensive Business Requirements Document (BRD) management system powered by AI, designed for Indira IVF. This application streamlines the creation, verification, approval, and management of BRDs through an intelligent workflow system with AI-powered content generation and verification.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Workflow](#workflow)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

AI BRD Architect is a full-stack web application that automates and manages the Business Requirements Document lifecycle. It leverages Google's Gemini AI to:

- Generate clarifying questions based on project names
- Create comprehensive BRD content from user responses
- Perform AI-powered verification and auditing
- Refine BRD content based on feedback
- Manage multi-stage approval workflows

The system is specifically designed for Indira IVF's internal project management, with context-aware AI that understands healthcare/fertility clinic operations.

## ✨ Features

### Core Functionality

- **AI-Powered BRD Generation**: Automatically generates professional BRDs using Gemini AI
- **Interactive Question Flow**: Asks clarifying questions to understand project requirements
- **AI Verification & Auditing**: Comprehensive analysis of BRD quality, feasibility, and business value
- **Multi-Stage Approval Workflow**: Structured approval process with role-based access
- **Real-time Notifications**: Alert system for workflow updates and approvals
- **Version Control**: Track changes and maintain BRD history
- **PDF Export**: Generate professional PDF documents from BRDs
- **Role-Based Access Control**: Different permissions for Business, PM, Team Lead, CTO, and Admin roles

### Workflow Management

- **Status Tracking**: Visual workflow timeline showing BRD progress
- **Action Logs**: Complete audit trail of all actions and changes
- **Approval System**: Track approvals from different stakeholders
- **Rejection Handling**: Structured rejection process with feedback

### User Management

- **Authentication**: Secure login system with role-based access
- **User Roles**: Business, Project Manager, Team Lead, CTO, Admin
- **Admin Panel**: User management and system administration

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Components │  │   Services   │  │    Types     │      │
│  │              │  │              │  │              │      │
│  │ - BRDEditor  │  │ - apiService │  │ - BRD        │      │
│  │ - BRDList    │  │ - gemini     │  │ - BRDContent │      │
│  │ - LoginPage  │  │   Service    │  │ - User       │      │
│  │ - AdminPanel │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Routes    │  │   Services   │  │      DB      │      │
│  │              │  │              │  │              │      │
│  │ - /api/brds  │  │ - brdService │  │  PostgreSQL  │      │
│  │ - /api/users │  │ - userService│  │              │      │
│  │ - /api/alerts│  │ - alert      │  │  - users    │      │
│  │ - /api/config│  │   Service    │  │  - brds     │      │
│  └──────────────┘  └──────────────┘  │  - alerts   │      │
└───────────────────────────┬───────────└──────────────┘      │
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Google Gemini AI API                        │  │
│  │  - Content Generation                                 │  │
│  │  - BRD Auditing & Verification                        │  │
│  │  - Content Refinement                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
AI-BRD/
├── backend/                 # Backend server (Express.js)
│   ├── db/                  # Database configuration
│   │   ├── connection.js    # PostgreSQL connection pool
│   │   └── schema.sql       # Database schema
│   ├── routes/              # API route handlers
│   │   ├── brds.js          # BRD endpoints
│   │   ├── users.js         # User endpoints
│   │   └── alerts.js        # Alert endpoints
│   ├── services/            # Business logic
│   │   ├── brdService.js    # BRD operations
│   │   ├── userService.js   # User operations
│   │   └── alertService.js  # Alert operations
│   ├── scripts/             # Utility scripts
│   │   ├── init-db.js       # Database initialization
│   │   └── reset-users.js   # User reset utility
│   └── server.js            # Express server entry point
├── components/              # React components
│   ├── BRDEditor.tsx        # Main BRD editor component
│   ├── BRDList.tsx          # BRD list/sidebar
│   ├── LoginPage.tsx        # Authentication
│   ├── AdminPanel.tsx       # Admin interface
│   ├── BRDAuditPanel.tsx    # AI audit display
│   ├── WorkflowTimeline.tsx # Workflow visualization
│   ├── ActionLog.tsx        # Action history
│   ├── Header.tsx           # App header
│   └── Notification.tsx     # Notification system
├── services/                # Frontend services
│   ├── apiService.ts        # Backend API client
│   └── geminiService.ts     # Gemini AI integration
├── App.tsx                  # Main React application
├── index.tsx                # React entry point
├── types.ts                 # TypeScript type definitions
├── vite.config.ts           # Vite configuration
├── Dockerfile               # Docker container configuration
├── apprunner.yaml           # AWS App Runner configuration
└── package.json             # Frontend dependencies
```

## 🛠️ Tech Stack

### Frontend
- **React 19.2.3** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server
- **Tailwind CSS** - Styling (via CDN)
- **html2pdf.js** - PDF generation

### Backend
- **Node.js 20** - Runtime environment
- **Express.js 4.21.0** - Web framework
- **PostgreSQL** - Database
- **bcryptjs 2.4.3** - Password hashing
- **pg 8.12.0** - PostgreSQL client

### AI Integration
- **@google/genai 1.34.0** - Google Gemini AI SDK
- **Models Used**:
  - `gemini-3-flash-preview` - Content generation
  - `gemini-3-pro-preview` - BRD auditing

### Deployment
- **Docker** - Containerization
- **AWS App Runner** - Cloud deployment platform
- **AWS RDS** - Managed PostgreSQL database

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v12 or higher)
- **Docker** (optional, for containerized deployment)
- **Google Gemini API Key** (for AI features)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-BRD
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=brd_database
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend API URL (optional)
VITE_API_URL=http://localhost:3001/api
```

For production, these should be set in your deployment platform's environment variables.

## ⚙️ Configuration

### Database Configuration

The application uses PostgreSQL. Update the database connection settings in your `.env` file or environment variables.

### Gemini API Key

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file as `GEMINI_API_KEY`
3. For production (AWS App Runner), add it as an environment variable

### Frontend API URL

The frontend needs to know where the backend API is located:

- **Development**: Defaults to `http://localhost:3001/api`
- **Production**: Set `VITE_API_URL` to your deployed backend URL

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
createdb brd_database
```

### 2. Initialize Database Schema

```bash
cd backend
npm run db:init
```

This will:
- Create all required tables (users, brds, alerts)
- Set up indexes for performance
- Create default admin users
- Set up triggers for auto-updating timestamps

### 3. Default Users

The initialization script creates default users with password `admin123`:

| Email | Role | Password |
|-------|------|----------|
| `pm@brd.com` | Project Manager | `admin123` |
| `admin@brd.com` | Admin | `admin123` |
| `business@brd.com` | Business | `admin123` |
| `cto@brd.com` | CTO | `cto123` |
| `lead@brd.com` | Team Lead | `admin123` |

**⚠️ Important**: Change these passwords in production!

### 4. Reset Users (if needed)

```bash
cd backend
npm run db:reset-users
```

## 🔄 Workflow

### BRD Lifecycle

The BRD workflow consists of the following stages:

```
┌─────────┐
│  Draft  │ ──► User creates BRD with AI assistance
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ Pending Verification │ ──► AI automatically audits BRD
└────┬─────────────────┘
     │
     ▼
┌──────────┐
│ Verified │ ──► User reviews audit and proceeds
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ Business Review │ ──► Business team reviews
└────┬────────────┘
     │
     ▼
┌──────────────────┐
│ Lead & PM Review │ ──► Project Manager and Team Lead review
└────┬─────────────┘
     │
     ▼
┌──────────────┐
│ CTO Approval │ ──► Final approval from CTO
└────┬─────────┘
     │
     ▼
┌──────────┐
│ Approved │ ──► BRD is fully approved
└──────────┘
```

### Workflow Details

1. **Draft**: Initial creation phase
   - User provides project name
   - AI generates clarifying questions
   - User answers questions
   - AI generates BRD content
   - User can edit and refine

2. **Pending Verification**: AI audit phase
   - Automatically triggered when BRD is submitted
   - AI performs comprehensive analysis
   - Generates audit report with scores and recommendations

3. **Verified**: Post-audit phase
   - User reviews AI audit
   - Can proceed to approval workflow
   - Can request AI refinement based on feedback

4. **Business Review**: First approval stage
   - Business stakeholders review
   - Can approve or reject
   - Rejection requires feedback

5. **Lead & PM Review**: Technical review
   - Project Manager and Team Lead review
   - Technical feasibility assessment
   - Can approve or reject

6. **CTO Approval**: Final approval
   - CTO makes final decision
   - Can approve or reject
   - Final decision is recorded

7. **Approved/Rejected**: Final state
   - Approved: BRD is ready for implementation
   - Rejected: BRD can be revised and resubmitted

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Business** | Create BRDs, Review at Business stage, Approve/Reject |
| **Project Manager** | All Business permissions + Review at PM stage |
| **Team Lead** | All PM permissions + Review at Lead stage |
| **CTO** | All Lead permissions + Final approval |
| **Admin** | Full system access, User management |

## 📡 API Documentation

### Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `{YOUR_DEPLOYED_URL}/api`

### Authentication

Most endpoints require authentication. Include user credentials in the request body for login endpoints.

### Endpoints

#### Health Check

```http
GET /api/health
```

Returns server and database health status.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Configuration

```http
GET /api/config
```

Returns frontend configuration including API keys.

**Response:**
```json
{
  "geminiApiKey": "your-api-key",
  "hasGeminiKey": true
}
```

#### BRD Endpoints

##### Get All BRDs

```http
GET /api/brds
GET /api/brds?status=Draft
```

**Query Parameters:**
- `status` (optional): Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "projectName": "Project Name",
    "status": "Draft",
    "content": {...},
    "version": 1,
    ...
  }
]
```

##### Get BRD by ID

```http
GET /api/brds/:id
```

##### Create BRD

```http
POST /api/brds
Content-Type: application/json

{
  "projectName": "Project Name",
  "preparedBy": "User Name",
  "date": "2024-01-01",
  "content": {...}
}
```

##### Update BRD

```http
PUT /api/brds/:id
Content-Type: application/json

{
  "content": {...},
  "status": "Verified",
  ...
}
```

##### Delete BRD

```http
DELETE /api/brds/:id
```

##### Get BRD Statistics

```http
GET /api/brds/stats
```

**Response:**
```json
{
  "total": 10,
  "byStatus": {
    "Draft": 2,
    "Verified": 3,
    "Approved": 5
  }
}
```

#### User Endpoints

##### Login

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

##### Get All Users

```http
GET /api/users
```

##### Create User

```http
POST /api/users
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "role": "Business"
}
```

#### Alert Endpoints

##### Get All Alerts

```http
GET /api/alerts
GET /api/alerts?userId=uuid
GET /api/alerts?recent=24
```

##### Mark Alert as Read

```http
PATCH /api/alerts/:id/read
```

## 💻 Development

### Running Locally

#### 1. Start Database

Ensure PostgreSQL is running:

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services
```

#### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

#### 3. Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Development Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

**Backend:**
```bash
npm start        # Start production server
npm run dev      # Start with auto-reload
npm run db:init  # Initialize database
```

### Code Structure

- **Frontend**: React components in `components/`, services in `services/`
- **Backend**: Routes in `backend/routes/`, business logic in `backend/services/`
- **Types**: Shared TypeScript types in `types.ts`
- **Database**: Schema in `backend/db/schema.sql`, connection in `backend/db/connection.js`

## 🚢 Deployment

### Docker Deployment

#### Build Docker Image

```bash
docker build -t ai-brd-architect .
```

#### Run Container

```bash
docker run -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_NAME=brd_database \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e GEMINI_API_KEY=your-api-key \
  -e NODE_ENV=production \
  ai-brd-architect
```

### AWS App Runner Deployment

1. **Push to Repository**: Push your code to GitHub/CodeCommit
2. **Create App Runner Service**: 
   - Connect to your repository
   - Use `apprunner.yaml` for build configuration
   - Or use Dockerfile for container-based deployment
3. **Configure Environment Variables**:
   - `DB_HOST`: Your RDS endpoint
   - `DB_PORT`: 5432
   - `DB_NAME`: Your database name
   - `DB_USER`: Database username
   - `DB_PASSWORD`: Database password (use Secrets Manager)
   - `GEMINI_API_KEY`: Your Gemini API key (use Secrets Manager)
   - `NODE_ENV`: production
   - `PORT`: 8080
4. **Set Up Database**: 
   - Create RDS PostgreSQL instance
   - Run initialization script: `npm run db:init`
5. **Deploy**: App Runner will automatically build and deploy

### Environment-Specific Configuration

#### Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Database: Local PostgreSQL

#### Production
- Frontend: Served by Express from `/dist`
- Backend: Same server as frontend
- Database: AWS RDS PostgreSQL
- API Key: Fetched from backend at runtime

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` or `your-rds-endpoint.region.rds.amazonaws.com` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `brd_database` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-api-key` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `3001` (dev) or `8080` (prod) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Frontend API base URL | `http://localhost:3001/api` |

### Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use AWS Secrets Manager** for sensitive values in production
3. **Rotate API keys** regularly
4. **Use strong database passwords**
5. **Enable SSL/TLS** for database connections in production

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot GET /" Error

**Problem**: Root route not serving frontend

**Solution**: 
- Ensure `dist` folder exists after build
- Check that `NODE_ENV=production` is set
- Verify static file serving is enabled in `server.js`

#### 2. Database Connection Errors

**Problem**: Cannot connect to PostgreSQL

**Solution**:
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb brd_database`
- Run initialization: `npm run db:init`

#### 3. Gemini API Key Not Working

**Problem**: AI features not working

**Solution**:
- Verify `GEMINI_API_KEY` is set in environment variables
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- For production, ensure key is available via `/api/config` endpoint
- Check browser console for API errors

#### 4. Build Failures

**Problem**: Docker build or npm build fails

**Solution**:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires v20+)
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run build`

#### 5. Port Already in Use

**Problem**: Port 3001 or 8080 already in use

**Solution**:
- Change `PORT` in `.env`
- Kill process using port: `lsof -ti:3001 | xargs kill`
- Use different port for frontend in `vite.config.ts`

### Debugging Tips

1. **Check Logs**: 
   - Backend: Console output from `server.js`
   - Frontend: Browser console (F12)
   - Docker: `docker logs <container-id>`

2. **Verify Environment Variables**:
   ```bash
   # Backend
   node -e "require('dotenv').config(); console.log(process.env)"
   
   # Check specific variable
   echo $GEMINI_API_KEY
   ```

3. **Test Database Connection**:
   ```bash
   psql -h localhost -U your_user -d brd_database
   ```

4. **Test API Endpoints**:
   ```bash
   curl http://localhost:3001/api/health
   curl http://localhost:3001/api/config
   ```

## 👥 Contributors
Janhavi Yadav - janhavi2004yadav@gmail.com

