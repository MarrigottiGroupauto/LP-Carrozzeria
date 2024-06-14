const inputButton = document.getElementById("inputtag");
const upload_button = document.getElementById("upload")
const analyze_button = document.getElementById("analyze")
inputButton.addEventListener("change", async (e) => await updateFile(e));

// id from 1 to 2000000
const SESSION_ID = Math.floor(Math.random() * 200000) + 1;
console.log(SESSION_ID);

function listDone() {
    elaborated.innerHTML = ""

    fetch('/elaborated-aut', { method: 'GET' }).then(async res => {
        let data = await res.json();

        data.forEach(name => {

            if (uploaded_display.innerHTML.includes(name)) {
                elaborated.innerHTML += `<h6>${name}</h6>`;
                return;
            }

            elaborated.innerHTML += `<p>${name}</p>`;
        })

    });
}

listDone();

let data = null;
async function updateFile(e) {
    const files = e.target.files;

    const formData = new FormData();
    Object.keys(files).forEach(i => {
        formData.append(`image`, files[i]);
        uploaded_display.innerHTML +=
            `<p> ${files[i].name}</p>`
    });

    upload_button.innerHTML = "CARICA";
    upload_button.classList.remove("fullfilled");
    upload_button.disabled = false;
    data = formData;
}

async function uploadFile(file_data) {

    let file_name = file_data.name;

    try {
        await fetch(`/upload?name=${file_name}&id=${SESSION_ID}`, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: file_data,
        }).then(_ => {
            analyze_button.disabled = false;
            analyze_button.classList.remove("fullfilled")

            analyze_button.innerHTML = "ANALIZZA"

            upload_button.classList.add("fullfilled");
            upload_button.innerHTML = "FILE CARICATI";
        });
    } catch (err) {
        console.log(err);
    }
}

upload_button.onclick = () => {
    let files = data.getAll("image")
    analyze_button.classList.remove("fullfilled")
    upload_button.disabled = true;

    files.forEach(file => {
        uploadFile(file)
    })
};

analyze_button.onclick = async () => {

    analyze_button.innerHTML = "STO ANALIZZANDO..."

    try {
        await fetch(`/analyze?id=${SESSION_ID}`, {
            method: "GET"
        }).then(_ => {
            console.log("listato");
            analyze_button.classList.add("fullfilled");
            analyze_button.innerHTML = "FILE ANALIZZATI";
            analyze_button.disabled = true;

            listDone()

        });
    } catch (err) {
        console.log(err);
    }
}