FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs ai.mjs providers.mjs ./
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8091
USER node
CMD ["node","server.mjs"]
