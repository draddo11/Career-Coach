# Use Node.js LTS
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all source files
COPY . .

# Build TypeScript (if you have tsconfig)
RUN npm run build

# Expose the port your app uses
EXPOSE 8080

# Run the app
CMD ["node", "dist/index.js"]
