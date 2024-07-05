document.addEventListener('DOMContentLoaded', function(){
var namespace = joint.shapes;
var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
var selectedShapes = []; 

/*counters*/
var entityCounter = 0;
var relationCounter = 0;

/*Booleans*/ 
var buttonEntitySelected = false;
var buttonConnectSelected = false;
var buttonRelationSelected = false;

//può essere un'entità, una relazione, un link o un'attributo
var shapeClicked = null;

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
    addAttributeToShape(shapeClicked,graph);
    shapeClicked = null;
})


})


  