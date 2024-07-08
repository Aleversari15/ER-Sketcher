//funzione che prende in input un'entità e considerandone le coordinate gli aggiunge un attributo
function addAttributeToShape(shape, graph, counter, type) {
    // Ottieni la posizione della shape
    var position = shape.position();
    
    // Definisci la posizione dell'attributo relativa alla shape
    var attributePosition = {
        x: position.x +100, // Aggiusta questa distanza in base alla tua esigenza
        y: position.y - 130
    };

    console.log('Shape position:', attributePosition);

    if(type === 'normal'){
        var attributo = new joint.shapes.standard.Circle();
        attributo.resize(20, 20);
        attributo.attr('label/ref-y', -10);  // 10 pixel sopra il cerchio
        attributo.attr('label/y-alignment', 'middle');  // allineato verticalmente al centro
    }else{
        var attributo = new joint.shapes.standard.Ellipse();
        attributo.resize(70, 40);
    }
    
    attributo.position(attributePosition);
    attributo.attr('root/title', 'joint.shapes.standard.Circle');
    attributo.attr('body/fill', 'white');
    attributo.attr('label/text', 'attributo'+counter);
   

    // Aggiungi l'attributo al grafo
    graph.addCell(attributo);

    createLinkBetweenEntities(attributo, shape, graph);

}



// Funzione per connettere un'entità (rettangolo) e una associazione/relazione (rombo) 
function createLinkBetweenEntities(shape1, shape2, graph) {
    var link = new joint.shapes.standard.Link;
    link.source(shape1);
    link.target(shape2);
    link.attr({
        line: {
            targetMarker: null
        }
    });
    graph.addCell(link);
}


//GESTIONE PANNELLO JSON
function getShapeJSON(shape) {
    return JSON.stringify(shape.attributes, null, 4);
}

function updateJSONList(graph) {
    var jsonContainer = document.querySelector('.json-container');
    jsonContainer.innerHTML = ''; // Svuota la lista prima di aggiungere gli elementi
    
    // Itera tutte le shape nel grafo e aggiungi il JSON corrispondente alla lista
    graph.getCells().forEach(function(cell) {
        var jsonItem = document.createElement('li');
        var shapeJSON = getShapeJSON(cell);
        jsonItem.textContent = shapeJSON;
        jsonContainer.appendChild(jsonItem);
       
    });

    hljs.highlightBlock(jsonContainer);
}




//FUNZIONI PER PALETTE DEI COMANDI

function showCommandPalette(shape) {
    var palette = document.getElementsByClassName('command-palette')[0];
    palette.style.display = 'block';
    // Memorizza l'ID della shape selezionata
    palette.setAttribute('data-shape-id', shape.id);

    /*aggiungere metodo che aggiorna la palette in base a ciò che è stato selezionato
    entità -> elimina,rinomina, aggiungi attributo, aggiungi attributo composto 
    attributo -> elimina, rinomina, chiave
    attributo composto -> elimina, rinomina,aggiungi attributo 
    link -> elimina, aggiungi cardinalità
    */
}

function hideCommandPalette() {
    var palette = document.getElementsByClassName('command-palette')[0];
    palette.style.display = 'none';
}

function setKey(shape){
    shape.attr('body/fill', 'black');
}

function deleteShape(shape) {
    if (shape) {
        shape.remove();
    }
    hideCommandPalette();
}

function renameShape(shape) {
    if (shape) {
        var newName = prompt("Inserisci il nuovo nome:");
        if (newName) {
            shape.attr('label/text', newName);
        }
    }
    hideCommandPalette();
}


// Funzione per aggiornare l'altezza del paper
function updatePaperHeight(paper) {
    var drawContainer = document.getElementById('drawContainer');
    if (drawContainer) {
        var height = drawContainer.clientHeight;
        paper.setDimensions(drawContainer.clientWidth, height);
    }
}



// Funzione per aggiornare la label del link in base alla scelta della cardinalità
function updateLinkLabel(link, label) {
    if (link) {
        link.label(0, {
            position: 0.5,
            attrs: {
                text: { text: label }
            }
        });
        console.log('Label del link cambiata in:', label);
    } else {
        alert('Seleziona un link prima di cambiare la label.');
    }
}