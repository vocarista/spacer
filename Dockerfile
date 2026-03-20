# Multi-stage build for backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY backend/src ./src

# Production backend stage
FROM node:18-alpine AS backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=backend-builder --chown=nextjs:nodejs /app .

# Create data directory
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 5001

ENV NODE_ENV=production

CMD ["node", "src/app.js"]

# Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm ci

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# Production frontend stage
FROM node:18-alpine AS frontend

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=frontend-builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/public ./public
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=frontend-builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=frontend-builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
