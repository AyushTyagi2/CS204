# Use Debian-based Node.js image (better compatibility)
FROM node:18-bullseye

# Install dependencies for C++ executables
RUN apt-get update && apt-get install -y g++ make libc-dev

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files, including executables
COPY . .
RUN sh run.sh
# Ensure executables have permission to run
RUN chmod +x /app/src/executables/1.out /app/src/executables/myRISCVSim.out

# Build Next.js project
RUN npm run build

# Expose port 3000 for Next.js
EXPOSE 3000

# Start Next.js server (use built version)
CMD ["npm", "run", "start"]
