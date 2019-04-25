let listePays = [];

/**
 * Requete Ajax pour charger les donnees et remplir le jsGrid
 * @param lien
 * @returns {{never || always, pipe, promise, state, catch, then}}
 */
function chargerDonnees(lien) {
    let data = $.Deferred();
    $.ajax({
        type: "GET",
        url: lien,
        dataType: "json"
    }).done(function (response) {
        listCountries(response);
        let controller = buildController(response);
        createGrid(controller);
    });
    return data.promise();
}

/**
 * Fonction de remplissage des données
 * et de filtrage pour la recherche
 */
function buildController(datas) {
    let bd = {
        loadData: function (filter) {
            let timeFrom = new Date(filter.mariage.from).getTime();
            let timeTo = new Date(filter.mariage.to).getTime();
            return $.grep(this.gens, function (pers) {
                //formatage de la date
                let asDate = pers.mariage.split('/');
                let dateN = new Date(asDate[2], asDate[1] - 1, asDate[0]);
                return (!filter.nom || pers.nom.toUpperCase().indexOf(filter.nom.toUpperCase()) > -1)
                    && ((!filter.mariage.from && !filter.mariage.to) || dateRange(timeFrom, timeTo, dateN))
                    && (filter.pays.length === 0 || filter.pays.includes(pers.pays.toString()))
                    && (filter.majeur === undefined || pers.majeur === filter.majeur);
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
function dateRange(from, to, date) {
    if (!from) {
        return date.getTime() <= to;
    }
    if (!to) {
        return date.getTime() >= from;
    }
    return date.getTime() >= from && date.getTime() <= to;
}

/**
 * Creation du grid avec les donnees
 * du controlleur en parametres
 */
function createGrid(ctrl) {
    customMultiSelect();
    customDateField();
    $('#gridPers').jsGrid({
        width: '100%',
        filtering: true,
        sorting: true,
        autoload: true,
        editing: true,
        paging: true,
        pageSize: 18,
        controller: ctrl,
        fields: [
            {name: "nom", type: "text"},
            {name: "pays", type: "multiselect", items: listePays, valueField: "id", textField: "name"},
            {name: "majeur", type: "checkbox"},
            {name: "mariage", type: "date", align: 'center'},
            {type: "control"}
        ],
        onRefreshed: function () {
            $('select').selectpicker({
                noneSelectedText: 'Aucun',
                selectAllText: 'Tous',
                deselectAllText: 'Aucun'
            });
        },
        headerRowRenderer: function () {
            let $result = $("<tr>").append($("<th id='0' rowspan='2'>").text("Nom"));
            $result.append($("<th id='1' rowspan='2'>").text("Pays"));
            $result.append($("<th colspan='2'>").text("Mariage"));
            $result.append($("<th rowspan='2'>").text("options").width(120));
            let secLine = $("<tr>").append($("<th id='2'>").text("Majorité"));
            secLine.append($("<th id='3'>").text("Date"));
            $result = $result.add(secLine);

            let grid = this;
            $(document).on('click', '.jsgrid-table tr th', function (e) {
                let index = e.currentTarget.id;
                if (grid.sorting && !isNaN(parseInt(index))) {
                    let prevSort = $('#gridPers').jsGrid('getSorting');
                    grid.sort(index);
                    //customisation des icones de tri
                    $('.asc').add($('.desc')).removeClass('asc').removeClass('desc');
                    let elem = document.getElementById(index);
                    if(prevSort.field === grid.fields[index].name && prevSort.order === 'asc'){
                        elem.classList.add('desc');
                    }
                    else{
                        elem.classList.add('asc');
                    }
                }
            });
            return $result;
        }
    });
}

/**
 * champ custom du multiselect
 */
function customMultiSelect() {
    let multiselectField = function (config) {
        jsGrid.Field.call(this, config);
    };

    multiselectField.prototype = new jsGrid.Field({
        item: [],
        textField: "",
        valueField: "",

        _createSelect: function (grid, selected) {
            let textField = this.textField;
            let valueField = this.valueField;
            let $result = $("<select multiple data-container='body' data-actions-box='true' data-size='12'>");
            $.each(this.items, function (_, item) {
                let text = item[textField];
                let val = item[valueField];
                let $opt = $("<option>").val(val).text(text);
                if ($.inArray(val, selected) > -1) {
                    $opt.attr("selected", "selected");
                }

                $result.append($opt);
            });

            $result.on('change', function () {
                grid.search();
            });

            return $result;
        },

        sorter: function (p1, p2) {
            return p1 - p2;
        },

        itemTemplate: function (value) {
            for (let i in listePays) {
                if (listePays[i].id === value) {
                    return listePays[i].name;
                }
            }
        },

        filterTemplate: function () {
            return this._filterControl = this._createSelect(this._grid);
        },

        filterValue: function () {
            let selected = [];
            this._filterControl.find("option:selected").map(function () {
                this.selected ? selected.push($(this).val()) : null;
            });
            return selected;
        },

        editTemplate: function(value) {
            let select = $("<select>");
            listePays.forEach(function (pays) {
                let opt = $("<option>").val(pays.id).text(pays.name);
                if (value === pays.id) {
                    opt.attr("selected", "selected");
                }
                select.append(opt);
            });
            return this._editPicker = select;
        },

        editValue: function() {
            let select = this._editPicker[0];
            for(let i=0; i<select.length; i++){
                if(select[i] && select[i].selected) {
                    return parseInt(select[i].value);
                }
            }
        }

    });

    jsGrid.fields.multiselect = multiselectField;
}

/**
 * champ custom de la date
 */
function customDateField() {
    let dateField = function (config) {
        jsGrid.Field.call(this, config);
    };

    dateField.prototype = new jsGrid.Field({
        sorter: function (date1, date2) {
            let asDate1 = date1.split('/');
            let asDate2 = date2.split('/');
            let tDate1 = new Date(asDate1[2], asDate1[1] - 1, asDate1[0]);
            let tDate2 = new Date(asDate2[2], asDate2[1] - 1, asDate2[0]);
            return tDate1 - tDate2;
        },

        itemTemplate: function (value) {
            return value;
        },

        filterTemplate: function () {
            let grid = this._grid;

            this._dateDebut = $("<input>").width(103).datepicker({format: 'dd/mm/yyyy'});
            this._dateFin = $("<input>").width(103).datepicker({format: 'dd/mm/yyyy'});

            this._dateDebut.add(this._dateFin).on('change', function () {
                grid.search();
            });
            this._dateDebut.add(this._dateFin).on('keydown', function (e) {
                if (e.keyCode === 8) {
                    this.value = '';
                }
            });
            return $("<div>").append(this._dateDebut).append(' - ').append(this._dateFin);
        },

        filterValue: function () {
            return {
                from: this._dateDebut.datepicker("getDate"),
                to: this._dateFin.datepicker("getDate")
            };
        },

        editTemplate: function(value) {
            let tabVal = value.split('/');
            let newVal = tabVal[1] + '/' + tabVal[0] + '/' + tabVal[2];
            let picker = $("<input>").datepicker({format: 'dd/mm/yyyy'}).datepicker("setDate", new Date(newVal));
            return this._editPicker = picker;
        },

        editValue: function() {
            let date = this._editPicker.datepicker("getDate");
            return date.toLocaleString().substring(0, 10);
        }
    });

    jsGrid.fields.date = dateField;
}

/**
 *
 * @param data
 */
function listCountries(data) {
    data.forEach(function (elem) {
        if (!listePays.some(e => e.id === elem.pays)) {
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
function compare(a, b) {
    if (a.name < b.name)
        return -1;
    if (a.name > b.name)
        return 1;
    return 0;
}

/**
 * Au chargement de la page
 * Initialisation des données
 */
$(document).ready(function () {
    chargerDonnees('php/data.php');
});