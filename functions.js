//funzione che prende in input un'entità e considerandone le coordinate gli aggiunge un attributo
function addAttributeToShape(shape, graph) {
    // Ottieni la posizione della shape
    var position = shape.position();
    
    // Definisci la posizione dell'attributo relativa alla shape
    var attributePosition = {
        x: position.x + 1, // Aggiusta questa distanza in base alla tua esigenza
        y: position.y - 4
    };

    var attributo = new joint.shapes.standard.Circle();
    attributo.resize(20, 20);
    attributo.position(attributePosition);
    attributo.attr('root/title', 'joint.shapes.standard.Circle');
    attributo.attr('body/fill', 'white');

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
