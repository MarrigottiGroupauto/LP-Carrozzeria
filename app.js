require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const key = "b1af733907eb45a3a9bf606d7834a5dd";
const endpoint = "https://westeurope.api.cognitive.microsoft.com/";
const modelId = "LP-CARR-AUT_Nerural"

app.use(express.json()); // Middleware to parse JSON bodies

// Route to handle document recognition requests
app.post('/recognize-document', async (req, res) => {
    const { documentUrl } = req.body;

    if (!documentUrl) {
        return res.status(400).send('Document URL is required');
    }

    // POST request, useful for fetching the API key for the actual request
    // {endpoint}/documentintelligence/documentModels/{modelId}:analyze?api-version=2024-02-29-preview
    // HEADER :'Ocp-Apim-Subscription-Key': key
    try {
        const keyFetchResponce = await axios.post(`${endpoint}/documentintelligence/documentModels/${modelId}:analyze?api-version=2024-02-29-preview`,
            {
                urlSource: documentUrl
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': key
                }
            });

        apimId = keyFetchResponce.headers["apim-request-id"];

        console.log(apimId);

        // Actual GET request
        // {endpoint}/documentintelligence/documentModels/{modelId}/analyzeResults/{apimId}?api-version=2024-02-29-preview
        // HEADER :'Ocp-Apim-Subscription-Key': key

        const analysisResponce = await axios.get(`${endpoint}/documentintelligence/documentModels/${modelId}/analyzeResults/${apimId}?api-version=2024-02-29-preview`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': key
                }
            });

        console.log(analysisResponce);
        res.send("analysisResponce")

    } catch (error) {
        console.error('Error recognizing document:', error);
        res.status(500).send(`${error}`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
