document.addEventListener('DOMContentLoaded', function(){
var namespace = joint.shapes;
var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
var selectedShapes = []; 
var cardinalities = ['0-1', '1-1','1-N', '0-N', 'N-N', 'Altro'];
var coverages = ['(t,e)', '(p,e)', '(t,s)', '(p,s)'];
var currentElementSelected = null; 
var linkClicked = null; // da togliere



/*counters*/
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
var links=[];
var linksId=[];

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



// Popola il menu a tendina con le opzioni del vettore cardinalities
var selectCardinality = document.getElementsByClassName('cardinality')[0];
cardinalities.forEach(function(value) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectCardinality.appendChild(option);
});


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

//Quando l'utente clicca sul bottone relation
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
            selectedShapes = []; //svuoto il vettore delle entità selezionate
            buttonConnectSelected = false; //deselezione il pulsante per le relations
        }
    }
    //se la selezione è attiva e clicco su un rettangolo
    else if(selecting && (cell.isElement() && (cell.attributes.type === 'standard.Rectangle'))){
        //metodo che dato un'entità figlia e una padre, crea la gerarchia
        setParent(currentElementSelected, cell, graph); 
        selecting = false; 

    }
});


//Quando l'utente clicca nel bottone 'edit JSON' nel pannello laterale che si apre deve comparire il JSON del diagramma
document.querySelector('.openJSON').addEventListener('click', function(){
    //inserisco le info nel pannello 
    updateJSONList(graph);
    //rendo il pannello visibile
    document.getElementById("mySidepanel").style.width = "500px"; 
    
});

document.querySelector('.closebtn').addEventListener('click', function(){
    document.getElementById("mySidepanel").style.width = "0";
})


// Aggiungi l'ascoltatore di eventi per il clic sulle shape
paper.on('element:pointerdown', function(elementView) {
    if(shapeClicked!=elementView.model){
        showCommandPalette(elementView.model);
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
    renameShape(shapeClicked);
    shapeClicked = null;
});

document.getElementsByClassName('key-button')[0].addEventListener('click', function(){
    setKey(shapeClicked);
    shapeClicked = null;
})

document.getElementsByClassName('attribute-button')[0].addEventListener('click', function(){
    attributesCounter++;
    addAttributeToShape(shapeClicked,graph, attributesCounter);
    shapeClicked = null;
})

document.getElementsByClassName('cardinality')[0].addEventListener('click', function(){
   
    shapeClicked = null;
})

document.querySelector('.composedId').addEventListener('click', function(){
    selecting = true; 
    links=[];
    linksId=[];
})

paper.on('link:pointerdblclick', function(linkView) {
    if(selecting){
        links.push(linkView.getBBox().center());
        linksId.push(linkView.model);
    }
});

paper.on('blank:pointerclick', function(){
    if(selecting === true){
        //disegno il link
        createKeyFromLinks(links, graph, linksId)
        selecting = false; 
        links=[];
    }
    
} )

document.querySelector('.hierarchy').addEventListener('click', function(){
    selecting = true; 
    currentElementSelected = shapeClicked; //da sistemare 
    console.log("Entità selezionata: ", currentElementSelected);
})

document.querySelector('.extId').addEventListener('click', function(){
    selecting = true; 
    links=[];
    linksId=[];
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

// Gestisce il cambio del valore del menu a tendina per la copertura della gerarchia
selectCoverage.addEventListener('change', function() {
    var value = selectCoverage.value;
    updateLinkLabel(linkClicked, value);
    linkClicked = null;
    shapeClicked= null;
});




})


  