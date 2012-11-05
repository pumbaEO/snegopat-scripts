$engine JScript
$uname SelectValueDialog_example
$dname Пример работы с классом SelectValueDialog
$addin stdlib

stdlib.require("SelectValueDialog.js", SelfScript);

function macrosСписокМетодов_JS_Массив() {
    var dlg = new SelectValueDialog("Выберите!", ['Первый', 'Второй']);
    if (dlg.selectValue()) {
        Message(dlg.selectedValue);
    }
}

function macrosСписокМетодов_JS_Объект() {
    var values = {
        'Первый ключ' : function () { return 'анонимная функция';},
        myProp : "второй ключ"
    };
    var dlg = new SelectValueDialog("Выберите!", values);
    if (dlg.selectValue()) {
        Message("Тип: " + (typeof dlg.selectedValue));	
        Message(dlg.selectedValue);
    }
}

function macrosСписокМетодов_1С_Массив() {
    var values = v8New('Массив');
    values.Add('Первый элемент массива 1С');
    values.Add('Второй элемент массива 1С');
    var dlg = new SelectValueDialog("Выберите из массива 1С!", values);
    if (dlg.selectValue()) {
        Message(dlg.selectedValue);
    }
}

function macrosСписокМетодов_1С_СписокЗначений() {
    var values = v8New('СписокЗначений');
    values.Add(1, 'Первое значение списка значений');
    values.Add(2, 'Второе значение списка значений');
    var dlg = new SelectValueDialog("Выберите!", values);
    if (dlg.selectValue()) {
        Message(dlg.selectedValue);
    }
}

function macrosСписокМетодов_НеКоллекция() {
    // Список - js-массив
    var dlg = new SelectValueDialog("Выберите!", "Одиночное значение");
    if (dlg.selectValue()) {
        Message(dlg.selectedValue);
    }
}
