import cors from "cors";
import csurf from "csurf";
import createDebug from "debug";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import http from "http";
import https from "https";
import createError from "http-errors";
import logger from "morgan";
import passport from "passport";
import config from "./config/config.js";
import initializePassport from "./config/passport.js";
import initializeSocket from "./config/socket.js";
import initializeDB from "./db/db.js";
import errorHandler from "./middlewares/error.middleware.js";
import routers from "./routes/createRouter.js";
import authRouter from "./routes/api/v1/auth.js";
import cookieParser from 'cookie-parser';

import fs from "fs";
const debug = createDebug("server:server");
const app = express();
// const server = http.createServer(app); 
var options = {
  key: fs.readFileSync("./.cert/cert.key"),
  cert: fs.readFileSync("./.cert/cert.crt"),
};
const server = https.createServer(options, app);
initializeDB();
initializeSocket(app, server);
initializePassport(passport);

app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: ["https://127.0.0.1:3000", "https://localhost:3000", "https://127.0.0.1:3200", "https://localhost:3200"],
  })
);
app.set("trust proxy", 1);
app.use(logger("dev"));
app.use(helmet());
app.use(hpp());

app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());
// app.use('/api', routers);
app.use("/api", routers());

app.use((req, res, next) => {
  next(createError(404));
});

app.use(csurf());
app.use(errorHandler);

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind =
    typeof config.server.port === "string"
      ? "Pipe " + config.server.port
      : "Port " + config.server.port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
    default:
      throw error;
  }
});

server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;

  debug("Listening on " + bind);
});

server.listen(config.server.port, () => {
  console.log(`# Application is listening on port ${config.server.port} #`);
});
