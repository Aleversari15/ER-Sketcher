/*function copyElements(graph, elements,localStorage) {
    const elementIds = elements.map(element => element.id);

    console.log(elementIds);
    const selectedCells = graph.getCells().filter(cell => elementIds.includes(cell.id));

    const json = {
        cells: selectedCells.map(cell => cell.toJSON())
    };

    localStorage.setItem('copiedElements', JSON.stringify(json));
    console.log(localStorage);
}


function pasteElements(targetGraph,localStorage) {
    const json = JSON.parse(localStorage.getItem('copiedElements'));

    if (json && json.cells) {
        console.log('JSON cells:', json.cells);  
        const cells = json.cells.map(cellData => {
            const CellType = joint.util.getByPath(joint.shapes, cellData.type, '.');
            const newCell = new CellType();
            newCell.position(cellData.position.x, cellData.position.y);
            newCell.resize(cellData.size.width, cellData.size.height);
            newCell.attr(cellData.attrs || {});
            

            return newCell;
        });
        targetGraph.addCells(cells);

        // per evitare sovrapposizioni
        cells.forEach(function(cell) {
            cell.translate(50, 50);  
        });

        updateLinks(targetGraph, json.cells);
    }
}

function updateLinks(targetGraph, copiedCells) {
    // Ricrea i collegamenti tra le celle
    copiedCells.forEach(cellData => {
        if (cellData.type === 'link') {
            const link = new joint.dia.Link();
            link.from(cellData.source);
            link.to(cellData.target);
            targetGraph.addCell(link);
        }
    });
}*/
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






