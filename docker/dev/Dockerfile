# Wally — Frontend Dev Container
# Vue 3 + Vite dev server
# node_modules는 compose의 컨테이너 전용 볼륨(/app/node_modules)에 유지됨

FROM node:22-slim

WORKDIR /app

EXPOSE 5176
CMD ["sh", "-c", "npm install && npm run dev"]
