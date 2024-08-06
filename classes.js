class Entity {
    constructor(nome = '', id = '', attributi = [], entitaFiglie = [], copertura = '') {
        this.Nome = nome;
        this.Id = id;
        this.Attributi = attributi;
        this['Entità figlie'] = entitaFiglie;
        this.Copertura = copertura;
    }

    setName(nome) {
        this.Nome = nome;
    }

    setId(id) {
        this.Id = id;
    }

    addAttribute(attributo) {
        this.Attributi.push(attributo);
    }

    setAttributes(attributi) {
        this.Attributi = attributi;
    }

    addGeneralizedEntity(entitaFiglia) {
        this['Entità figlie'].push(entitaFiglia);
    }

    setGeneralizedEntity(entitaFiglie) {
        this['Entità figlie'] = entitaFiglie;
    }

    setCoverage(copertura) {
        this.Copertura = copertura;
    }

    toJSON() {
        return {
            'Entità': this.Nome,
            //Id: this.Id,
            Attributi: '{ ' + this.Attributi + ' }',
            'Entità figlie': '{ ' + this['Entità figlie'] + ' }',
            Copertura: this.Copertura
        };
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
        this.entitiesGeneralized = new Map();
        this.hub = null;
    }

    addEntityGeneralization(cell, coverage) {
        const validCoverages = ['(t,e)', '(p,e)', '(t,s)', '(p,s)'];
        if (validCoverages.includes(coverage)) {
            this.entitiesGeneralized.set(cell, coverage);
        } else {
            console.warn(`Invalid coverage: ${coverage}`);
        }
    }

    getEntityGeneralization(cell) {
        return this.entitiesGeneralized.get(cell);
    }

    removeEntityGeneralization(cell) {
        this.entitiesGeneralized.delete(cell);
    }

    getAllEntityGeneralizations() {
        return Array.from(this.entitiesGeneralized.entries());
    }

    setCoverageForEntityById(entityId, newCoverage) {
        const validCoverages = ['(t,e)', '(p,e)', '(t,s)', '(p,s)'];
        if (!validCoverages.includes(newCoverage)) {
            console.warn(`Invalid coverage: ${newCoverage}`);
            return false;
        }

        for (let [cell, coverage] of this.entitiesGeneralized.entries()) {
            if (cell.id === entityId) {
                this.entitiesGeneralized.set(cell, newCoverage);
                return true;
            }
        }
        console.warn(`Entity with ID: ${entityId} not found.`);
        return false;
    }

    setHub(hub){
        this.hub = hub;
    }

    getHub(){
        return this.hub;
    }
}