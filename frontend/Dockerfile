FROM node:23.5-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY . .

RUN ls

RUN pwd

RUN printenv

# Install dependencies
RUN npm install

# Set environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_DISABLE_PERF_MONITOR=false

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_DISABLE_PERF_MONITOR=${NEXT_PUBLIC_DISABLE_PERF_MONITOR}

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]