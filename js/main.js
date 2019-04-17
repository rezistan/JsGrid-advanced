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
            console.log(filter);
            return $.grep(this.gens, function(pers) {
                return (!filter.nom || pers.nom.toUpperCase().indexOf(filter.nom.toUpperCase()) > -1)
                    && (!filter.naissance || pers.naissance.indexOf(filter.naissance) > -1)
                    && (!filter.pays || pers.pays.toUpperCase() === filter.pays.toUpperCase())
                    && (filter.marie === undefined || pers.marie === filter.marie);
            });
        },

        insertItem: function(insertingPers) {
            this.gens.push(insertingPers);
        },

        updateItem: function(updatingPers) { },

        deleteItem: function(deletingPers) {
            var persIndex = $.inArray(deletingPers, this.gens);
            this.gens.splice(persIndex, 1);
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
            { name: "pays", type: "text", items: listePays},
            { name: "marié", type: "number"},
            { name: "naissance", type: "text"}
        ]
    });
}

function listCountries(data){
    data.forEach(function(elem){
        if(!listePays.includes(elem.pays)){
            listePays.push(elem.pays);
        }
    });
    listePays.sort();
}
