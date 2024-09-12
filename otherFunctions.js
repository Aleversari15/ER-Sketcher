function copyElements(graph, elements, localStorage) {
    const elementIds = elements.map(element => element.id);

    console.log(elementIds);
    const selectedCells = graph.getCells().filter(cell => elementIds.includes(cell.id));

    // Includi i link associati alle celle selezionate
    const selectedLinks = graph.getLinks().filter(link => {
        const sourceId = link.get('source').id;
        const targetId = link.get('target').id;
        return elementIds.includes(sourceId) || elementIds.includes(targetId);
    });

    const json = {
        cells: [...selectedCells, ...selectedLinks].map(cell => cell.toJSON())
    };

    localStorage.setItem('copiedElements', JSON.stringify(json));
    console.log(localStorage);
}

function pasteElements(targetGraph, localStorage) {
    const json = JSON.parse(localStorage.getItem('copiedElements'));

    if (json && json.cells) {
        console.log('JSON cells:', json.cells);

        const idMap = new Map(); // Mappa per tracciare l'ID originale e il nuovo ID
        
        // Prima, crea le celle (esclusi i link) e aggiorna la mappa degli ID
        const elements = json.cells.filter(cellData => cellData.type !== 'standard.Link').map(cellData => {
            const CellType = joint.util.getByPath(joint.shapes, cellData.type, '.');
            const newCell = new CellType();

            if (cellData.position) {
                newCell.position(cellData.position.x, cellData.position.y);
                newCell.translate(50,50) //per evitare di sovrapporre gli elementi
            } 
            if (cellData.size) {
                newCell.resize(cellData.size.width, cellData.size.height);
            }

            newCell.attr(cellData.attrs || {});

            // Salva il mapping degli ID
            idMap.set(cellData.id, newCell.id);

            return newCell;


            
        });

        targetGraph.addCells(elements);

        // Imposta la propiretà di embedding se necessario
        json.cells.forEach(cellData => {
            if (cellData.embeds && cellData.embeds.length > 0) {
                const parentCell = targetGraph.getCell(idMap.get(cellData.id)); 
                cellData.embeds.forEach(embedId => {
                    const childCell = targetGraph.getCell(idMap.get(embedId)); 
                    if (parentCell && childCell) {
                        parentCell.embed(childCell); 
                    }
                });
            }
        });

        // Ora, aggiungi i link aggiornando gli ID di source e target utilizzando la mappa
        json.cells.filter(cellData => cellData.type === 'standard.Link').forEach(cellData => {
            const link = new joint.shapes.standard.Link({
                source: {
                    id: idMap.get(cellData.source.id),  // Usa il nuovo ID dalla mappa
                },
                target: {
                    id: idMap.get(cellData.target.id),  // Usa il nuovo ID dalla mappa
                },
                vertices: cellData.vertices || [],
                router: cellData.router,
                connector: cellData.connector,
                attrs: cellData.attrs || {}
            });

            targetGraph.addCell(link);
        });


        //prima aggiungo tutte le entità alla mappa delle entities
        json.cells.filter(cellData => cellData.type !== 'standard.Circle').forEach(cellData => {

            switch(cellData.type){
                case 'standard.Rectangle':{
                    entitiesMap.set(cellData.id, new Entity());
                    //gestire gerarchie: se è connessa a un cerchio con una freccia diversa da un link base allora si tratta di una gerarchia
                    break;
                }
                case 'standard.Polygon':{
                    relationsMap.set(cellData.id, new Association());
                    break;
                }
                case 'standard.Ellipse':{
                    subAttributesMap.set(cellData.id, new CompositeAttribute());
                    break;
                }
            }
            
        });
    
        //aggiungo gli attributi per ultimi, sennò rischio che le shape a cui si 
        //attaccano non siano ancora state aggiunte alle rispettive mappe.
        json.cells.filter(cellData => cellData.type === 'standard.Circle').forEach(cellData => {
            const parentId = idMap.get(cellData.parent.id);
            const parentCell = targetGraph.getCell(parentId);

            if (parentCell) {
                switch(parentCell.attributes.type) {
                    case 'standard.Rectangle': {
                        entitiesMap.get(parentId).addAttribute(targetGraph.getCell(cellData));
                        break;
                    }
                    case 'standard.Polygon': {
                        relationsMap.get(parentId).addAttribute(targetGraph.getCell(idMap.get(cellData.id)));
                        break;
                    }
                    case 'standard.Ellipse': {
                        subAttributesMap.get(parentId).addSubAttribute(targetGraph.getCell(idMap.get(cellData.id)), null); //bisognerebbe recuperare la cardinalità se era stata indicata
                        break;
                    }
                }
            }
        });
    }
}



