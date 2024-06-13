const inputButton = document.getElementById("inputtag");
const upload_button = document.getElementById("upload")
const analyze_button = document.getElementById("analyze")
inputButton.addEventListener("change", async (e) => await updateFile(e));

// id from 1 to 2000
const SESSION_ID = Math.floor(Math.random() * 200000) + 1;
console.log(SESSION_ID);

let data = null;
async function updateFile(e) {
    const files = e.target.files;

    const formData = new FormData();
    Object.keys(files).forEach(i => {
        formData.append(`image`, files[i]);
    });

    data = formData;
}

async function uploadFile(file_data) {

    let file_name = file_data.name;
    console.log("d<asd");

    try {
        const imageData = await fetch(`http://localhost:3000/upload?name=${file_name}&id=${SESSION_ID}`, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: file_data,
        });
    } catch (err) {
        console.log(err);
    }
}

upload_button.onclick = () => {
    uploaded_display.innerHTML = '<h4>File caricati </h4>'
    let files = data.getAll("image")

    files.forEach(file => {
        uploadFile(file)
        uploaded_display.innerHTML +=
            `<p> ${file.name}</p>`
    })
};

analyze_button.onclick = async () => {
    try {
        const imageData = await fetch(`http://localhost:3000/analyze?id=${SESSION_ID}`, {
            method: "GET"
        });
    } catch (err) {
        console.log(err);
    }
}