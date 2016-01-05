FROM node:0.12.9
COPY . /
RUN ["npm", "install"]
EXPOSE 4005
CMD ["node", "app.js"]
