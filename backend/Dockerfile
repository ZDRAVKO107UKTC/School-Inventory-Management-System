FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev && npm cache clean --force

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start:combined"]
