const path = require("path");
const fs = require("fs");
const ftp = require("basic-ftp");

exports.cleanData = (data) => {
    cleanedData = data.analyzeResult.documents[0].fields;
    for (obj in cleanedData) {
        delete cleanedData[obj].boundingRegions;
        delete cleanedData[obj].spans;
        delete cleanedData[obj].confidence;
    }

    if (!cleanedData.manodopera_carrozzeria_prezzo) { throw Error("Errore nel parsing") }

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
        throw new Error("prezzi manodopere mismatchano")
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

    try {
        cleanedData.ricambi.valueArray.push(ricRow_man)
    } catch (error) {
        throw error;
    }

    return cleanedData
}

exports.uploadToFTP = async (file_name) => {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        // Replace with your FTP server details
        await client.access({
            host: "151.0.189.41",
            user: "iasprogaia",
            password: "GaIa2020",
            secure: false // Set to true if using FTPS
        });

        // Replace with the local file path and the remote path where you want to upload
        const localFilePath = path.join(__dirname, `output_xml/${file_name}`);
        const remoteFilePath = `/LEASEPLAN/carrozzeria/import/${file_name}`;

        // Upload the file
        await client.uploadFrom(localFilePath, remoteFilePath);
    } catch (err) {
        console.error(err);
    }

    client.close();
}

/**
 * Checks if a practice is already been elaborated, if so returns true, false otherwise
 * 
 * @param {string} invoice_number 
 * @returns boolean
 */
exports.isDone = (invoice_number) => {
    fs.readdir("output_xmls", (err, files) => {
        for (file_name in files) if (file_name === invoice_number + ".xml") return true
    });

    return false;
}

exports.listDone = async () => {
    return await fs.readdirSync(path.join(__dirname, "output_xml"));
}