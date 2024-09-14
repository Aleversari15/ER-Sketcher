document.addEventListener('DOMContentLoaded', function(){
var namespace = joint.shapes;
var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
var selectedShapes = []; 
var cardinalities = ['0-1', '1-1','1-N', '0-N', 'N-N', 'Altro'];
var coverages = ['(t,e)', '(p,e)', '(t,s)', '(p,s)'];
var currentElementSelected = null; 
var linkClicked = null; // da togliere
window.graphScale = 1; //l'ho resa una variabile globale così che tutte le funzioni possano modificarle direttamente senza modificarne una copia. 

//mappe che contengono info che userò per creare il json da mostrare nel pannello laterale
window.entitiesMap = new Map(); //chiave: id dell'entità, elemento: oggetto entity associato
window.relationsMap = new Map();
window.hierarchyMap = new Map();
window.subAttributesMap = new Map();

/*counters: alcuni counters andranno rimossi, basta controllare la lunghezza delle mappe*/
var entityCounter = 0; 
var relationCounter = 0;
var attributesCounter = 0;

/*Booleans*/ 
var buttonEntitySelected = false;
var buttonConnectSelected = false;
var buttonRelationSelected = false;
var selecting = false; 

//può essere un'entità, una relazione, un link o un'attributo
var shapeClicked = null;
var vertices=[];
var linksSelected=[];


//undo e redo
var undoStack = [];
var redoStack = [];


var paper = new joint.dia.Paper({
    el: document.getElementById('drawContainer'),
    model: graph,
    gridSize: 1,
    gridSize: 10,
    width: '100%',
    height: 800,
    drawGrid: true,
    cellViewNamespace: namespace
});


const verticesTool = new joint.linkTools.Vertices({
    attrs: {
        '.vertex': {
            r: 8,  // Raggio del cerchio del vertice
            fill: 'red',  // Colore di riempimento del vertice
            stroke: 'black',  // Colore del bordo del vertice
            'stroke-width': 2  // Spessore del bordo del vertice
        }
    }
});


// Applicare lo strumento di vertici personalizzato al collegamento
const toolsView = new joint.dia.ToolsView({
    tools: [verticesTool]
});


// Popola il menu a tendina con le opzioni del vettore cardinalities
var selectCardinality = document.getElementsByClassName('cardinality')[0];
cardinalities.forEach(function(value) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectCardinality.appendChild(option);
});

// Popola il menu a tendina con le opzioni del vettore coverage (coperture della gerarchia)
var selectCoverage =  document.getElementsByClassName('coverage')[0];
coverages.forEach(function(value) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectCoverage.appendChild(option);
});

/*Quando l'utente clicca sul pulsante entity*/ 
document.querySelector('.buttonDrawEntity').addEventListener('click', function(){
    entityCounter++;
    buttonEntitySelected=true;
})

/*Quando l'utente clicca sul pulsante relation*/ 
document.querySelector('.buttonRelation').addEventListener('click', function(){
    relationCounter++;
    buttonRelationSelected = true;
})

//Quando l'utente clicca sul bottone Connect
document.querySelector('.buttonConnect').addEventListener('click', function(){
    relationCounter++;
    buttonConnectSelected = true;
})


/*Quando l'utente clicca sul riquadro per il disegno dopo aver selezionato il bottone entity*/ 
document.querySelector('.drawContainer').addEventListener('click', function(event){
    var shape = event.target.getBoundingClientRect(); // Ottieni le dimensioni e la posizione dell'elemento
    var mouseX = event.clientX - shape.left; // Calcola la coordinata X rispetto all'elemento
    var mouseY = event.clientY - shape.top; // Calcola la coordinata Y rispetto all'elemento

    if(buttonEntitySelected===true){
        var rect = new joint.shapes.standard.Rectangle();
        rect.position(mouseX, mouseY);
        rect.resize(150, 80);
        rect.attr({
            body: {
                fill: 'white',
                cursor: 'pointer'
            },
            label: {
                text: 'ENTITY' + entityCounter,
                fill: 'black',
                fontSize: 16
            }
        });
        rect.addTo(graph);
        buttonEntitySelected = false; 
        entitiesMap.set(rect.id, new Entity());
    }
    else if(buttonRelationSelected === true){
        var diamond = new joint.shapes.standard.Polygon();
        diamond.resize(120, 120);
        diamond.position(mouseX, mouseY - 60);
        diamond.attr('root/title', 'joint.shapes.standard.Polygon');
        diamond.attr('label/text', 'RELATION'+relationCounter);
        diamond.attr('body/refPoints', '0,10 10,0 20,10 10,20');
        diamond.addTo(graph);
        buttonRelationSelected = false;
        relationsMap.set(diamond.id, new Association(diamond.attr('label/text'))); //aggiungo la relazione alla mappa
    }
});



