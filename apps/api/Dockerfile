FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY packages/shared ./packages/shared
RUN npm run --workspace=@siena/shared build

COPY apps/api ./apps/api
RUN cd apps/api && npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "--workspace=@siena/api", "dev"]
