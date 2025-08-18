FROM node:18

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json, pnpm-lock.yaml, and .env
COPY package.json pnpm-lock.yaml* .env* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the backend code
COPY . .

# Expose the port the backend uses
EXPOSE 8001

# Command will be overridden by docker-compose.yml
CMD ["pnpm", "start"]