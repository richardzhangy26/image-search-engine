FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Command to run the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