function updateLinks(targetGraph, copiedCells) {
    // Ricrea i collegamenti tra le celle
    copiedCells.forEach(cellData => {
        if (cellData.type === 'link') {
            const link = new joint.dia.Link(cellData);
            targetGraph.addCell(link);
        }
    });
}


function zoomOut(paper){
    window.graphScale = Math.max(0.1, window.graphScale - 0.1); // Limitiamo il valore minimo di scala a 0.1 per evitare zoom negativi o troppo piccoli
    paper.scale(window.graphScale, window.graphScale);
}

function zoomIn(paper){
    window.graphScale = window.graphScale + 0.1;
    paper.scale(window.graphScale, window.graphScale);
}



/**
 * Metodo che fa apparire la palette dei comandi nel momento in cui una shape del diagramma viene selezionata. In base alla shape selezionata devono
 * devono essere attivi sono i pulsanti realmente utilizzabili:
 * entità ->  elimina,rinomina, aggiungi attributo, aggiungi attributo composto
 * attributo -> elimina, rinomina, chiave
 * attributo composto -> elimina, rinomina,aggiungi attributo 
 * link -> elimina, aggiungi cardinalità 
 * associazione -> attributo singolo, rinomina, elimina
 * @param {*} shape è la figura selezionata
 */
function showCommandPalette(shape, entitiesMap) {
    var palette = document.getElementsByClassName('command-palette')[0];
    palette.style.display = 'block';
    
    // Selezione dei pulsanti
    var deleteButton = document.querySelector('.delete-button');
    var renameButton = document.querySelector('.rename-button');
    var keyButton = document.querySelector('.key-button');
    var attributeButton = document.querySelector('.attribute-button');
    var subAttributeButton = document.querySelector('.subAttribute');
    var composedIdButton = document.querySelector('.composedId');
    var extIdButton = document.querySelector('.extId');
    var hierarchyButton = document.querySelector('.hierarchy');
    var cardinalitySelect = document.querySelector('.cardinality');
    var coverageSelect = document.querySelector('.coverage');
    
    // Aggiungi la classe 'disabled' a tutti i bottoni di default
    var buttons = [deleteButton, renameButton, keyButton, attributeButton, subAttributeButton, composedIdButton, 
        extIdButton, hierarchyButton, cardinalitySelect, coverageSelect];
    buttons.forEach(function(button) {
        button.classList.add('disabled');
    });
    
    // Abilita/disabilita in base alla shape selezionata
    switch (shape.attributes.type) {
        case 'standard.Rectangle': // Entità
            deleteButton.classList.remove('disabled');
            renameButton.classList.remove('disabled');
            attributeButton.classList.remove('disabled');
            subAttributeButton.classList.remove('disabled');
            extIdButton.classList.remove('disabled'); //però prima di disegnarlo deve essere fatto controllo cardinalità (1-1)
 
            const entity = entitiesMap.get(shape.id);
            console.log("entità selezioanta ", entity);
            //se ha più di un attributo composeIdButton deve essere abilitato
            if(entitiesMap.get(shape.id) && entitiesMap.get(shape.id).getAttributes().size > 1){
                composedIdButton.classList.remove('disabled');
            }

            //se sono state disegnate almeno due entità, hierarchy deve essere abilitato
            if(entitiesMap.size >1){
                hierarchyButton.classList.remove('disabled');
            }


            break;
        case 'standard.Ellipse': // Attributo composto
            deleteButton.classList.remove('disabled');
            renameButton.classList.remove('disabled');
            attributeButton.classList.remove('disabled');
            break;
        case 'standard.Polygon': // Associazione
            deleteButton.classList.remove('disabled');
            renameButton.classList.remove('disabled');
            attributeButton.classList.remove('disabled'); //n alcuni casi dovrebbe essere disabilitato???
            break;
        case 'standard.Link': // Link
            deleteButton.classList.remove('disabled');
            cardinalitySelect.classList.remove('disabled');
            //se è il link che collega la cella padre all'hub della genarchia anche il pulsante della cardinalità deve essere attivo
            if(shape.getSourceCell().attributes.type === 'standard.Circle'){
                coverageSelect.classList.remove('disabled');
            }
            break;
        case 'standard.Circle': // Associazione
        if(shape.attr('body/fill') !== 'red'){
            deleteButton.classList.remove('disabled');
            renameButton.classList.remove('disabled');
            if(shape.getParentCell().attributes.type !== 'standard.Polygon'){
                keyButton.classList.remove('disabled');
            }
        }
        break;
    }
}


function hideCommandPalette() {
    var palette = document.getElementsByClassName('command-palette')[0];
    palette.style.display = 'none';
}


