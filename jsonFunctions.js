
function createJsonForPanel(graph, document, entities/*, relationships, generalizations*/){
    var jsonContainer = document.querySelector('.json-container');
    jsonContainer.innerHTML = ''; // Svuota la lista prima di aggiungere gli elementi

    //stampo tutte le entità nel pannello del json
    entities.forEach((objEntity, idPrincipale) => {
        var jsonItem = document.createElement('li');
        var shapeJSON = objEntity.toJSON();
        var jsonString = JSON.stringify(shapeJSON, null, 2); // Converti l'oggetto in una stringa JSON formattata
        jsonItem.textContent = jsonString;
        jsonContainer.appendChild(jsonItem);
    });

    hljs.highlightBlock(jsonContainer);
}


function downloadJson(graph, document){
    console.log('Hai cliccato download');
    var projectName = document.querySelector('.nomeProgetto').value;
    console.log('Nome progetto:', projectName); 
    // Imposta un nome di default se il campo è vuoto
    if (!projectName) {
        projectName = 'diagram_er';
    }

    console.log(projectName);
    // Ottiengo i dati del grafo in formato JSON, li converto in stringa poi creo un blob e un url per il blob
    var graphJSON = graph.toJSON();
    var dataStr = JSON.stringify(graphJSON, null, 2);
    var blob = new Blob([dataStr], { type: "application/json" });
    var url = URL.createObjectURL(blob);

    // Crea un elemento <a> temporaneo
    var a = document.createElement('a');
    a.href = url;
    a.download = projectName + '.json';

    // Simula un click sul link per avviare il download
    a.click();
    URL.revokeObjectURL(url);
}


function getShapeJSON(shape) {
    return JSON.stringify(shape.attributes, null, 4);
}


function getShapeJSON2(cell) {
    // Ottieni le proprietà base dell'elemento
    var baseProperties = {
        type: cell.get('type'),  // Tipo dell'elemento, ad esempio 'standard.Circle', 'standard.Rectangle', ecc.
        id: cell.id,             // ID univoco dell'elemento nel grafo
        attrs: cell.attr('label/text')       // Attributi visivi dell'elemento
    };



    // Restituisci il JSON modificato
    return JSON.stringify(baseProperties, null, 2); // Opzionale: formattazione per una visualizzazione più leggibile
}

function updateJSONList(graph) {
    var jsonContainer = document.querySelector('.json-container');
    jsonContainer.innerHTML = ''; // Svuota la lista prima di aggiungere gli elementi
    
    // Itera tutte le shape nel grafo e aggiungi il JSON corrispondente alla lista
    graph.getCells().forEach(function(cell) {
        var jsonItem = document.createElement('li');
        var shapeJSON = getShapeJSON2(cell);
        jsonItem.textContent = shapeJSON;
        jsonContainer.appendChild(jsonItem);
       
    });

    hljs.highlightBlock(jsonContainer);
}
