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
    
    attributo.position(shape.position().x - (Math.random() * 100 +1), shape.position().y - 100);
    attributo.attr('root/title', 'joint.shapes.standard.Circle');
    attributo.attr('body/fill', 'white');
    attributo.attr('label/text', 'attributo'+ counter);
   

    // Aggiungi l'attributo al grafo
    graph.addCell(attributo);

    createLinkBetweenEntities(attributo, shape, graph);

    //Dichiaro l'attributo come figlio della shape così da rendere più semplici e precise operazioni come spostamenti ed eliminazione.
    shape.embed(attributo);

}


function createKeyFromLinks(vlinks, graph, linksId, paper, toolsView){
    var position = vlinks[0];
                
    var attributePosition = {
        x: position.x + 10, 
         y: position.y
    };

    console.log(attributePosition);

    var attributo = new joint.shapes.standard.Circle();
                attributo.resize(20, 20);
                attributo.position(attributePosition);
                attributo.attr('root/title', 'joint.shapes.standard.Circle');
                attributo.attr('body/fill', 'black');
                graph.addCell(attributo);

    var endLink = vlinks[vlinks.length-1];

    var link = new joint.shapes.standard.Link();
    link.source(attributo);
    link.target(endLink);
    link.router('metro'); // Applica il router metro al link
    link.attr({
        line: {
            targetMarker: null
        }
    });
    /*//escludo l'ultimo per non creare doppi passaggi sullo stesso vertice
    if (vlinks.length > 2) {
        link.vertices(vlinks.slice(0, vlinks.length - 1));
    }*/
   link.vertices(vlinks);

   //aggiungere i vertici anche ai link che vengono collegati
   for(i=0; i<linksId.length; i++){
        const linkToReach = graph.getCell(linksId[i]);
        linkToReach.vertices(vlinks[i]);
   }
   //setto l'entità padre anche per l'attributo appena creato
    console.log("Primo link selezionato ha come padre: ", graph.getCell(linksId[0]).getSourceCell().getParentCell().attr('label/text'));
    graph.getCell(linksId[0]).getSourceCell().getParentCell().embed(attributo);

    var anchor = { name: 'connectionPerpendicular', args: { connectionPoint: 'middle' } };
    link.set('target', { id: linksId[linksId.length -1].id, selector: 'body', anchor: anchor });
    link.set('surce', { id: attributo.id, selector: 'body', anchor: anchor });
    console.log(vlinks)
    link.addTo(graph)

    // Aggiungere la vista degli strumenti al collegamento
    const linkView = link.findView(paper);
    linkView.addTools(toolsView);
    // Attivare la visualizzazione dei vertici
    linkView.showTools();
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

function createBranchingLinks(parentShape, generalizedEnititesMap, graph, coverage) {
    const entityGeneralized = generalizedEnititesMap.getAllEntityGeneralizations();

    //salvo l'hub così che se aggiungo altre entità figlie in seguito, utilizzano lo stesso punto d'incontro 
    var hub = generalizedEnititesMap.getHub();
    if(!hub){
        hub = new joint.shapes.standard.Circle();
        hub.position(parentShape.position().x + 200, parentShape.position().y + 100);
        hub.resize(10, 10); // Piccolo nodo
        hub.attr({
            body: { fill: 'red' },
            label: { text: '', fill: 'white' }
        });
        generalizedEnititesMap.setHub(hub);
        graph.addCell(hub);
        setParent(hub, parentShape,graph,coverage); //disegno la connessione tra hub e padre solo la prima volta
    }
   
    

    entityGeneralized.forEach(([entity, coverage]) => {
        var linkToChild = new joint.shapes.standard.Link();
        linkToChild.source(hub);
        linkToChild.target(entity);
        linkToChild.attr({
            line: {
                targetMarker: null // Personalizza il marker di destinazione se necessario
            }
        });
        graph.addCell(linkToChild);
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



