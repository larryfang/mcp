# Use Node LTS
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose your port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