// Aggiungi l'evento di doppio clic a tutti i rettangoli e rombi, che da la possibilità di selezionarli
paper.on('element:pointerdblclick', function(cellView) {
    var cell = cellView.model;
    if (cell.isElement() && (cell.attributes.type === 'standard.Rectangle' || cell.attributes.type === 'standard.Polygon' ) && buttonConnectSelected) {
        if (!selectedShapes.includes(cell)) {
            selectedShapes.push(cell);
            cell.attr('body/stroke', 'yellow');
        }
        /**Se sono state selezionate due shapes e una è un rettangolo e l'altra un rombo allora posso fare l'associazione, svuotare il vettore e deselezionare il bottone */
        if (selectedShapes.length === 2 && ((selectedShapes[0].attributes.type === 'standard.Rectangle' && selectedShapes[1].attributes.type === 'standard.Polygon') || 
        (selectedShapes[0].attributes.type === 'standard.Polygon' && selectedShapes[1].attributes.type === 'standard.Rectangle'))) {
            createLinkBetweenEntities(selectedShapes[0], selectedShapes[1], graph);
            selectedShapes[0].attr('body/stroke', 'purple');
            selectedShapes[1].attr('body/stroke', 'purple');
            
            //riempio la mappa che mi servirà per il json del pannello laterale
            if(selectedShapes[0].attributes.type === 'standard.Polygon'){
                var association = relationsMap.get(selectedShapes[0].id);
                association.addEntityConnection(selectedShapes[1], '1-N');
                
            }else{
                var association = relationsMap.get(selectedShapes[1].id);
                association.addEntityConnection(selectedShapes[0], '1-N');
            }  

            selectedShapes = []; //svuoto il vettore delle entità selezionate
            buttonConnectSelected = false; //deselezione il pulsante per le relations

        }
    }
    //se la selezione è attiva e clicco su un rettangolo
    else if(selecting && (cell.isElement() && (cell.attributes.type === 'standard.Rectangle'))){
        //metodo che dato un'entità figlia e una padre, crea la gerarchia

        //setParent(currentElementSelected, cell, graph, hierarchyMap); 
        if(!hierarchyMap.get(cell.id)){
            hierarchyMap.set(cell.id, new Generalization());
        }
        var gen = hierarchyMap.get(cell.id);
        gen.addEntityGeneralization(currentElementSelected, '(t,e)');

        //controllare
        createBranchingLinks(cell, hierarchyMap.get(cell.id), graph, '(t,e)');
        selecting = false; 

    }
});


//Quando l'utente clicca nel bottone 'edit JSON' nel pannello laterale che si apre deve comparire il JSON del diagramma
document.querySelector('.openJSON').addEventListener('click', function(){
    createJsonForPanel(graph, document, relationsMap, hierarchyMap,entitiesMap,subAttributesMap);
    document.getElementById("mySidepanel").style.width = "500px"; 
    
});

document.querySelector('.closebtn').addEventListener('click', function(){
    document.getElementById("mySidepanel").style.width = "0";
})


// Aggiungi l'ascoltatore di eventi per il clic sulle shape
paper.on('element:pointerdown', function(elementView) {
    if(shapeClicked!=elementView.model){
        if(shapeClicked){
            shapeClicked.attr('body/stroke-width', 1); 
        }
        
        showCommandPalette(elementView.model, entitiesMap, relationsMap, hierarchyMap, subAttributesMap);
        elementView.model.attr('body/stroke-width', 3); 
        shapeClicked = elementView.model; 
    }
});


