var listePays = [];
var bd;
$(document).ready(function(){
    chargerDonnees('php/data.php');
    createGrid();
});

/**
 *
 * @param lien
 * @returns {{never || always, pipe, promise, state, catch, then}}
 */
function chargerDonnees(lien) {
    var data = $.Deferred();
    $.ajax({
        type: "GET",
        url: lien,
        dataType: "json"
    }).done(function(response){
        listCountries(response);
        buildController(response);
        createGrid(response);
    });
    return data.promise();
}

/**
 *
 */
function buildController(datas){
    bd = {
        loadData: function(filter) {
            var timeFrom = new Date(filter.mariage.from).getTime();
            var timeTo = new Date(filter.mariage.to).getTime();
            return $.grep(this.gens, function(pers) {
                //formattage de la date
                var asDate = pers.mariage.split('/');
                var dateN = new Date(asDate[2], asDate[1]-1, asDate[0]);
                return (!filter.nom || pers.nom.toUpperCase().indexOf(filter.nom.toUpperCase()) > -1)
                    && (!filter.mariage.from || !filter.mariage.to || (dateN.getTime() >= timeFrom && dateN.getTime() <= timeTo))
                    && (!filter.pays || pers.pays === filter.pays)
                    && (filter.marie === undefined|| pers.marie === filter.marie);
            });
        }
    };
    bd.gens = datas;
    bd.countries = listePays;
}

/**
 *
 */
function createGrid(){
    $('#gridPers').jsGrid({
        width: '100%',
        filtering: true,
        sorting: true,
        autoload: true,

        controller: bd,
        fields: [
            { name: "nom", type: "text"},
            { name: "pays", type: "select", items: listePays, valueField: "id", textField: "name"},
            { name: "marie", type: "checkbox"},
            { name: "mariage", type: "date"}
        ]
    });

    var dateField = function(config) {
        jsGrid.Field.call(this, config);
    };

    dateField.prototype = new jsGrid.Field({
        sorter: function(date1, date2) {
            return new Date(date1) - new Date(date2);
        },

        itemTemplate: function(value) {
            return value;
        },

        filterTemplate: function() {
            var grid = this._grid;

            this._dateDebut = $("<input>").datepicker({dateFormat: 'dd/mm/yy'});
            this._dateFin = $("<input>").datepicker({dateFormat: 'dd/mm/yy'});
            this._dateDebut.add(this._dateFin).on('change', function () {
                grid.search();
            });
            this._dateDebut.add(this._dateFin).on('keydown', function (e) {
                if(e.keyCode === 8){
                    this.value = '';
                    grid.search();
                }
            });
            return $("<div>").append('Du :').append(this._dateDebut).append('Au :').append(this._dateFin);
        },

        filterValue: function() {
            return {
                from: this._dateDebut.datepicker("getDate"),
                to: this._dateFin.datepicker("getDate")
            };
        }
    });

    jsGrid.fields.date = dateField;
}

/**
 *
 * @param data
 */
function listCountries(data){
    data.forEach(function(elem){
        if(!listePays.some(e => e.id === elem.pays)){
            listePays.push({
                id: elem.pays,
                name: elem.nomPays
            });
        }
    });
    listePays.sort(compare);
    listePays.unshift({
        id: 0,
        name: "Tous"
    });
}

/**
 * Pour la fonction de tri des pays
 * @param a
 * @param b
 * @returns {number}
 */
function compare(a,b) {
    if (a.name < b.name)
        return -1;
    if (a.name > b.name)
        return 1;
    return 0;
}
