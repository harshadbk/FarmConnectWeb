FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN mkdir -p /app/upload/images

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "index.js"]