import { neru } from 'neru-alpha';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.NERU_APP_PORT;
const APP_ID = process.env.API_APPLICATION_ID;
const {
	PROJECT_API_KEY, PROJECT_API_SECRET, INSTANCE_SERVICE_NAME, REGION
} = process.env;

const instanceState = neru.getGlobalState();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
});

// ------------------------------------------------------------------------

import axios from 'axios';
import Util from 'util';
import OpenTok from 'opentok';
const opentok = new OpenTok(PROJECT_API_KEY, PROJECT_API_SECRET);

const APP_BASE_URL = `https://${INSTANCE_SERVICE_NAME}.${REGION.split(".")[1]}.runtime.vonage.cloud`;

app.get('/_/health', async (req, res) => {
	res.sendStatus(200);
});

app.get('/up', async (req, res, next) => {
	res.send('hello world').status(200);
});

app.get('/', (req, res, next) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/init', async (req, res, next) => {
	try {
	let { name, roomName } = req.body;

	if (!name && !roomName) {
		throw({ code: 401, message: "name and roomName needed!" });
	}

	let room = await findRoom({ roomName, createIfNotFound: true });
	console.log("room", room);
	if (!room.sessionId) {
		const generateSessionFunction = Util.promisify(generateSession);
		let sessionId = await generateSessionFunction();
		room = await saveSessionId(roomName, sessionId);
	}

	let token = await generateToken(room.sessionId);
	console.log(`Token created`);

	res.json({
		apiKey: PROJECT_API_KEY,
		sessionId: room.sessionId,
		roomId: room.id,
		roomName,
		token
	});

	} catch (error) {
		await errorHandler(res, error);
	}
});

// ------------------------------------------------------------------------

app.get('/admin/rooms', async (req, res, next) => {
	const key = `${APP_ID}:rooms`;
	let rooms = await instanceState.get(key);
	res.json({rooms}).status(200);
});

app.get('/admin/roomscleanup', async (req, res, next) => {
	const key = `${APP_ID}:rooms`;
	let rooms = await instanceState.set(key, []);
	res.json({rooms}).status(200);
});

// ------------------------------------------------------------------------

async function errorHandler(res, error) {
	console.error(error);
	if (typeof(error) === "string") {
		error = { message: error };
	}
	if (!error.code) {
		error.code = 500;
	}
	res.status(error.code).send(error.message);
}

async function findRoom({ roomName, roomId, sessionId, createIfNotFound }) {
	if (!createIfNotFound) createIfNotFound = false;

	const key = `${APP_ID}:rooms`;
	let rooms = await instanceState.get(key);
	let room = null;
	// console.log("key", key);
	// console.log("rooms", rooms);

	if (!rooms) {
		rooms = [];
	}

	for(let i = 0; i < rooms.length; i++) {
		if (
			(roomName && rooms[i].name === roomName) ||
			(sessionId && rooms[i].sessionId === sessionId) ||
			(roomId && rooms[i].id === roomId)
		) {
			room = rooms[i];
		}
	}

	if (!room && createIfNotFound) {
		const ts = new Date();
		room = {
			id: uuidv4(),
			name: roomName,
			sessionId: "",
			createdAt: ts.toISOString()
		};
		rooms.push(room);
		await instanceState.set(key, rooms);
		console.log("Room created and saved");
	}

	return room;
}

function generateSession(callback) {
	opentok.createSession({ mediaMode: "routed" }, (err, session) => {
		if (err) {
			console.error(err);
			return callback(err);
		}

		console.log(`Session created`);
		callback(null, session.sessionId);
	});
}

async function saveSessionId(roomName, sessionId) {
	const key = `${APP_ID}:rooms`;
	let rooms = await instanceState.get(key);
	let room = null;

	for(let i = 0; i < rooms.length; i++) {
		if (rooms[i].name === roomName) {
			rooms[i].sessionId = sessionId;
			room = rooms[i];
			await instanceState.set(key, rooms);
		}
	}

	if (!room) {
		throw("Invalid room name");
	}

	return room;
}

async function generateToken(sessionId, role) {
	if (role) {
		return opentok.generateToken(sessionId, { role });
	} else {
		return opentok.generateToken(sessionId);
	}
}
