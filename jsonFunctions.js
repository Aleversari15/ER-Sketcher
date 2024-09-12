
function createJsonForPanel(graph, document, relationsMap, hierarchyMap, entitiesMap,subAttributesMap){
    var jsonContainer = document.querySelector('.json-container');
    jsonContainer.innerHTML = ''; // Svuota la lista prima di aggiungere gli elementi

    var json = getHierarchicalJSON(graph, relationsMap, hierarchyMap,entitiesMap,subAttributesMap);
    jsonContainer.innerHTML = JSON.stringify(json, null, 2);

    hljs.highlightBlock(jsonContainer);
}


// Funzione per ottenere una rappresentazione gerarchica delle celle in formato JSON
function getHierarchicalJSON(graph, relationsMap,hierarchyMap,entitiesMap, subAttributesMap) {
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
                        if(!subAttributesMap.get(child.id)){
                            parent.Attributes.push({
                                Attribute: child.attr('label/text') 
                            });
                        }
                        //se si tratta di un gruppo di attributi devo stampare anche tutti i singoli subattributi
                        else{
                            var compositeAttribute = subAttributesMap.get(child.id);
                            var subAttributesList = compositeAttribute.getSubAttributes();
                            
                            var attributeGroup = {
                                Attribute: child.attr('label/text'), // Nome del gruppo di attributi
                                SubAttributes: []  // Lista di sub-attributi
                            };
            
                            // Itera sulla mappa dei sub-attributi
                            subAttributesList.forEach((cardinality, subAttribute) => {
                                var subAttrObj = {
                                    SubAttribute: subAttribute.attr('label/text')
                                };
            
                                // Aggiungi il campo Cardinality solo se non è null
                                if (cardinality !== null) {
                                    subAttrObj.Cardinality = cardinality;
                                }
            
                                attributeGroup.SubAttributes.push(subAttrObj);
                            });
            
                            // Aggiungi il gruppo di attributi a Attributes
                            parent.Attributes.push(attributeGroup);
                        }
                        
                    }
                });

                //stampo l'identificatore (singolo/composto/esterno)
                var objEntity = entitiesMap.get(cell.id);
                console.log("Entità di riferimento: ", entitiesMap.get(cell.id))
                if(objEntity){
                    var ids = [];
                    (objEntity.getId()).forEach((idCell) => {
                        if(idCell.attributes.type === 'standard.Polygon'){
                            ids.push('External identifier from ' + idCell.attr('label/text') );
                        }
                        else{
                            ids.push(idCell.attr('label/text') );
                        }
                        
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
                Coverage: generalization.getCoverage(), 
                Entities_generalized: []
            };
            const entitiesGeneralized = generalization.getAllEntityGeneralizations();
            entitiesGeneralized.forEach((entity) => {
                parent.Entities_generalized.push({
                Entity: entity.attr('label/text'),
                });
            });
            hierarchy.push(parent);
        } 

        
    });

    
    return hierarchy;
}



