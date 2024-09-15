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
    createLinkBetweenEntities(attribute, shape, graph);

    //Dichiaro l'attributo come figlio della shape così da rendere più semplici e precise operazioni come spostamenti ed eliminazione.
    shape.embed(attribute);

    attribute.on('change:position', function(){
        updateLabelPosition(attribute, shape);    });

    if(shape.attributes.type === 'standard.Rectangle'){
        entitiesMap.get(shape.id).addAttribute(attribute, null);
    }
    else if(shape.attributes.type === 'standard.Polygon'){
        relationsMap.get(shape.id).addAttribute(attribute);
    }
}


function updateLabelPosition(attribute, shape) {
    var attributePosition = attribute.position();
    var shapePosition = shape.position();
    var shapeSize = shape.size();

    console.log('Coordinata x entità ', shapePosition.x);
    console.log('Coordinata y entità ', shapePosition.y);

    console.log('Coordinata x attributo ', attributePosition.x);
    console.log('Coordinata y attributo ', attributePosition.y);
   
    // Shape a sinistra dell'attributo
    if (shapePosition.x < attributePosition.x && attributePosition.x > (shapePosition.x + shapeSize.width)) { 
        console.log('Entità a sx');
        attribute.attr('label/ref-x', +60 );
        attribute.attr('label/ref-y',+10 );
        attribute.attr('label/y-alignment', 'middle'); 
    } // Shape a destra dell'attributo
    else if (shapePosition.x > attributePosition.x && (shapePosition.x > attributePosition.x)) { 
        console.log('Entità a dx');
        attribute.attr('label/ref-x', -50);
        attribute.attr('label/ref-y', +10);
        attribute.attr('label/y-alignment', 'middle');  
    } // Shape sopra l'attributo
    else if (shapePosition.y < attributePosition.y && 
            (shapePosition.x <= attributePosition.x && attributePosition.x <= (shapePosition.x + shapeSize.width))) { 
        console.log('Entità sopra');
        attribute.attr('label/ref-x', +5);
        attribute.attr('label/ref-y', +30);
        attribute.attr('label/x-alignment', 'middle'); 
    } // Shape sotto l'attributo
    else if(shapePosition.y > attributePosition.y && 
            (shapePosition.x <= attributePosition.x && attributePosition.x <= (shapePosition.x + shapeSize.width))){ 
        console.log('Entità sotto');
        attribute.attr('label/ref-x', +5);
        attribute.attr('label/ref-y',-20);
        attribute.attr('label/x-alignment', 'middle');  
    }

    
   
}


function createKeyFromLinks(vertices, graph, links, paper, toolsView) {
    var shape = graph.getCell(links[0].id).getSourceCell().getParentCell(); // Entità padre dei vari attributi da attraversare
    var attributo = new joint.shapes.standard.Circle();
    attributo.resize(20, 20);
    attributo.position(shape.position().x - (Math.random() * 100 + 1), shape.position().y - (Math.random() * 100 + 40));
    attributo.attr('root/title', 'joint.shapes.standard.Circle');
    attributo.attr('body/fill', 'black');
    graph.addCell(attributo);

    var endLink = graph.getCell(links[links.length - 1].id); // Usa l'ultimo link come destinazione finale

    var link = new joint.shapes.standard.Link();
    link.connector({ name: 'straight' });
    link.source(attributo);
    link.target(endLink);
    link.router('metro');
    link.attr({
        line: {
            targetMarker: null
        }
    });

    // Imposta i vertici per il link
    link.vertices(vertices);
    graph.addCell(link);

    // Imposta i vertici per ogni link esistente
    for (let i = 0; i < links.length; i++) {
        const linkToReach = graph.getCell(links[i]);
        if (i < vertices.length) {
            linkToReach.vertices([vertices[i]]);
        }
    }

    shape.embed(attributo);


    const linkView = link.findView(paper);
    linkView.addTools(toolsView);
    linkView.showTools();
    
    // Disabilita l'interazione con i vertici
    linkView.options.interactive = function (cellView, eventName) {
        // Disabilita interazioni sui vertici
        if (eventName === 'vertex:add' || eventName === 'vertex:remove' || eventName === 'vertex:move') {
            return false;
        }
        return true; // Permette altre interazioni
    };

    // Funzione per aggiornare i vertici dinamicamente
    function updateVertices() {
        var newVertices = links.map(function (link) {
            var linkCell = graph.getCell(link);
            var linkView = paper.findViewByModel(linkCell);
            var bbox = linkView.getBBox();
            return bbox.center(); 
        });
        link.vertices(newVertices);

        for (let i = 0; i < links.length; i++) {
            const linkToUpdate = graph.getCell(links[i]);
            linkToUpdate.vertices([newVertices[i]]);
        }
    }

    // Aggiorna i vertici durante lo spostamento della shape padre
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


// Funzione per connettere un'entità (rettangolo/rombo) e un attributo (cerchio)
function createLinkBetweenEntities(shape1, shape2, graph) {
    var link = new joint.shapes.standard.Link();

    // Configura l'ancoraggio usando il connectionPoint 'boundary' per il shape1
    link.source({
        id: shape1.id,
        connectionPoint: {
            name: 'boundary', // Usa il confine della forma
            args: {
                offset: 0,        
                insideout: false,  // Connessione dall'esterno
                extrapolate: true, // Estendi il collegamento se necessario
                sticky: true,      // Mantieni il collegamento anche se la forma si muove
                precision: 3,      // Precisione del calcolo
                stroke: true       // Considera anche lo spessore del bordo
            }
        },
        anchor: {name: 'modelCenter'}
    });

    // Configura l'ancoraggio usando il connectionPoint 'boundary' per il shape2
    link.target({
        id: shape2.id,
        connectionPoint: {
            name: 'boundary', // Usa il confine della forma
            args: {
                offset: 0,        
                insideout: false,  // Connessione dall'esterno
                extrapolate: true, // Estendi il collegamento se necessario
                sticky: true,      // Mantieni il collegamento anche se la forma si muove
                precision: 3,      // Precisione del calcolo
                stroke: true       // Considera anche lo spessore del bordo
            }
        },
        anchor: {name: 'modelCenter'}
    });

    // Definisci lo stile del link
    link.attr({
        line: {
            stroke: 'black',
            strokeWidth: 1,
            targetMarker: null // Rimuove il marcatore alla fine del link
        }
    });

    // Se collego un rettangolo (entità) a un poligono (relazione/associazione), aggiungo una cardinalità di default
    if (
        (shape1.attributes.type === 'standard.Rectangle' && shape2.attributes.type === 'standard.Polygon') ||
        (shape2.attributes.type === 'standard.Rectangle' && shape1.attributes.type === 'standard.Polygon')
    ) {
        link.label(0, {
            position: 0.5,
            attrs: {
                text: { text: '1-N' }  // Cardinalità di default
            }
        });
    }

    // Aggiungo il link al grafico
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

        var linkLabel = link.label(0).attrs.text.text;
        console.log('Label attuale del link:', linkLabel);

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
