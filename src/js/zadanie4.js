const latin = [
    "Consuetudo est altera natura",
    "Nota bene",
    "Nulla calamitas sola",
    "Per aspera ad astra"
];

const russian = [
    "Привычка - вторая натура",
    "Заметьте хорошо!",
    "Беда не приходит одна",
    "Через тернии к звёздам"
];

let indexes = [...latin.keys()];
shuffle(indexes);  

let clickCount = 0;

document.getElementById("showPhraseBtn").onclick = function () {
    if (indexes.length === 0) {
        alert("Фразы закончились");
        return;
    }

    const idx = indexes.pop();
    clickCount++;

    const div = document.createElement("div");
    div.classList.add(clickCount % 2 === 0 ? "class1" : "class2");

    div.innerHTML = `<b>${latin[idx]}</b> — ${russian[idx]}`;

    document.getElementById("phrases-container").appendChild(div);
};

document.getElementById("makeBoldBtn").onclick = function () {
    const lines = document.querySelectorAll("#phrases-container div");

    lines.forEach((el, i) => {
        if ((i + 1) % 2 === 0) {
            el.style.fontWeight = "bold";
        }
    });
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

document.getElementById("addRowBtn").onclick = function () {
    if (indexes.length === 0) {
        alert("Фразы закончились");
        return;
    }

    const idx = indexes.pop();

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${latin[idx]}</td>
        <td>${russian[idx]}</td>
    `;

    document.querySelector("#phrasesTable tbody").appendChild(row);
};
