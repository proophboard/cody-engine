FROM nginx:alpine

COPY packages/fe/nginx.conf /etc/nginx/nginx.conf

COPY dist/packages/fe /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]