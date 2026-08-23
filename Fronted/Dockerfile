FROM node:22-alpine
WORKDIR /app/Fronted
COPY Fronted/package*.json ./
RUN npm ci
COPY Fronted/ .
COPY Backend/ /app/Backend/
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
