FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
