const express = require('express');
const app = express();

const path = require("path");
const fs = require("fs")
const axios = require('axios');
const port = 3000;

const key = "b1af733907eb45a3a9bf606d7834a5dd";
const endpoint = "https://westeurope.api.cognitive.microsoft.com/";
const modelId = "LP-CARR-AUT_Neural"

const { createXML } = require("./xml-constructor");

app.use(express.json());

// Route to handle document recognition requests
app.post('/recognize-document', async (req, res) => {

    filepath = path.join(__dirname, "test_files/document.pdf")
    fs.readFile(filepath, { encoding: 'base64' }, async (err, encodedFile) => {

        if (err) {
            throw err;
        }

        // POST request, useful for fetching the API key for the actual request
        // {endpoint}/documentintelligence/documentModels/{modelId}:analyze?api-version=2024-02-29-preview
        // HEADER :'Ocp-Apim-Subscription-Key': key
        try {
            const keyFetchResponce = await axios.post(`${endpoint}/documentintelligence/documentModels/${modelId}:analyze?api-version=2024-02-29-preview`,
                {
                    base64Source: encodedFile
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': key
                    }
                });

            apimId = keyFetchResponce.headers["apim-request-id"];
            const data = await makeCall(apimId);

            cleanedData = cleanData(data);

            xml = createXML("ciao", cleanedData)

            res.sendFile(path.join(__dirname, "ciao.xml"));

        } catch (error) {
            console.error('Error recognizing document:', error);
            res.status(500).send(`${error}`);
        }
    });
});

async function makeCall(apimId) {

    const response = await axios.get(`${endpoint}documentintelligence/documentModels/${modelId}/analyzeResults/${apimId}?api-version=2024-02-29-preview`, { headers: { 'Ocp-Apim-Subscription-Key': key } });
    let data = response.data;

    if (data.status == "succeeded") return data;
    console.log(`chiamata -> ${data.status}`);

    return new Promise((resolve) => {
        setTimeout(async () => {
            ret = await makeCall(apimId);
            resolve(ret);
        }, 4000);
    });
}

function cleanData(data) {
    cleanedData = data.analyzeResult.documents[0].fields;
    for (obj in cleanedData) {
        delete cleanedData[obj].boundingRegions;
        delete cleanedData[obj].spans;
        delete cleanedData[obj].confidence;
    }

    delete cleanedData.ricambi.type;

    for (ric in cleanedData.ricambi.valueArray) {
        ric = cleanedData.ricambi.valueArray[ric];
        for (row in ric) {
            if (typeof ric[row] != 'object') {
                delete ric[row];
                continue;
            }

            for (field in ric[row]) {
                delete ric[row][field].boundingRegions;
                delete ric[row][field].spans;
                delete ric[row][field].confidence;
            }
        }
    }

    if (cleanedData.manodopera_carrozzeria_prezzo.valueNumber !==
        cleanedData.manodopera_meccanica_prezzo.valueNumber) {
        console.log("No");
        return "no";
    }

    if (cleanedData.manodopera_meccanica_ore.content == undefined) cleanedData.manodopera_meccanica_ore.valueNumber = 0;

    tot_ore_man = (cleanedData.manodopera_carrozzeria_ore.valueNumber +
        cleanedData.manodopera_meccanica_ore.valueNumber);

    netto_man = (tot_ore_man * cleanedData.manodopera_carrozzeria_prezzo.valueNumber).toFixed(2);

    ricRow_man = {
        "valueObject": {
            "categorico": {
                "type": "string",
                "valueString": "#MAN#",
                "content": "#MAN#"
            },
            "descrizione": {
                "type": "string",
                "valueString": "manodopera",
                "content": "manodopera"
            },
            "quantita": {
                "type": "number",
                "valueNumber": tot_ore_man,
                "content": tot_ore_man.toString()
            },
            "prezzo_netto": {
                "type": "number",
                "valueNumber": netto_man,
                "content": netto_man.toString().replace(",", ".")
            },
            "sconto": {
                "type": "number",
            }
        }
    }

    if (cleanedData.materiale_di_consumo.content != undefined) {

        ricRow_mc = {
            "valueObject": {
                "categorico": {
                    "type": "string",
                    "valueString": "#MC#",
                    "content": "#MC#"
                },
                "descrizione": {
                    "type": "string",
                    "valueString": "Materiale di consumo",
                    "content": "Materiale di consumo"
                },
                "quantita": {
                    "type": "number",
                    "valueNumber": 100,
                    "content": "1,00"
                },
                "prezzo_netto": {
                    "type": "number",
                    "valueNumber": cleanedData.materiale_di_consumo.valueNumber,
                    "content": cleanedData.materiale_di_consumo.content
                },
                "sconto": {
                    "type": "number"
                }
            }
        }

        cleanedData.ricambi.valueArray.push(ricRow_mc)
    }

    cleanedData.ricambi.valueArray.push(ricRow_man)

    return cleanedData
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
