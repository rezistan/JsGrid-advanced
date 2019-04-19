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
        createGrid();
    });
    return data.promise();
}

/**
 * Fonction de filtrage pour la recherche
 */
function buildController(datas){
    bd = {
        loadData: function(filter) {
            var timeFrom = new Date(filter.mariage.from).getTime();
            var timeTo = new Date(filter.mariage.to).getTime();
            return $.grep(this.gens, function(pers) {
                //formatage de la date
                var asDate = pers.mariage.split('/');
                var dateN = new Date(asDate[2], asDate[1]-1, asDate[0]);
                return (!filter.nom || pers.nom.toUpperCase().indexOf(filter.nom.toUpperCase()) > -1)
                    && ((!filter.mariage.from && !filter.mariage.to) || dateRange(timeFrom, timeTo, dateN))
                    && (filter.pays.length === 0 || filter.pays.includes(pers.pays.toString()))
                    && (filter.majeur === undefined|| pers.majeur === filter.majeur);
            });
        }
    };
    bd.gens = datas;
}

/**
 * Determine l'intervalle des dates à afficher
 * selon le filtre de recherche
 * @param from
 * @param to
 * @param date
 * @returns {boolean}
 */
function dateRange(from, to, date){
    if(!from){
        return date.getTime() <= to;
    }
    if(!to){
        return date.getTime() >= from;
    }
    return date.getTime() >= from && date.getTime() <= to;
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
            { name: "pays", type: "multiselect", items: listePays, valueField: "id", textField: "name"},
            { name: "majeur", type: "checkbox"},
            { name: "mariage", type: "date", align: 'left'}
        ],
        _sortData: function() {
            var sortFactor = this._sortFactor(),
                sortField = this._sortField;

            if (sortField) {
                this.data.sort(function(item1, item2) {
                    return sortFactor * sortField.sortingFunc(item1[sortField.name], item2[sortField.name]);
                });
            }
        },
        headerRowRenderer: function() {
            var $result = $("<tr>").append($("<th rowspan='2'>").text("Nom"));
            $result.append($("<th rowspan='2'>").text("Pays"));
            $result.append($("<th colspan='2'>").text("Mariage"));
            var secLine = $("<tr>").append($("<th>").text("Majorité"));
            secLine.append($("<th>").text("Date"));
            $result = $result.add(secLine);
            return $result;
        }
    });

    var dateField = function(config) {
        jsGrid.Field.call(this, config);
    };

    dateField.prototype = new jsGrid.Field({
        sorter: function(date1, date2) {
            var asDate1 = date1.split('/');
            var asDate2 = date2.split('/');
            var tDate1 = new Date(asDate1[2], asDate1[1]-1, asDate1[0]);
            var tDate2 = new Date(asDate2[2], asDate2[1]-1, asDate2[0]);
            return tDate1 - tDate2;
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

    var multiselectField = function(config) {
        jsGrid.Field.call(this, config);
    };

    multiselectField.prototype = new jsGrid.Field({
        item: [],
        textField: "",
        valueField: "",

        _createSelect: function(grid, selected) {
            var textField = this.textField;
            var valueField = this.valueField;
            var $result = $("<select multiple class='selectpicker'>");

            $.each(this.items, function(_, item) {
                var text = item[textField];
                var val = item[valueField];
                var $opt = $("<option>").val(val).text(text);
                if($.inArray(val, selected) > -1) {
                    $opt.attr("selected", "selected");
                }

                $result.append($opt);
            });

            $result.on('change', function () {
                grid.search();
            });

            return $result;
        },

        itemTemplate: function(value) {
            for(var i in listePays){
                if(listePays[i].id === value){
                    return listePays[i].name;
                }
            }
        },

        filterTemplate: function() {
            return this._filterControl = this._createSelect(this._grid);
        },

        filterValue: function() {
            var selected = [];
            this._filterControl.find("option:selected").map(function() {
                this.selected ? selected.push($(this).val()) : null;
            });
            return selected;
        }

    });

    jsGrid.fields.multiselect = multiselectField;
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
