FROM nginx:alpine

# Copy your project files into the Nginx web directory
COPY . /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
