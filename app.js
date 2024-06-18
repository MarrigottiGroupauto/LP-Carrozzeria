const express = require('express');
const app = express();

const path = require("path");
const fs = require("fs")
const port = 3000;

const { analyze } = require("./azure-interface.js");
const { listDone } = require('./data-management.js');

app.use(express.json());

/** -------- GET PAGES ------- */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "web_page/index.html"));
});

/** -------- POST APIS ------- */
app.post("/upload", async (req, res) => {

    if (!req.query.id) res.status(400).send("inserisci il codice");

    let id = req.query.id;
    if (!fs.existsSync(`uploads/${id}`)) fs.mkdir(`uploads/${id}`, console.log);

    let file_name = req.query.name;

    let data = [];

    req.on("data", (chunk) => {
        data.push(chunk);
    });

    req.on("end", () => {
        let fileData = Buffer.concat(data);

        fs.writeFile(
            path.join(__dirname, `uploads/${id}/${file_name}`),
            fileData,
            "base64",
            (err) => {
                if (err) {
                    res.statusCode = 500;
                }
            }
        );
    });

    res.sendStatus(202);
});

/** -------- GET DATA FETCHER ------- */
app.get('/analyze', (req, res) => {
    if (!req.query.id) res.status(400).send("inserisci il codice");
    id = req.query.id;

    console.log("chiamata iniziata da " + id);

    fs.readdir(path.join(__dirname, `uploads/${id}/`), async (err, files) => {
        if (err) console.error(err);

        analyze(files, id).then(passed_auts => {
            fs.rmdir(`uploads/${id}`, _ => { console.log(`rimosso ${id}`) })

            console.log("import completato");

            res.status(202).send(passed_auts);
        });
    });
});

app.get('/elaborated-aut', (_, res) => {
    listDone().then(data => res.send(data));
});

app.use('/page', express.static(path.join(__dirname, 'web_page')));
app.use('/xmls', express.static(path.join(__dirname, 'output_xml')));

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
