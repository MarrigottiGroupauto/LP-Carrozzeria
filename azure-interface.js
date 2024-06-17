const path = require("path")
const fs = require("fs")
const axios = require('axios');

const { cleanData, uploadToFTP, isDone } = require("./data-management");
const { createXML } = require("./xml-constructor")

const key = "b1af733907eb45a3a9bf606d7834a5dd";
const endpoint = "https://westeurope.api.cognitive.microsoft.com/";
const modelId = "LP-CAR-AUT_Neural_V3"

/**
 * Manages the requests and on fulfill it creates the XML file 
 * regarding the requested file
 *  
 * @param {string} file_name the name of the file that has to be analized
 */
exports.analyzeSingle = async (file_name, id) => {

    return new Promise((resolve, reject) => {

        filepath = path.join(__dirname, `uploads/${id}/${file_name}`)
        try {

            fs.readFile(filepath, { encoding: 'base64' }, async (err, encodedFile) => {

                if (err) {
                    console.error(err);
                    throw err;
                }

                /**
                 * POST request, useful for fetching the API key for the actual request 
                 * {endpoint}/documentintelligence/documentModels/{modelId}:analyze?api-version=2024-02-29-preview 
                 * HEADER :'Ocp-Apim-Subscription-Key': key
                 */
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

                let apimId = keyFetchResponce.headers["apim-request-id"];
                const data = await makeCall(apimId);

                try {
                    let cleanedData = cleanData(data);
                    if (isDone(cleanedData.numero_autorizzazione.content)) { throw new Error("Pratica già esportata") }

                    createXML(cleanedData.numero_autorizzazione.content, cleanedData);
                    // uploadToFTP(`${cleanedData.numero_autorizzazione.content}.xml`);

                    resolve(cleanedData.numero_autorizzazione.content);
                } catch (error) {
                    console.error(error)
                }
            });

        } catch (error) {
            console.error(error)
            reject()
        }

    });

}

/**
 * 
 * Makes the call to Azure Docuement AI using the apimID fetched from previeus call
 * than returns the responce i form of JSON object
 * 
 * @param {*} apimId the id needed as jey for make the actual call
 * @returns JSON object 
 */
async function makeCall(apimId) {

    const response = await axios.get(`${endpoint}documentintelligence/documentModels/${modelId}/analyzeResults/${apimId}?api-version=2024-02-29-preview`, { headers: { 'Ocp-Apim-Subscription-Key': key } });
    let data = response.data;

    console.log(`chiamata -> ${data.status}`);
    if (data.status == "succeeded") return data;

    return new Promise((resolve) => {
        setTimeout(async () => {
            ret = await makeCall(apimId);
            resolve(ret);
        }, 4000);
    });
}

exports.analyze = async (files, id) => {

    return new Promise((resolve, reject) => {

        let file = files.pop();

        console.log(`Analizzando ${file}`);

        exports.analyzeSingle(file, id).then(data => {
            fs.rename(path.join(__dirname, `uploads/${id}/${file}`), path.join(__dirname, `archive/${file}`), async err => {
                if (err) console.log(err);

                if (files.length == 0) { resolve(); return; }
                exports.analyze(files, id);
            });
        }).catch(err => {
            console.log("error" + err);
            fs.rename(path.join(__dirname, `uploads/${id}/${file}`),
                path.join(__dirname, `errors/${file}`),
                a => { console.log(file + " messo nella cartella 'errore'") }
            );

            reject()
        });

    });
}