/*function downloadJson(graph, document){
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
*/
function downloadJson(graph, document) {
    var projectName = document.querySelector('.nomeProgetto').value;
    if (!projectName) {
        projectName = 'diagram_er';
    }

    // Ottieni i dati del grafo in formato JSON
    var graphJSON = graph.toJSON();

    // Converti le mappe in un formato serializzabile (array di coppie chiave-valore)
    var exportData = {
        graph: graphJSON,
        entitiesMap: Array.from(window.entitiesMap.entries()),
        relationsMap: Array.from(window.relationsMap.entries()),
        hierarchyMap: Array.from(window.hierarchyMap.entries()),
        subAttributesMap: Array.from(window.subAttributesMap.entries())
    };

    // Converti l'oggetto in stringa JSON
    var dataStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([dataStr], { type: "application/json" });
    var url = URL.createObjectURL(blob);

    // Crea un elemento <a> temporaneo per il download
    var a = document.createElement('a');
    a.href = url;
    a.download = projectName + '.json';

    // Simula il click per avviare il download
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

function importFromJSON(savedData, graph) {
    // Parsing del JSON
    var importedData;
    try {
        importedData = JSON.parse(savedData);
    } catch (error) {
        console.error("Errore durante il parsing del file JSON:", error);
        alert("Errore durante il parsing del file JSON.");
        return;
    }

    // Importiamo le celle nel grafico
    if (importedData.graph) {
        graph.fromJSON(importedData.graph);
    } else {
        console.warn("Dati del grafo non trovati nel JSON.");
    }

    // Ricostruzione della entitiesMap
    entitiesMap.clear();  // Svuota la mappa prima di importare nuovi dati
    if (importedData.entitiesMap) {
        importedData.entitiesMap.forEach(([key, value]) => {
            var newEntity = new Entity();

            // Verifica che value.id sia definito e sia un array
            if (value.id && Array.isArray(value.id)) {
                // Recupera i riferimenti alle celle
                var ids = value.id.map(cell => graph.getCell(cell.id));  // Usa cell.id per ottenere la cella
                newEntity.setId(ids);
            } else {
                console.warn(`ID dell'entità non trovato o non valido per la chiave ${key}`);
            }

            // Ricostruisci gli attributi e le cardinalità
            if (value.attributes) {
                Object.entries(value.attributes).forEach(([attributeId, cardinality]) => {
                    var attributeCell = graph.getCell(attributeId);  // Recupera la cella
                    if (attributeCell) {
                        newEntity.addAttribute(attributeCell, cardinality);
                    } else {
                        console.warn(`Attributo non trovato per ID ${attributeId}`);
                    }
                });
            } else {
                console.warn(`Attributi non trovati per la chiave ${key}`);
            }

            entitiesMap.set(key, newEntity);  // Aggiungi l'entità alla mappa
        });
    } else {
        console.warn("Mappa delle entità non trovata nel JSON.");
    }

    // Ricostruzione della relationsMap
    relationsMap.clear();
    if (importedData.relationsMap) {
        importedData.relationsMap.forEach(([key, value]) => {
            var newAssociation = new Association(value.name);

            // Ricostruisci le connessioni con le entità
            if (value.entitiesConnected) {
                value.entitiesConnected.forEach(([entityId, cardinality]) => {
                    var entityCell = graph.getCell(entityId);
                    if (entityCell) {
                        newAssociation.addEntityConnection(entityCell, cardinality);
                    } else {
                        console.warn(`Entità non trovata per ID ${entityId}`);
                    }
                });
            } else {
                console.warn(`Connessioni con le entità non trovate per la chiave ${key}`);
            }

            // Ricostruisci gli attributi dell'associazione
            if (value.attributes) {
                value.attributes.forEach((attributeId) => {
                    var attributeCell = graph.getCell(attributeId);
                    if (attributeCell) {
                        newAssociation.addAttribute(attributeCell);
                    } else {
                        console.warn(`Attributo non trovato per ID ${attributeId}`);
                    }
                });
            } else {
                console.warn(`Attributi non trovati per la chiave ${key}`);
            }

            relationsMap.set(key, newAssociation);
        });
    } else {
        console.warn("Mappa delle associazioni non trovata nel JSON.");
    }

    // Ricostruzione della hierarchyMap
    hierarchyMap.clear();
    if (importedData.hierarchyMap) {
        importedData.hierarchyMap.forEach(([key, value]) => {
            var newGeneralization = new Generalization();

            // Ricostruisci il coverage
            if (value.coverage) {
                newGeneralization.setCoverage(value.coverage);
            } else {
                console.warn(`Coverage non trovato per la chiave ${key}`);
            }

            // Ricostruisci l'hub
            if (value.hub) {
                var hubCell = graph.getCell(value.hub);
                if (hubCell) {
                    newGeneralization.setHub(hubCell);
                } else {
                    console.warn(`Hub non trovato per ID ${value.hub}`);
                }
            }

            // Ricostruisci le entità generalizzate
            if (value.entitiesGeneralized) {
                value.entitiesGeneralized.forEach((entityId) => {
                    var entityCell = graph.getCell(entityId);
                    if (entityCell) {
                        newGeneralization.addEntityGeneralization(entityCell);
                    } else {
                        console.warn(`Entità generalizzata non trovata per ID ${entityId}`);
                    }
                });
            } else {
                console.warn(`Entità generalizzate non trovate per la chiave ${key}`);
            }

            hierarchyMap.set(key, newGeneralization);
        });
    } else {
        console.warn("Mappa delle gerarchie non trovata nel JSON.");
    }

    // Ricostruzione della subAttributesMap
    subAttributesMap.clear();
    if (importedData.subAttributesMap) {
        importedData.subAttributesMap.forEach(([key, value]) => {
            var newGroupAttribute = new groupAttribute();

            // Ricostruisci i sub-attributi
            if (value.subAttributes) {
                value.subAttributes.forEach((subAttributeId) => {
                    var subAttributeCell = graph.getCell(subAttributeId);
                    if (subAttributeCell) {
                        newGroupAttribute.addSubAttribute(subAttributeCell);
                    } else {
                        console.warn(`Sub-attributo non trovato per ID ${subAttributeId}`);
                    }
                });
            } else {
                console.warn(`Sub-attributi non trovati per la chiave ${key}`);
            }

            subAttributesMap.set(key, newGroupAttribute);
        });
    } else {
        console.warn("Mappa dei sub-attributi non trovata nel JSON.");
    }

    console.log("Importazione completata con successo!");
}
