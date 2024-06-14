const { create } = require('xmlbuilder2');
const fs = require('fs');
const path = require('path');

// Function to build XML
exports.createXML = (name, data) => {

    const xmlObj = {
        pratiche: {
            pratica: {
                "@IdCliente": "GA0533",
                "@StatoPratica": "CHIUSA",
                "@StatoGestionePratica": "",
                "@NoteStatoGestionePratica": "",
                "@Pratica_Numero": data.numero_pratica.content,
                "@Pratica_Numero_Autorizzazione": data.numero_autorizzazione.content,
                "@Pratica_Data_Autorizzazione": data.data_autorizzazione.content,
                "@num_pratiche_aut": "",
                "@Fornitore": "",
                "@Fornitore_PartitaIVA": "",
                "@Fornitore_Gruppo": "",
                "@Fornitore_indirizzo": "",
                "@Fornitore_ncivico": "",
                "@Fornitore_citta": "",
                "@Fornitore_cap": "",
                "@Fornitore_pv": "",
                "@Fornitore_Iban": "",
                "@Fornitore_swcode": "",
                "@Veicolo_Targa": data.veicolo_targa.content,
                "@Veicolo_Marca": data.veicolo_marca.content,
                "@Veicolo_Modello": data.veicolo_modello.content,
                "@Veicolo_Versione": "",
                "@Veicolo_Telaio": data.veicolo_telaio.content,
                "@Fornitore_NumeroFattura": "",
                "@Fornitore_DataFattura": "",
                "@Fornitore_FatturaImponibile": "",
                "@Fornitore_FatturaTotale": "",
                "@Fornitore_iva": "",
                "@cod_GA": "",
                "@chilometri": data.veicolo_km.content,
                "@Ric_Off": "",
                "ricambi": { "ricambio": [] }
            }
        }
    }

    let ricambiJSON = data.ricambi.valueArray;

    ricambiJSON.forEach(ric => {

        ric = ric.valueObject;
        if (!ric.sconto.content) ric.sconto.content = "";

        netto = ric.prezzo_netto.valueNumber;
        scontoStr = ric.sconto.content ? ric.sconto.content.replace("S", "").replace(",", ".") : "0";

        try {
            sconto = parseFloat(scontoStr);
        } catch {
            sconto = 0;
        }

        listinoStr = ((netto / (100 - sconto)) * 100).toFixed(2).toString();

        if (!ric.prezzo_netto.content) return;

        if (!ric.quantita.content) {
            ric.quantita.content = '';
            ric.quantita.valueNumber = 1
        }

        xmlObj.pratiche.pratica.ricambi.ricambio.push({

            "@categorico": ric.categorico.content,
            "@Ric-Servizio_PrezzoNetto": ric.prezzo_netto.content.replace(",", "."),
            "@Ric-Servizio_Sconto": scontoStr,
            "@Ric-Servizio_PrezzoListino": listinoStr,
            "@Ric-Servizio_Quantita": ric.quantita.content.replace(",", "."),
            "@cod_famiglia_servizio_oeam": "",
            "@Ric-Servizio_Descrizione": ric.descrizione.content,
            "@Ric-Servizio_Categorico": ric.categorico.content,
            "@Ric-Servizio_idmarca": "",
            "@Ric-Servizio_Marca": ""
        });
    });

    const doc = create(xmlObj);
    const xml = doc.end({ prettyPrint: true }); // Pretty print the XML

    const filePath = path.join(__dirname, `output_xml/${name}.xml`);
    fs.writeFileSync(filePath, xml, 'utf8');

    return xml;
}
