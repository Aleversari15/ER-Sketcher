//funzione che prende in input un'entità e considerandone le coordinate gli aggiunge un attributo
function addAttributeToShape(shape, graph, counter, type,subAttributesMap) {
    if(type === 'normal'){
        var attribute = new joint.shapes.standard.Circle();
        attribute.resize(20, 20);
        attribute.attr('label/ref-y', -10);  // 10 pixel sopra il cerchio
        attribute.attr('label/y-alignment', 'middle');  // allineato verticalmente al centro
    }else{
        var attribute = new joint.shapes.standard.Ellipse();
        attribute.resize(70, 40);
    }
    attribute.position(shape.position().x - (Math.random() * 100 +1), shape.position().y - (Math.random() * 100 + 40));
    attribute.attr('root/title', 'joint.shapes.standard.Circle');
    attribute.attr('body/fill', 'white');
    attribute.attr('label/text', 'attributo'+ counter);
    graph.addCell(attribute);
    //se stiamo aggiungendo un attributo a un attributo con forma ellittica (subattributo) dobbiamo aggiungerlo alla mappa
    if(shape.attributes.type === 'standard.Ellipse'){
        if(!subAttributesMap.get(shape.id)){
            subAttributesMap.set(shape.id, new CompositeAttribute());
        }
        subAttributesMap.get(shape.id).addSubAttribute(attribute,null);
    }
    createLinkBetweenEntities(attribute, shape, graph, 'center', 'center');

    //Dichiaro l'attributo come figlio della shape così da rendere più semplici e precise operazioni come spostamenti ed eliminazione.
    shape.embed(attribute);

    if(shape.attributes.type === 'standard.Rectangle'){
        entitiesMap.get(shape.id).addAttribute(attribute, null);
    }
    else if(shape.attributes.type === 'standard.Polygon'){
        relationsMap.get(shape.id).addAttribute(attribute);
    }
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

/**
 * Metodo che permette di creare il collegamento tra l'entità padre e un'altra cella (in questo caso viene 
 * usato per collegarla all'hub dell'entità)
 * @param {*} currentElementSelected cella da collegare all'entità padre
 * @param {*} cell cella padre
 * @param {*} graph 
 * @param {*} coverage copertura che si vuole assegnare alla gerarchia
 */
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

/**
 * Metodo utilizzato per il disegno delle gerarchie. Ogni volta che viene aggiunta una shape figlia, 
 * questa viene collegata con l'hub (ossia il punto di incontro dei vari collegamenti alle celle figlie).
 * Il collegamento tra hub e entità padre viene disegnato solo la prima volta, poi il riferimento all'hub 
 * viene memorizzato nell'oggetto entity corrispondente alla shape padre
 */
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
    
    entityGeneralized.forEach((entity) => {
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
    var link = new joint.shapes.standard.Link();

    var bbox1 = shape1.getBBox();
    var bbox2 = shape2.getBBox();

    link.source({
        id: shape1.id,
        anchor: {
            name: 'center'  // Forza l'ancoraggio al centro della sorgente
        },
        connectionPoint: { name: 'bbox', args: { x: bbox1.center().x, y: bbox1.center().y} } // Fissa al centro del bounding box
    });
    
    // Forza l'ancoraggio al centro della destinazione (cerchio o ellisse)
    link.target({
        id: shape2.id,
        anchor: {
            name: 'center'  // Forza l'ancoraggio al centro della destinazione
        },
        connectionPoint: { name: 'bbox', args:{ x: bbox2.center().x, y: bbox2.center().y} } // Fissa al centro del bounding box
    });

    link.attr({
        line: {
            stroke: 'black',
            strokeWidth: 1,
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


function setKey(shape){
    shape.attr('body/fill', 'black');
    var parentEntity = entitiesMap.get(shape.getParentCell().id);
    if (parentEntity && typeof parentEntity.setId === 'function') {
        parentEntity.setId([shape]);
    } else {
        console.error("Errore: entità non trovata o il metodo setId non esiste");
    }

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
function updateLinkLabel(link, label) {
    if (link) {
        // Aggiorna la label visiva del link
        link.label(0, {
            position: 0.5,
            attrs: {
                text: { text: label }
            }
        });
        console.log('Label del link cambiata in:', label);

        var associations = null;
        var childToUpload = null;
        
        // Caso 1: Se la source è un rettangolo (entità)
        if (link.getSourceCell().attributes.type === 'standard.Rectangle') {
            if (relationsMap.get(link.getSourceCell().id)) {
                associations = relationsMap.get(link.getSourceCell().id);
                childToUpload = link.getTargetCell();
            } else if (relationsMap.get(link.getTargetCell().id)) {
                associations = relationsMap.get(link.getTargetCell().id);
                childToUpload = link.getSourceCell();
            }

            // Se stiamo aggiornando la cardinalità di un'associazione
            if (associations) {
                const entityConnections = associations.getAllEntityConnections();
                entityConnections.forEach(([entity, cardinality]) => {
                    if (entity.id === childToUpload.id) {
                        associations.setCardinalityForEntityById(childToUpload.id, label);
                    }
                });
            }

        // Caso 2: Se la source è un cerchio (hub di una gerarchia)
        } else if (link.getSourceCell().attributes.type === 'standard.Circle' && link.getSourceCell().attr('body/fill') === 'red') {
            var generalization = hierarchyMap.get(link.getTargetCell().id);
            generalization.setCoverage(label);

        // Caso 3: Se il target o source è un'ellisse, modifica la cardinalità nel subAttributesMap
        } else if (link.getSourceCell().attributes.type === 'standard.Ellipse' || 
                   link.getTargetCell().attributes.type === 'standard.Ellipse') {

            // Identifica la cella ellittica e l'altra cella collegata
            var ellipseCell = link.getSourceCell().attributes.type === 'standard.Ellipse' 
                ? link.getSourceCell() : link.getTargetCell();
            var connectedCell = link.getSourceCell().attributes.type !== 'standard.Ellipse' 
                ? link.getSourceCell() : link.getTargetCell();

            // Debug: Assicurati che subAttributesMap sia definita e sia una Map
            if (!subAttributesMap) {
                console.error('subAttributesMap è undefined o null');
            } else if (!(subAttributesMap instanceof Map)) {
                console.error('subAttributesMap non è una Map');
            } else {
                console.log('subAttributesMap è definita correttamente');
            }

            // Cerca nella mappa subAttributesMap l'id dell'ellisse
            if (ellipseCell && subAttributesMap.has(ellipseCell.id)) {
                var subAttributesGroup = subAttributesMap.get(ellipseCell.id);

                // Modifica la cardinalità del sub-attributo collegato usando il nuovo metodo
                subAttributesGroup.getSubAttributes().forEach((currentCardinality, subAttribute) => {
                    if (subAttribute.id === connectedCell.id) {
                        subAttributesGroup.updateCardinality(subAttribute, label); // Aggiorna la cardinalità con il nuovo valore
                        console.log(`Cardinalità aggiornata per ${subAttribute.attr('label/text')} a ${label}`);
                    }
                });
            } else {
                console.log(`Impossibile trovare l'ellisse o l'ID ${ellipseCell?.id} non esiste in subAttributesMap`);
            }


        }
    } else {
        alert('Seleziona un link prima di cambiare la label.');
    }
}
