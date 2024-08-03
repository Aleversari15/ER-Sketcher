class Entity {
    constructor(nome = '', id = '', attributi = [], entitaFiglie = [], copertura = '') {
        this.Nome = nome;
        this.Id = id;
        this.Attributi = attributi;
        this['Entità figlie'] = entitaFiglie;
        this.Copertura = copertura;
    }

    setNome(nome) {
        this.Nome = nome;
    }

    setId(id) {
        this.Id = id;
    }

    addAttributo(attributo) {
        this.Attributi.push(attributo);
    }

    setAttributi(attributi) {
        this.Attributi = attributi;
    }

    addEntitaFiglia(entitaFiglia) {
        this['Entità figlie'].push(entitaFiglia);
    }

    setEntitaFiglie(entitaFiglie) {
        this['Entità figlie'] = entitaFiglie;
    }

    setCopertura(copertura) {
        this.Copertura = copertura;
    }

    toJSON() {
        return {
            'Entità': this.Nome,
            Id: this.Id,
            Attributi: '{' + this.Attributi + '}',
            'Entità figlie': '{' + this['Entità figlie'] + '}',
            Copertura: this.Copertura
        };
    }
}
