FROM node:18

# Instala o OpenSSL necessário para o Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3333
CMD ["npm", "run", "dev"]
