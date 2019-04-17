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
        //console.log(response);
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
            console.log(filter);
            return $.grep(this.gens, function(pers) {
                return (!filter.nom || pers.nom.toUpperCase().indexOf(filter.nom.toUpperCase()) > -1)
                    && (!filter.naissance.date || new Date(pers.naissance).getTime() === new Date(filter.naissance.date).getTime())
                    && (!filter.pays || pers.pays === filter.pays)
                    && (!filter.marie || pers.marie === filter.marie);
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
    var DateField = function(config) {
        jsGrid.Field.call(this, config);
    };

    DateField.prototype = new jsGrid.Field({
        sorter: function(date1, date2) {
            return new Date(date1) - new Date(date2);
        },

        itemTemplate: function(value) {
            var asDate = value.split('/');
            return new Date(asDate[2], asDate[1]-1, asDate[0]).toLocaleDateString();
        },

        filterTemplate: function() {
            this._datePicker = $("<input>").datepicker({dateFormat: 'dd/mm/yy'});
            return $("<div>").append(this._datePicker);
        },

        filterValue: function() {
            /*var asDate = this._datePicker.datepicker("getDate").split('/');
            return new Date(asDate[2], asDate[1]-1, asDate[0]).toLocaleDateString();*/
            return {
                date: this._datePicker.datepicker("getDate")
            };
        }
    });

    jsGrid.fields.date = DateField;

    $('#gridPers').jsGrid({
        width: '100%',
        filtering: true,
        sorting: true,
        autoload: true,

        controller: bd,
        fields: [
            { name: "nom", type: "text"},
            { name: "pays", type: "select", items: listePays, valueField: "id", textField: "name"},
            { name: "marie", type: "number"},
            { name: "naissance", type: "date"}
        ]
    });
}

/**
 *
 * @param data
 */
function listCountries(data){
    data.forEach(function(elem){
        //console.log(elem);
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
    //console.log(listePays);
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
