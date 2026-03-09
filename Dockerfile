# Stage 1: builder (still alpine is fine here – we throw it away)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # if you have a build step

# Stage 2: production – switch to slim Debian
FROM node:22-bookworm-slim

# Add these two lines for better security (common best practice)
USER node
WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder --chown=node:node /app /app

EXPOSE 3000
CMD ["node", "dist/index.js"]
