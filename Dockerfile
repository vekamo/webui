# Install dependencies only when needed
FROM node:20-alpine AS deps
WORKDIR /webui

# Install dependencies based on lockfile
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /webui

COPY --from=deps /webui/node_modules ./node_modules
COPY . .

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_DISABLE_ESLINT=1
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app
RUN yarn build

# Production image, copy only necessary files
FROM node:20-alpine AS runner
WORKDIR /webui

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /webui/public ./public
COPY --from=builder /webui/.next ./.next
COPY --from=builder /webui/node_modules ./node_modules
COPY --from=builder /webui/package.json ./package.json

# Expose the default Next.js port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
