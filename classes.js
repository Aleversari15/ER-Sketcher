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
