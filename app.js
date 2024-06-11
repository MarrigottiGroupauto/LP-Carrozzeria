import express from "express";
const app = express()

import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {ciao} from "./azure-interface.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/pages/index/index.html"));
});

app.listen(PORT, () => console.log(`Server partito, porta ${PORT}`));