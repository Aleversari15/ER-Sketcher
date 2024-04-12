document.addEventListener('DOMContentLoaded', function(){
var namespace = joint.shapes;
var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

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
                fill: 'white'
            },
            label: {
                text: 'ENTITY' /*aggiungere counter entity*/,
                fill: 'black',
                fontSize: 16

            }
        });
        rect.addTo(graph);
        buttonEntitySelected = false;
    }
    else if(buttonCreateRelationSelected === true){
        var rel = new joint.shapes.standard.Polygon();
        rel.attr('root/title', 'joint.shapes.standard.Polygon');
        rel.attr('label/text', 'RELATION');
        rel.attr('body/refPoints', '0,10 10,0 20,10 10,20');
        rel.attr('body/fill', 'white');
        rel.addTo(graph);
        buttonCreateRelationSelected = false;
    } 
});

document.querySelector('.buttonCreateRelation').addEventListener('click', function(){
    relationCounter++;
    buttonCreateRelationSelected = true;
})


/*var rect = new joint.shapes.standard.Rectangle();
rect.position(100, 30);
rect.resize(100, 40);
rect.attr({
    body: {
        fill: 'blue'
    },
    label: {
        text: 'Hello',
        fill: 'white'
    }
});

rect.addTo(graph);

var rect2 = rect.clone();
rect2.translate(300, 0);
rect2.attr('label/text', 'World!');
rect2.addTo(graph);

var link = new joint.shapes.standard.Link();
link.source(rect);
link.target(rect2);
link.addTo(graph);*/

//paper.translate(300, 50); permette di spostare il diagramma disegnato
})


  