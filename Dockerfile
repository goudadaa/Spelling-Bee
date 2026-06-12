# ==============================================================================
# Multi-stage production-ready Dockerfile for Spelling Bee Wizard application
# ==============================================================================

# --- Stage 1: Build & Bundling ---
FROM node:20-alpine AS builder

# Set running directory
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application source code
COPY . .

# Run compilation & bundler tasks
# - Generates ready-to-serve client-side static bundle inside `./dist`
# - Bundles Express server into a standalone `./dist/server.cjs` file using esbuild
RUN npm run build


# --- Stage 2: Runtime Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Ensure correct Node production flags
ENV NODE_ENV=production
ENV PORT=4567

# Copy package references and install production-only packages
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# Copy compiled resources from builder stage
COPY --from=builder /app/dist ./dist

# Create persistent storage folder for JSON storage database file
RUN mkdir -p /app/data

# Define volume for mounting local systems securely
VOLUME [ "/app/data" ]

# Expose app port 4567
EXPOSE 4567

# Start server bundle
CMD [ "npm", "run", "start" ]
