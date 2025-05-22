## build from base image with pm2 pm2-plgin and git
FROM kaas-registry.cn-shenzhen.cr.aliyuncs.com/kaas/node:16.14.2-alpine3.15-buildimage AS builder
WORKDIR /app
RUN yarn config set registry https://registry.npmmirror.com/
COPY . .
RUN yarn install --frozen-lockfile && yarn build

## build with node image to run 
#FROM node:16.14.2-alpine3.15-baseimage AS runner
FROM kaas-registry.cn-shenzhen.cr.aliyuncs.com/kaas/node:16.14.2-alpine3.15-runimage AS runner
WORKDIR /app
RUN yarn config set registry https://registry.npmmirror.com/
COPY . .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

LABEL app="explore"
ARG VERSION
EXPOSE 11000
COPY --chmod=755 docker-entrypoint.sh ./
ENTRYPOINT ["./docker-entrypoint.sh"]
