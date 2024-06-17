const inputButton = document.getElementById("inputtag");
const upload_button = document.getElementById("upload")
const analyze_button = document.getElementById("analyze")
inputButton.addEventListener("change", async (e) => await updateFile(e));

var done = [];

// id from 1 to 2000000
const SESSION_ID = Math.floor(Math.random() * 200000) + 1;
console.log(SESSION_ID);

function listDone() {
    elaborated.innerHTML = ""

    fetch('/elaborated-aut', { method: 'GET' }).then(async res => {
        let data = await res.json();

        data.forEach(name => {

            if (done.includes(name)) {
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
    upload_button.classList.remove("fulfilled");
    upload_button.disabled = false;

    analyze_button.innerHTML = "ANALIZZA"
    analyze_button.classList.remove("fulfilled")
    analyze_button.disabled = true;

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
            analyze_button.classList.remove("fulfilled")

            analyze_button.innerHTML = "ANALIZZA"

            upload_button.classList.add("fulfilled");
            upload_button.innerHTML = "FILE CARICATI";
        });
    } catch (err) {
        console.log(err);
    }
}

upload_button.onclick = () => {
    let files = data.getAll("image")
    analyze_button.classList.remove("fulfilled")
    upload_button.disabled = true;

    files.forEach(file => {
        uploadFile(file)
    })
};

analyze_button.onclick = async () => {

    analyze_button.disabled = true;
    analyze_button.innerHTML = "STO ANALIZZANDO..."
    analyze_button.classList.add("working");

    await fetch(`/analyze?id=${SESSION_ID}`, {
        method: "GET"
    });

    analyze_button.classList.remove("working");
    analyze_button.classList.add("fulfilled");
    analyze_button.innerHTML = "FILE ANALIZZATI";

    listDone();

}