//EVENTI CLICK SU COMANDI PALETTE
document.getElementsByClassName('delete-button')[0].addEventListener('click', function() {
    deleteShape(shapeClicked);
    shapeClicked = null;
});

document.getElementsByClassName('rename-button')[0].addEventListener('click', function() {
    console.log(shapeClicked);
    renameShape(shapeClicked, entitiesMap);
    shapeClicked = null;
});

document.getElementsByClassName('key-button')[0].addEventListener('click', function(){
    setKey(shapeClicked);
    var objEntity = entitiesMap.get(shapeClicked.getParentCell());
    var id = [];
    id.push(shapeClicked);
    objEntity.setId(id);
    shapeClicked = null;
})

document.getElementsByClassName('attribute-button')[0].addEventListener('click', function(){
    attributesCounter++;
    addAttributeToShape(shapeClicked,graph, attributesCounter, 'normal', subAttributesMap);
    shapeClicked = null;
})

document.getElementsByClassName('cardinality')[0].addEventListener('click', function(){
   
    shapeClicked = null;
})

document.getElementsByClassName('subAttribute')[0].addEventListener('click', function(){
    attributesCounter++;
    addAttributeToShape(shapeClicked,graph, attributesCounter, 'subattribute', subAttributesMap);
    shapeClicked = null;
})

//gestione di eventi per il disegno di id esterni o composti
document.querySelector('.extId').addEventListener('click', function(){
    selecting = true; 
    vertices=[];
    linksSelected=[];
})


document.querySelector('.composedId').addEventListener('click', function(){
    selecting = true; 
    vertices=[];
    linksSelected=[];
})

paper.on('link:pointerdblclick', function(linkView) {
    if (selecting) {
        // Ottieni la sorgente e la destinazione del link (coordinate)
        var sourcePoint = linkView.sourceAnchor;
        var targetPoint = linkView.targetAnchor;

        // Controlla che siano definiti correttamente
        if (!sourcePoint || !targetPoint) {
            console.warn('I punti di origine o destinazione non sono definiti.');
            return;
        }

        // Calcola il punto centrale tra origine e destinazione
        var midPoint = {
            x: (sourcePoint.x + targetPoint.x) / 2,
            y: (sourcePoint.y + targetPoint.y) / 2
        };

        // Applica un offset per evitare il centro esatto
        var offsetX = 20; // Sposta di 20 pixel lungo l'asse X
        var offsetY = 10; // Sposta di 10 pixel lungo l'asse Y

        // Crea il punto spostato
        var shiftedPoint = {
            x: midPoint.x + offsetX,
            y: midPoint.y + offsetY
        };

        // Aggiungi il punto spostato ai vertici e seleziona il link
        vertices.push(shiftedPoint);
        linksSelected.push(linkView.model);

        // Debug: visualizza il punto calcolato nella console
        console.log('Punto spostato:', shiftedPoint);
    }
});


paper.on('blank:pointerclick', function(){
    if(selecting === true){
        var idExtAllowed = false;
        var cointainsEXternalLink = false;

        linksSelected.forEach((l) => {
            if(l.getSourceCell().attributes.type === 'standard.Polygon' || l.getTargetCell().attributes.type === 'standard.Polygon'){
                cointainsEXternalLink = true;
            
                if( l.label(0).attrs.text.text === '1-1'){ //anche (0,1)???
                    idExtAllowed = true;
                    
                }
            }
        })

        console.log("id esterno possibile: ", idExtAllowed);
        console.log("Tentativo di creare id esterno: ", cointainsEXternalLink);


        //richiesto ext id ed è possibile realizzarlo
        if(idExtAllowed && cointainsEXternalLink){
            console.log("stai creando un id esterno");
            createKeyFromLinks(vertices, graph, linksSelected, paper, toolsView);
            
        }
        else if( idExtAllowed === false && cointainsEXternalLink){
            console.log("NON puoi creare un id esterno");
             // Mostra il messaggio d'errore
            var errorMessage = "Errore: Non è possibile creare un identificatore esterno per questa entità, la cardinalità del link è diversa da (1,1).";
            var errorElement = document.getElementsByClassName('error-message')[0];
            errorElement.innerText = errorMessage;
            errorElement.style.display = 'block';

            // Nascondi il messaggio dopo 5 secondi
            setTimeout(function() {
                errorElement.style.display = 'none';
            }, 5000);

            
        }
        else if(!cointainsEXternalLink){
            console.log("stai creando un id composto");
            createKeyFromLinks(vertices, graph, linksSelected, paper, toolsView);
            
        }
        
        var entity = linksSelected[0].getSourceCell().getParentCell();
        var objEntity = entitiesMap.get(entity.id);
        var attributes = [];
        linksSelected.forEach((l) => {
            if(l.getSourceCell().attributes.type === 'standard.Circle'){
                attributes.push(l.getSourceCell());
            }
            else{
                var rel;
                if(l.getSourceCell().attributes.type === 'standard.Polygon'){
                    rel = l.getSourceCell();
                }
                else if(l.getTargetCell().attributes.type === 'standard.Polygon'){
                    rel = l.getTargetCell();
                }
                attributes.push(rel);
            }
            
        })
        objEntity.setId(attributes);
        
        selecting = false; 
        linksSelected=[];
        vertices = [];
    }
    
} )

