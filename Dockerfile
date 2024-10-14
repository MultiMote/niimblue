# Use the official Node.js image as the base image
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /build

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Yarn already installed
#RUN npm install -g yarn

# Install project dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Start a new stage for serving the application
FROM node:22-alpine AS runner

# Install a simple static server
RUN npm install -g serve



# Copy only the build artifacts from the previous stage
COPY --from=builder /build/dist ./dist
COPY dev-cert ./dist/dev-cert

# Change permissions of the copied files
RUN chown -R nobody:nogroup /dist/

USER nobody

WORKDIR /dist



# Expose the port the app runs on
EXPOSE 7600

# Command to run the app
CMD ["serve", "-s", "/dist", "-l", "7600", "--ssl-cert", "/dist/dev-cert/cert.pem", "--ssl-key", "/dist/dev-cert/key.pem"]
