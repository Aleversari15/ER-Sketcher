
function createJsonForPanel(graph, document, relationsMap, hierarchyMap, entitiesMap){
    var jsonContainer = document.querySelector('.json-container');
    jsonContainer.innerHTML = ''; // Svuota la lista prima di aggiungere gli elementi

    var json = getHierarchicalJSON(graph, relationsMap, hierarchyMap,entitiesMap);
    jsonContainer.innerHTML = JSON.stringify(json, null, 2);

    hljs.highlightBlock(jsonContainer);
}


// Funzione per ottenere una rappresentazione gerarchica delle celle in formato JSON
function getHierarchicalJSON(graph, relationsMap,hierarchyMap,entitiesMap) {
    var cells = graph.getCells();
    var hierarchy = [];

    cells.forEach(function(cell) {
        var parent = null;
        if (cell.get('embeds') && cell.get('embeds').length > 0) {
            
            //entità 
            if(cell.attributes.type ===  'standard.Rectangle'){
                parent = {
                    Entity: cell.attr('label/text'), 
                    Attributes: [],
                    Identifier: []
                };
    
                cell.get('embeds').forEach(function(childId) {
                    var child = graph.getCell(childId);
                    if (child) {
                        var childText = child.attr('label/text');
                        // Aggiungi la condizione per controllare il colore del riempimento del corpo
                        if (child.attr('body/fill') === 'black') {
                            childText += ` (id)`;
                        }
                        parent.Attributes.push({
                            Attribute: child.attr('label/text') 
                        });
                    }
                });

                //stampo l'identificatore (singolo/composto/esterno)
                var objEntity = entitiesMap.get(cell);
                if(objEntity){
                    var ids = [];
                    objEntity.getId().forEach((idCell) => {
                        ids.push(idCell.attr('label/text') );
                    })
                    parent.Identifier.push(ids);  
                }
                hierarchy.push(parent);
            }
            
            
        }
        //associazioni 
        if(cell.attributes.type ===  'standard.Polygon'){
            var parent = {
                Relation: cell.attr('label/text'), 
                Attributes: [],
                Entities_connected: []
            };
            //prima quelle con qualche attributo 
            if(cell.get('embeds')){

                cell.get('embeds').forEach(function(childId) {
                    var child = graph.getCell(childId);
                    if (child) {
                        parent.Attributes.push({
                            Attribute: child.attr('label/text') 
                        });
                    }
                });
            }
            const association = relationsMap.get(cell.id);

            if (association) {
                const entityConnections = association.getAllEntityConnections();
                entityConnections.forEach(([entity, cardinality]) => {
                    parent.Entities_connected.push({
                        Entity: entity.attr('label/text'),
                        Cardinality: cardinality
                    });
                });
            } 
            hierarchy.push(parent);
        }
        
        //gerarchie
        const generalization = hierarchyMap.get(cell.id);
       
        if (generalization) {

            parent = {
                Entity: cell.attr('label/text'), 
                Entities_generalized: []
            };
            const entitiesGeneralized = generalization.getAllEntityGeneralizations();
            entitiesGeneralized.forEach(([entity, coverage]) => {
                parent.Entities_generalized.push({
                Entity: entity.attr('label/text'),
                Coverage: coverage
                });
            });
            hierarchy.push(parent);
        } 

        
    });

    
    return hierarchy;
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