document.querySelector('.hierarchy').addEventListener('click', function(){
    selecting = true; 
    currentElementSelected = shapeClicked; //da sistemare 
    console.log("Entità selezionata: ", currentElementSelected);
})


// Gestisce la selezione di un link
paper.on('link:pointerclick', function(linkView) {
    shapeClicked = linkView.model; //perchè non funziona quando lo passo alla funzione per aggiornare la cardinalità?
    linkClicked = linkView.model;
    showCommandPalette(linkView.model);
    console.log('Link selezionato:', shapeClicked);
});




//metodi che gestiscono i cambi di valore nei select, sono da aggiungere ancora molti dettagli. Il primo deve essere applicato solo ai link standard, il secondo a quelli di tipo gerachia. 

// Gestisce il cambio del valore del menu a tendina per la cardinalità
selectCardinality.addEventListener('change', function() {
    var value = selectCardinality.value;
    updateLinkLabel(linkClicked, value); 
    linkClicked = null;
    shapeClicked= null;
});

/**
 * Se viene modificato il valore del menù a tendina riguardante la copertura, modifica la copertura del link della gerarchia selezionato,
 * se e solo se si tratta del link che collega l'entità padre all'hub (in questo modo non è possibile assegnare la cardinalità ai singoli 
 * link collegati alle celle figlie)
 */
selectCoverage.addEventListener('change', function() {
    var value = selectCoverage.value;
    var entity = linkClicked.getTargetCell();
    var generalization = hierarchyMap.get(entity.id);
    console.log("Entità padre: ", entity.attr("label/text"));
    console.log("Generalizzazione: ", generalization);
    if(generalization && linkClicked.getSourceCell().id === generalization.getHub().id){
        updateLinkLabel(linkClicked, value, relationsMap, hierarchyMap);
    }
    else{
        // Mostra il messaggio d'errore
        var errorMessage = "Errore: Non è possibile assegnare la copertura a questo link.";
        var errorElement = document.getElementsByClassName('error-message')[0];
        errorElement.innerText = errorMessage;
        errorElement.style.display = 'block';

        // Nascondi il messaggio dopo 5 secondi (5000 millisecondi)
        setTimeout(function() {
            errorElement.style.display = 'none';
        }, 5000);
    }
    linkClicked = null;
    shapeClicked= null;
});


// Gestione del click sul bottone per il download
document.getElementsByClassName('download')[0].addEventListener('click', function(){ 
    downloadJson(graph, document);

});


// Gestione del click sul bottone per il caricamento del file
document.querySelector('.loadFile').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

