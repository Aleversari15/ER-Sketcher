//funzione che prende in input un'entità e considerandone le coordinate gli aggiunge un attributo
function addAttributeToShape(shape, graph, counter, type, entitiesMap, relationsMap, attributeEntity) {
    if(type === 'normal'){
        var attributo = new joint.shapes.standard.Circle();
        attributo.resize(20, 20);
        attributo.attr('label/ref-y', -10);  // 10 pixel sopra il cerchio
        attributo.attr('label/y-alignment', 'middle');  // allineato verticalmente al centro
    }else{
        var attributo = new joint.shapes.standard.Ellipse();
        attributo.resize(70, 40);
    }
    attributo.position(shape.position().x - (Math.random() * 100 +1), shape.position().y - (Math.random() * 100 + 40));
    attributo.attr('root/title', 'joint.shapes.standard.Circle');
    attributo.attr('body/fill', 'white');
    attributo.attr('label/text', 'attributo'+ counter);
    graph.addCell(attributo);

    createLinkBetweenEntities(attributo, shape, graph);

    //Dichiaro l'attributo come figlio della shape così da rendere più semplici e precise operazioni come spostamenti ed eliminazione.
    shape.embed(attributo);
}


/**Metodo che permette di creare un attributo passante attraverso più links. Viene utilizzato sia per creare un identificatore esterno, 
 * che per gli identificatori composti. Parametri:
 * - vertices: vettore contenenti i punti che si trovano esattamente al centro dei link da attraversare
 * - graph
 * - link: vettore che contiene i vari link da attraversare (l'intera cella)
 * - paper
 * - toolsView */
function createKeyFromLinks(vertices, graph, links, paper, toolsView){
    var shape = graph.getCell(links[0]).getSourceCell().getParentCell(); //entità padre dei vari attributi da attraversare
    var attributo = new joint.shapes.standard.Circle();
                attributo.resize(20, 20);
                attributo.position(shape.position().x - (Math.random() * 100 +1), shape.position().y - (Math.random() * 100 + 40));
                attributo.attr('root/title', 'joint.shapes.standard.Circle');
                attributo.attr('body/fill', 'black');
                graph.addCell(attributo);
    var endLink = vertices[vertices.length-1];

    var link = new joint.shapes.standard.Link();
    link.source(attributo);
    link.target(endLink);
    link.router('metro'); 
    link.attr({
        line: {
            targetMarker: null
        }
    });
   link.vertices(vertices);
   for(i=0; i<links.length; i++){
        const linkToReach = graph.getCell(links[i]);
        linkToReach.vertices(vertices[i]);
        
   }
    shape.embed(attributo); 

    link.set('target', { id: links[links.length -1].id, selector: 'body' });
    link.set('source', { id: attributo.id, selector: 'body' });
    link.addTo(graph);

    const linkView = link.findView(paper);
    linkView.addTools(toolsView);
    linkView.showTools();

    // Funzione per calcolare i punti medi dei link così da aggiornare dinamicamente 
    //la posizione dei vertici durante lo spostamento della shape padre
    function updateVertices() {
        var newVertices = links.map(function (link) {
            var linkCell = graph.getCell(link);
            var linkView = paper.findViewByModel(linkCell);
            var bbox = linkView.getBBox();
            return bbox.center(); 
        });
        link.vertices(newVertices);
        for (var i = 0; i < links.length; i++) {
            const linkToUpdate = graph.getCell(links[i]);
            linkToUpdate.vertices([newVertices[i]]);
        }
    }

    shape.on('change:position', function () {
        updateVertices();
    });

    updateVertices();
}

//metodo che permette di settare il padre di un'entita
function setParent(currentElementSelected, cell, graph, coverage){
    var link = new joint.shapes.standard.Link;
    link.source({
        id: currentElementSelected.id,
        connectionPoint: { name: 'boundary', args: { selector: 'body' } }
    });
    link.target({
        id: cell.id,
        connectionPoint: { name: 'boundary', args: { selector: 'body' } }
    });
    link.attr({
        line: {
            targetMarker: {
                'type': 'path',
                'd': 'M 20 -10 L 0 0 L 20 10 Z',
                'fill': 'white',
                'stroke': 'black',
                'stroke-width': 1
            }
        }
    });
    link.label(0, {
        position: 0.5,
        attrs: {
            text: { text: coverage } // Esempio di etichetta di cardinalità
        }
    });
    graph.addCell(link);
}

