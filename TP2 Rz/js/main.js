var listePays = [];

function chargerDonnees(lien) {
    var data = $.Deferred();
    $.ajax({
        type: 'GET',
        url: lien,
        dataType: 'json'
    }).done(function(response){
        listCountries(response);
        data.resolve(response);
    });
    return data.promise();
}

$(document).ready(function(){
    var donnees = chargerDonnees('php/data.php');
    createGrid(donnees);
});

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

var bd = {
    loadData: function(filter) {
        return $.grep(this.gens, function(pers) {
            return (!filter.nom || pers.nom.indexOf(filter.nom) > -1)
                && (!filter.naissance || pers.naissance.indexOf(filter.naissance) > -1)
                && (!filter.pays || pers.pays === filter.pays)
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

bd.countries = listePays;
