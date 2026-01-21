# =====================================================
# Multi-stage Dockerfile for AI BRD Architect
# Builds React frontend + Express backend in one container
# =====================================================

# =====================================================
# Stage 1: Build Frontend React Application
# =====================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package.json package-lock.json ./

# Install frontend dependencies (including devDependencies for build)
RUN npm ci

# Copy frontend source code
COPY index.html index.tsx vite.config.ts tsconfig.json ./
COPY components ./components
COPY services ./services
COPY types.ts ./

# Build frontend application (outputs to ./dist)
RUN npm run build

# =====================================================
# Stage 2: Install Backend Dependencies
# =====================================================
FROM node:20-alpine AS backend-deps

WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install only production dependencies for backend
RUN npm ci --only=production && \
    npm cache clean --force

# =====================================================
# Stage 3: Production Image
# =====================================================
FROM node:20-alpine AS production

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create app user for security (non-root)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy backend dependencies from backend-deps stage
COPY --from=backend-deps --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules

# Copy backend source code
COPY --chown=nodejs:nodejs backend ./backend

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port (App Runner will map this)
EXPOSE 8080

# Health check (optional - App Runner also has its own health checks)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Use dumb-init to handle signals properly (important for graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start the backend server (which will also serve frontend static files in production)
CMD ["node", "backend/server.js"]