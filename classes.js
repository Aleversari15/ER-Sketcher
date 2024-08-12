class Entity {
    constructor() {
        this.id = [];
        this.attributes = new Map(); //contiene ogni cella attributo e la sua cardinalità 
    }

    // lista così posso anche salvarmi gli id composti/esterni
    addId(id) {
        this.id.push(id);
    }

    setId(ids){
        this.id = ids; 
    }

    getId(){
        return this.id;
    }

    addAttribute(attribute, cardinality) {
        if(cardinality){
            this.attributes.set(attribute, cardinality);
        }
        else{
            this.attributes.set(attribute, null); //se null non dovrà essere disegnato nulla sul link 
        }
        
    }

    getCardinality(attribute){
        var card = this.attributes.get(attribute);
        if(card){
            return card;
        }
    }

    setCardinality(attribute, newCardinality){
        for (let [attributeCell, cardinality] of this.attributes.entries()) {
            if (attributeCell.id === attribute.id) {
                this.entitiesConnected.set(attributeCell, newCardinality);
                return true;
            }
        }
    }

}

//classe utile per salvare le informazioni riguardanti le associazioni e le varie entità e cardinalità 
class Association {
    constructor(name) {
        this.name = name;
        this.entitiesConnected = new Map();
    }

    addEntityConnection(cell, cardinality) {
        const validCardinalities = ['0-1', '1-1', '1-N', '0-N', 'N-N', 'Altro'];
        if (validCardinalities.includes(cardinality)) {
            this.entitiesConnected.set(cell, cardinality);
        } else {
            console.warn(`Invalid cardinality: ${cardinality}`);
        }
    }

    getEntityConnection(cell) {
        return this.entitiesConnected.get(cell);
    }

    removeEntityConnection(cell) {
        this.entitiesConnected.delete(cell);
    }

    getAllEntityConnections() {
        return Array.from(this.entitiesConnected.entries());
    }

    setCardinalityForEntityById(entityId, newCardinality) {
        const validCardinalities = ['0-1', '1-1', '1-N', '0-N', 'N-N', 'Altro'];
        if (!validCardinalities.includes(newCardinality)) {
            console.warn(`Invalid cardinality: ${newCardinality}`);
            return false;
        }

        for (let [cell, cardinality] of this.entitiesConnected.entries()) {
            if (cell.id === entityId) {
                this.entitiesConnected.set(cell, newCardinality);
                return true;
            }
        }
        console.warn(`Entity with ID: ${entityId} not found.`);
        return false;
    }
}

class Generalization {
    constructor(name) {
        this.name = name;
        this.entitiesGeneralized = [];
        this.hub = null;
        this.coverage = '(t,e)';
    }

    addEntityGeneralization(cell) {
        this.entitiesGeneralized.push(cell);
    }

    removeEntityGeneralization(cell) {
        this.entitiesGeneralized.delete(cell);
    }

    getAllEntityGeneralizations() {
        return this.entitiesGeneralized;
    }

    setCoverage(newCoverage) {
        const validCoverages = ['(t,e)', '(p,e)', '(t,s)', '(p,s)'];
        if (!validCoverages.includes(newCoverage)) {
            console.warn(`Invalid coverage: ${newCoverage}`);
            return false;
        }
        this.coverage = newCoverage; 
        return false;
    }

    getCoverage(){
        return this.coverage;
    }

    setHub(hub){
        this.hub = hub;
    }

    getHub(){
        return this.hub;
    }
}