document.addEventListener('DOMContentLoaded', function(){
var namespace = joint.shapes;
var graph = new joint.dia.Graph({}, { cellNamespace: namespace });
var diagramEntities = []; 
var selectedRectangles = []; 

/*counters*/
var entityCounter = 0;
var relationCounter = 0;

/*Booleans*/ 
var buttonEntitySelected = false;
var buttonCreateRelationSelected = false;

var paper = new joint.dia.Paper({
    el: document.getElementById('drawContainer'),
    model: graph,
    gridSize: 1,
    gridSize: 10,
    drawGrid: true,
    cellViewNamespace: namespace
});

/*Quando l'utente clicca sul pulsante entity*/ 
document.querySelector('.buttonDrawEntity').addEventListener('click', function(){
    entityCounter++;
    buttonEntitySelected=true;
})

/*Quando l'utente clicca sul riquadro per il disegno dopo aver selezionato il bottone entity*/ 
document.querySelector('.drawContainer').addEventListener('click', function(event){
    var rect = event.target.getBoundingClientRect(); // Ottieni le dimensioni e la posizione dell'elemento
    var mouseX = event.clientX - rect.left; // Calcola la coordinata X rispetto all'elemento
    var mouseY = event.clientY - rect.top; // Calcola la coordinata Y rispetto all'elemento

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
        diagramEntities.push(rect);  //in un vettore mi salvo tutte le entità che aggiungo
        buttonEntitySelected = false;
    }
    }
);


//Quando l'utente clicca sul bottone relation
document.querySelector('.buttonCreateRelation').addEventListener('click', function(){
    relationCounter++;
    buttonCreateRelationSelected = true;
})

// Funzione per creare un'associazione tra due entità
function createLinkBetweenEntities(entity1, entity2) {
    var link = new joint.shapes.standard.Link({
        source: entity1,
        target: entity2
    });
    graph.addCell(link);
}

// Aggiungi l'evento di doppio clic a tutti i rettangoli
paper.on('element:pointerdblclick', function(cellView) {
    var cell = cellView.model;
    if (cell.isElement() && cell.attributes.type === 'standard.Rectangle' && buttonCreateRelationSelected) {
        if (!selectedRectangles.includes(cell)) {
            selectedRectangles.push(cell);
            console.log('Rettangolo selezionato');
            cell.attr('body/stroke', 'yellow');
        }
        if (selectedRectangles.length === 2) {
            createLinkBetweenEntities(selectedRectangles[0], selectedRectangles[1]);
            selectedRectangles[0].attr('body/stroke', 'purple');
            selectedRectangles[1].attr('body/stroke', 'purple');
            selectedRectangles = []; //svuoto il vettore delle entità selezionate
            buttonCreateRelationSelected = false; //deselezione il pulsante per le relations
        }
    }
});

})


  