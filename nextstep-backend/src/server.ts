import { app, corsOptions } from './app';
import mongoose from 'mongoose';
import { config } from './config/config';
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socket_auth';
import { initSocket } from './services/socket_service';
import { importJobQuizzesToDb } from './services/job_quizzes_service';

// Configure environment variables, and allow expand.
dotenvExpand.expand(dotenv.config());

// Start app while verifying connection to the database.
const port = config.app.port();
const listener = app.listen(port, async() => {
    mongoose.connect(config.mongo.uri())
    const db = mongoose.connection;
    db.on('error', (error) => console.error(error));
    db.once('open', () => console.log("Connected to DataBase"));
    await importJobQuizzesToDb();
    console.log(`Example app listening at http://localhost:${port}`);
});

const socketListener = new Server(listener, { cors: corsOptions });

socketListener.use((socket, next) => socketAuthMiddleware(socket, next));
initSocket(socketListener).then();
