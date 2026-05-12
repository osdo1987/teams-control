# Stage 1: Build the React application
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# We will use a custom nginx config from the root nginx folder
# but for now, we just build the image.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
