FROM mhart/alpine-node:base


WORKDIR /app
ADD ./node_modules ./node_modules

EXPOSE 8080

CMD ["node", "./node_modules/@ecmal/runtime/bin/cli.js", "@vendor/project/server"]