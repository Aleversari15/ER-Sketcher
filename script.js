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

var paper = new joint.dia.Paper({
    el: document.getElementById('drawContainer'),
    model: graph,
    gridSize: 1,
    gridSize: 10,
    width: '100%',
    height: 800, //da fixare
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



// Funzione per connettere un'entità (rettangolo) e una associazione/relazione (rombo) 
function createLinkBetweenEntities(shape1, shape2) {
    var link = new joint.shapes.standard.Link;
    link.source(shape1);
    link.target(shape2);
    link.attr({
        line: {
            targetMarker: null
        }
    });
    graph.addCell(link);
}

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
            createLinkBetweenEntities(selectedShapes[0], selectedShapes[1]);
            selectedShapes[0].attr('body/stroke', 'purple');
            selectedShapes[1].attr('body/stroke', 'purple');
            selectedShapes = []; //svuoto il vettore delle entità selezionate
            buttonConnectSelected = false; //deselezione il pulsante per le relations
        }
    }
});

})


  