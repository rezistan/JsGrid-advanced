var listePays = [];

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
        var controller = buildController(response);
        createGrid(controller);
    });
    return data.promise();
}

/**
 * Fonction de remplissage des données
 * et de filtrage pour la recherche
 */
function buildController(datas){
    var bd = {
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

    return bd;
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
function createGrid(ctrl){
    gridConfig();
    $('#gridPers').jsGrid({
        width: '100%',
        filtering: true,
        sorting: true,
        autoload: true,
        paging: true,
        pageSize: 18,
        controller: ctrl,
        fields: [
            { name: "nom", type: "text"},
            { name: "pays", type: "multiselect", items: listePays, valueField: "id", textField: "name"},
            { name: "majeur", type: "checkbox"},
            { name: "mariage", type: "date", align: 'center'}
        ],
        onRefreshed: function(){
            $('#selectPays').selectpicker({
                noneSelectedText: "Aucun",
                selectAllText: 'Tous',
                deselectAllText: 'Aucun'
            });
        },
        headerRowRenderer: function() {
            var $result = $("<tr>").append($("<th id='0' rowspan='2'>").text("Nom"));
            $result.append($("<th id='1' rowspan='2'>").text("Pays"));
            $result.append($("<th colspan='2'>").text("Mariage"));
            var secLine = $("<tr>").append($("<th id='2'>").text("Majorité"));
            secLine.append($("<th id='3'>").text("Date"));
            $result = $result.add(secLine);

            var grid = this;
            $(document).on('click', '.jsgrid-table tr th', function (e) {
                var index = e.currentTarget.id;
                if(grid.sorting && !isNaN(parseInt(index))){
                    var elem = document.getElementById(index);
                    grid.sort(index);
                    //customisation des icones de tri
                    console.log(elem.className);
                    if (elem.className.includes('desc')) {
                        elem.classList.add('desc');
                        elem.classList.remove('asc');
                    } else {
                        elem.classList.add('asc');
                        elem.classList.remove('desc');
                    }
                    console.log(elem);
                }
            });
            return $result;
        }
    });
}

/**
 * champ custom du multiselect
 */
function customMultiSelect(){
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
            var $result = $("<select id='selectPays' multiple data-container='body' data-actions-box='true' data-size='12'>");
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

        sorter: function(p1, p2){
            return p1-p2;
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
 * champ custom de la date
 */
function customDate(){
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

            this._dateDebut = $("<input>").width(103).datepicker({format: 'dd/mm/yyyy', horizontal: 'left', vertical: 'bottom'});
            this._dateFin = $("<input>").width(103).datepicker({format: 'dd/mm/yyyy'});

            this._dateDebut.add(this._dateFin).on('change', function () {
                grid.search();
            });
            this._dateDebut.add(this._dateFin).on('keydown', function (e) {
                if(e.keyCode === 8){
                    this.value = '';
                    grid.search();
                }
            });

            return $("<div>").append('du ').append(this._dateDebut).append(' au ').append(this._dateFin);
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
 * Champs custom du jsGrid
 */
function gridConfig(){
    customMultiSelect();
    customDate();
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


$(document).ready(function(){
    chargerDonnees('php/data.php');
});