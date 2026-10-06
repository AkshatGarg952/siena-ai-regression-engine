FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/

RUN npm install

COPY packages/shared ./packages/shared
RUN npm run --workspace=@siena/shared build

COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx prisma generate

COPY apps/api ./apps/api
COPY apps/worker ./apps/worker

CMD ["npm", "run", "--workspace=@siena/worker", "dev"]
