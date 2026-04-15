FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Create uploads and logs directories
RUN mkdir -p uploads logs && \
    chmod -R 777 uploads logs

# Set non-root user (good security practice, though volumes might have write permission issues)
# USER node

EXPOSE 5000

CMD ["npm", "start"]