// Gestione del caricamento del file
/*document.getElementById('fileInput').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var graphData = JSON.parse(e.target.result);
                graph.fromJSON(graphData);
            } catch (error) {
                console.error("Errore durante il parsing del file JSON:", error);
                alert("Errore durante il caricamento del file. Assicurati che sia un file JSON valido.");
            }
        };
        reader.readAsText(file);
    }
});*/
document.getElementById('fileInput').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var loadedData = JSON.parse(e.target.result);
                
                // Ripristina il grafo dal file JSON
                if (loadedData.graph) {
                    graph.fromJSON(loadedData.graph);
                }

                // Ripristina le mappe personalizzate utilizzando la funzione di importazione personalizzata
                if (loadedData) {
                    importFromJSON(e.target.result, graph);
                }

                console.log("Mappe personalizzate caricate correttamente");

            } catch (error) {
                console.error("Errore durante il parsing del file JSON:", error);
                alert("Errore durante il caricamento del file. Assicurati che sia un file JSON valido.");
            }
        };
        reader.readAsText(file);
    }
});



    //GESTIONE UNDO E REDO
    // Funzione per ottenere lo stato attuale del diagramma come JSON
    function saveCurrentState() {
        return JSON.stringify(graph.toJSON());
    }

    // Funzione per ripristinare lo stato del diagramma da un JSON
    function restoreState(json) {
        graph.fromJSON(JSON.parse(json));
    }

    // Salva lo stato corrente nello stack di undo e ripulisce lo stack di redo
    function saveStateForUndo() {
        undoStack.push(saveCurrentState());
        redoStack = []; 
    }


    function undo() {
        if (undoStack.length > 0) {
            var currentState = saveCurrentState();
            redoStack.push(currentState);

            var previousState = undoStack.pop(); // Ripristina lo stato precedente
            restoreState(previousState);
        }
    }


    function redo() {
        if (redoStack.length > 0) {
            var currentState = saveCurrentState(); 
            undoStack.push(currentState);

            var nextState = redoStack.pop(); // Ripristina lo stato successivo
            restoreState(nextState);
        }
    }


    graph.on('change', function(cell) {
        saveStateForUndo();
    });

    graph.on('add', function(cell) {
        saveStateForUndo();
    });

    graph.on('remove', function(cell) {
        saveStateForUndo();
    });

    document.querySelector('.undo').addEventListener('click', function() {
        undo();
    });

    document.querySelector('.redo').addEventListener('click', function() {
        redo();
    });


    //GESTIONE COPY AND PASTE
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'v') {
            // Incolla gli elementi
            pasteElements(graph,localStorage);
        }
    });

    // Evento di inizio trascinamento (mousedown)
    paper.on('blank:pointerdown', function(event, x, y) {
        selectionStartPoint = { x, y };
        selectionRect = new joint.shapes.standard.Rectangle();
        selectionRect.position(x, y);
        selectionRect.resize(1, 1);  
        selectionRect.attr({
            body: {
                fill: 'rgba(0, 153, 255, 0.3)',
                stroke: '#3399ff',
                strokeWidth: 1,
                strokeDasharray: '5,5'
            }
        });
        selectionRect.addTo(graph);
    });

    // Evento di trascinamento (mousemove)
    paper.on('cell:pointermove blank:pointermove', function(event, x, y) {
        if (!selectionStartPoint) return;

        const width = Math.abs(x - selectionStartPoint.x);
        const height = Math.abs(y - selectionStartPoint.y);
        const position = {
            x: Math.min(x, selectionStartPoint.x),
            y: Math.min(y, selectionStartPoint.y)
        };
        selectionRect.position(position.x, position.y);
        selectionRect.resize(width, height);
    });

    // Evento di fine trascinamento (mouseup)
    paper.on('cell:pointerup blank:pointerup', function(event, x, y) {
        if (!selectionStartPoint) return;

        const selectionBBox = selectionRect.getBBox();

        const selectedElements = paper.findViewsInArea(selectionBBox);
        selectionRect.remove();
        selectionRect = null;
        selectionStartPoint = null;

        if (selectedElements.length > 0) {
            copyElements(graph, selectedElements.map(view => view.model),localStorage);
        }
    });



    //Aggiungo gli event listener per i bottoni di zoom.
    document.querySelector(".zoomIn").addEventListener('click', function(){ 
        zoomIn(paper) });

    document.querySelector(".zoomOut").addEventListener('click', function(){ 
        zoomOut(paper) });


    //GESTIONE CONTROLLI SUL DISEGNO
    // Imposta l'intervallo per eseguire il controllo ogni 5 secondi
    setInterval(() => {
        checkEntitiesWithoutAttributes(graph);
        checkEntitiesWithoutId(graph);
        checkDuplicateLabels();
    }, 5000); 

    
    
}); 