function copyElements(graph, elements,localStorage) {
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
}





