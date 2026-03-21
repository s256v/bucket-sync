# -------- Stage 1: Build --------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# -------- Stage 2: Final Image --------
FROM node:20-alpine

WORKDIR /app

# Copy built app and node_modules from builder
COPY --from=builder /app ./

# Install git + SSH for cloning
RUN apk add --no-cache git openssh

# Optional volume for cloned repos
VOLUME ["/app/bitbucket_repos"]

# Set environment variables at runtime
# e.g. BITBUCKET_EMAIL, BITBUCKET_API_TOKEN

# Run the app
CMD ["node", "index.js"]