/*Metodo utilizzato per il disegno delle gerarchie. Ogni volta che viene aggiunta una shape figlia, 
questa viene collegata con l'hub (ossia il punto di incontro dei vari collegamenti alle celle figlie).
Il collegamento tra hub e entità padre viene disegnato solo la prima volta, poi il riferimento all'hub 
viene memorizzato nell'oggetto entity corrispondente alla shape padre*/
function createBranchingLinks(parentShape, generalizedEnititesMap, graph, coverage) {
    const entityGeneralized = generalizedEnititesMap.getAllEntityGeneralizations();
    var hub = generalizedEnititesMap.getHub();
    console.log("Hub salvato: ", hub);

    if(!hub){
        hub = new joint.shapes.standard.Circle();
        hub.position(parentShape.position().x + 200, parentShape.position().y + 100);
        hub.resize(10, 10); 
        hub.attr({
            body: { fill: 'red' },
            label: { text: '', fill: 'white' }
        });
        console.log("Hub creato: ", hub);
        generalizedEnititesMap.setHub(hub);
        graph.addCell(hub);
        setParent(hub, parentShape,graph,coverage);
    }
    
   
    entityGeneralized.forEach(([entity, coverage]) => {
        const existingLinks = graph.getConnectedLinks(hub, { outbound: true });
        const linkExists = existingLinks.some(link => link.get('target').id === entity.id);
        //se il collegamento con la cella figlia non è ancora stato disegnato
        if (!linkExists){
            var linkToChild = new joint.shapes.standard.Link();
            linkToChild.source(hub);
            linkToChild.target(entity);
            linkToChild.attr({
                line: {
                    targetMarker: null 
                }
            });
            graph.addCell(linkToChild);
        }
    });   
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

    //se sto collegando un'associazione ad un'entità allora imposto anche una cardinalità di default 
    if((shape1.attributes.type === 'standard.Rectangle' && shape2.attributes.type === 'standard.Polygon') || 
        (shape2.attributes.type === 'standard.Rectangle' && shape1.attributes.type === 'standard.Polygon')){
        link.label(0, {
            position: 0.5,
            attrs: {
                text: { text: '1-N' }
            }
        });
    }
    graph.addCell(link);
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

function renameShape(shape, entities) {
    if (shape) {
        var newName = prompt("Inserisci il nuovo nome:");
        if (newName) {
            shape.attr('label/text', newName);
            if(entities.has(shape.id)){
                var entity = entities.get(shape.id);
                entity.setName(newName);
            }  
        }
    }
    hideCommandPalette();
}


// Funzione per aggiornare la label del link in base alla scelta della cardinalità
function updateLinkLabel(link, label,relationsMap) {
    if (link) {
        link.label(0, {
            position: 0.5,
            attrs: {
                text: { text: label }
            }
        });
        console.log('Label del link cambiata in:', label);
        
        var associations = null;
        var childToUpload = null;
        //se l'id della cella source è contenuto nella mappa, allora è l'associazione e possiamo prendere il suo oggetto associato e aggiornare la label per il json
        if(relationsMap.get(link.getSourceCell().id)){
            associations = relationsMap.get(link.getSourceCell().id);
            childToUpload = link.getTargetCell();
        }
        else if(relationsMap.get(link.getTargetCell().id)){
            associations = relationsMap.get(link.getTargetCell().id);
            childToUpload = link.getSourceCell();
        }
        //se l'oggetto non è vuoto e quindi stiamo aggiornando la cardinalità di un'associazione 
        if (associations) {
            const entityConnections = associations.getAllEntityConnections();
            entityConnections.forEach(([entity, cardinality]) => {
               if(entity.id === childToUpload.id){
                associations.setCardinalityForEntityById(childToUpload.id, label);
               }
            });
        } 
    } else {
        alert('Seleziona un link prima di cambiare la label.');
    }
}