function checkEntitiesWithoutAttributes(graph) { 
    const entitiesDrawn = graph.getCells().filter(cell => cell.attributes.type === 'standard.Rectangle');
    const links = graph.getLinks();
    var hasErrors = false; 
    var errorElement = document.getElementsByClassName('error-message')[0];

    entitiesDrawn.forEach((e) => {
        if (entitiesMap.get(e.id).getAttributes().size === 0) {
            var partOfHierarchy = false; 
            links.forEach(l => {
                // Verifica se l'entità è collegata a un cerchio rosso
                const isSourceRedCircle = l.getSourceCell().attributes.type === 'standard.Circle' && l.getSourceCell().attr('body/fill') === 'red';
                const isTargetRedCircle = l.getTargetCell().attributes.type === 'standard.Circle' && l.getTargetCell().attr('body/fill') === 'red';
                if ((l.getSourceCell().id === e.id && isTargetRedCircle) || (l.getTargetCell().id === e.id && isSourceRedCircle)) {
                    partOfHierarchy = true;
                }
            });

            // Se non fa parte della gerarchia o è un'entità padre, è un errore
            if (!partOfHierarchy || hierarchyMap.has(e.id)) {
                hasErrors = true; 
            } 
        }
    });

    console.log("Ci sono errori? ", hasErrors);
    
    if (hasErrors) {
        var errorMessage = "Errore: Sono presenti entità non generalizzate senza attributi.";
        console.log(errorMessage);
        if (errorElement) {
            console.log("Sono nell'if più interno");
            errorElement.innerText = errorMessage;
            errorElement.style.display = 'block';
        } else {
            console.error('Elemento di errore non trovato.');
        }
    } else {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

function checkDuplicateLabels() {
    const errorEntities = new Map();
    
    entitiesMap.forEach((entity, id) => {
        const attributes = entity.getAttributes();
        const labelCount = new Map();
        attributes.forEach((cardinality, attribute) => {
            if (attribute && attribute.attr) { 
                const label = attribute.attr('label/text');
                if (label) {
                    labelCount.set(label, (labelCount.get(label) || 0) + 1);
                }
            }
        });

        const duplicateLabels = [...labelCount.entries()].filter(([label, count]) => count > 1);

        if (duplicateLabels.length > 0) {
            errorEntities.set(id, duplicateLabels);
        }
    });

    var errorElement = document.getElementsByClassName('error-message')[0];
    if (errorEntities.size > 0) {
        let errorMessage = "Errore: Sono presenti attributi di una stessa entità che hanno lo stesso nome.";
        
        
        if (errorElement) {
            errorElement.innerText = errorMessage;
            errorElement.style.display = 'block';
        }
        
    } 
    else{
        if(errorElement.innerText=== ''){
            errorElement.style.display = 'none';
        }
        
    }
}



function checkEntitiesWithoutId(graph) { 
    const entitiesDrawn = graph.getCells().filter(cell => cell.attributes.type === 'standard.Rectangle');
    const links = graph.getLinks();
    var hasErrors = false; 
    var errorElement = document.getElementsByClassName('error-message')[0];

    entitiesDrawn.forEach((e) => {
        if (entitiesMap.get(e.id).getId().length === 0) {
            var partOfHierarchy = false; 
            links.forEach(l => {
                // Verifica se l'entità è collegata a un cerchio rosso
                const isSourceRedCircle = l.getSourceCell().attributes.type === 'standard.Circle' && l.getSourceCell().attr('body/fill') === 'red';
                const isTargetRedCircle = l.getTargetCell().attributes.type === 'standard.Circle' && l.getTargetCell().attr('body/fill') === 'red';
                if ((l.getSourceCell().id === e.id && isTargetRedCircle) || (l.getTargetCell().id === e.id && isSourceRedCircle)) {
                    partOfHierarchy = true;
                }
            });

            // Se non fa parte della gerarchia o è un'entità padre, è un errore
            if (!partOfHierarchy || hierarchyMap.has(e.id)) {
                hasErrors = true; 
            } 
        }
    });

    console.log("Ci sono errori? ", hasErrors);
    
    if (hasErrors) {
        var errorMessage = "Errore: Sono presenti entità non generalizzate che non hanno un identificatore.";
        console.log(errorMessage);
        if (errorElement) {
            console.log("Sono nell'if più interno");
            errorElement.innerText = errorMessage;
            errorElement.style.display = 'block';
        } else {
            console.error('Elemento di errore non trovato.');
        }
    } else {
        if(errorElement.innerText=== ''){
            errorElement.style.display = 'none';
        }
    }
}




