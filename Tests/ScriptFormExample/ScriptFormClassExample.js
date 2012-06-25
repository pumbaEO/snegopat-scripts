$engine JScript
$uname ScriptFormClassExample
$dname Пример работы с классом ScriptForm
$addin global
$addin stdlib

stdlib.require('ScriptForm.js', SelfScript);

function macrosПоказать() {

    var varWnd = new MyTestScriptForm();
    varWnd.show();
}

function getDefaultMacros() {
    return 'Показать';
}

MyTestScriptForm = ScriptForm.extend({

    disableAutoEvents: false,

    construct: function() {
        this._super(SelfScript.fullPath.replace(/js$/, 'ssf'));
    },
    
    Form_OnOpen: function () {
        Message('ПриОткрытии');
    },
    
    Form_BeforeClose: function () {
        Message('ПередЗакрытием');
    },
    
    tbTestTextBox_OnChange: function (ctrl) {
        Message('OnChanges');
    },
    
    btTestButton_Click: function(ctrl) {
        Message('Click');
    },

    gdTable_ПередНачаломДобавления: function (Элемент, Отказ, Копирование) {
        Message("gdTable_ПередНачаломДобавления");
    },
    
    gdTable_MyCol_ПриИзменении: function (ctrl) {
        Message('gdTable_MyCol_ПриИзменении');
    },

    КоманднаяПанель1_Кнопка1: function (Кнопка) {
        Message("Кнопка1");
    },
    
    КоманднаяПанель1_Кнопка2: function (Кнопка) {
        Message("Кнопка2");
    },

    КоманднаяПанель1_Кнопка3: function (Кнопка) {
        Message("Кнопка3");
    },

    КоманднаяПанель1_Кнопка4: function (Кнопка) {
        Message("Кнопка4");
    }
});

