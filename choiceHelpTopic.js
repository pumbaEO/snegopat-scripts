$engine JScript
$uname choiceHelpTopic
$dname Выбрать главу справки
$addin stdlib

// (c) Александр Орефков
// Скрипт позволяет быстрее выбрать нужную главу справки, когда одному слову
// соответствует несколько разделов

stdlib.require("SelectValueDialog.js", SelfScript);

СhoiceHelpTopic = stdlib.Class.extend({

    construct : function () {    
        СhoiceHelpTopic._instance = this;
        events.connect(windows, "onDoModal", this)
    },

    onDoModal:function(dlgInfo){
        if(dlgInfo.caption == "Выбор главы" && dlgInfo.stage == afterInitial)
        {
            var grid = dlgInfo.form.getControl("tblTopics").extInterface
            var sel = this.choiceNative(grid);
            if(sel)
            {
                grid.currentRow = sel
                dlgInfo.form.sendEvent(dlgInfo.form.getControl('btnShow').id, 0)
            }
        }
    },

    setFilter:function(str){
        str = str.replace(/Прикладные объекты\//, 'Прикл.объект\/');
        str = str.replace(/Интерфейс \(управляемый\)\//, 'Интерф.упр\/');
        str = str.replace(/Универсальные коллекции значений\//, 'Унив.колл.знач\/');
        str = str.replace(/Общие объекты\//, 'Общ.объек\/');
        str = str.replace(/\/Система компоновки данных\//, '\/СКД\/');
        str = str.replace(/\/Схема компоновки данных\//, '\/Схема КД\/');
        str = str.replace(/\/Настройки компоновки данных\//, '\/Настройки КД\/');
        str = str.replace(/Общее описание встроенного языка\//, 'Общ.опис.встр.яз\/');
        str = str.replace(/Встроенные функции\//, 'Встр.функц.\/');
        str = str.replace(/\/Функции работы со значениями типа/, '\/Функц.раб.знач.типа ');
        str = str.replace(/\/Универсальные объекты/, '\/Универ.объект');
        str = str.replace(/\/Управляемая форма/, '\/Упр.форма');
        
        return str        
    },
    choiceNative:function(grid) {
        var choices = v8New('СписокЗначений');
        for(var k = grid.dataSource.root.firstChild; k ; k = k.next)
            choices.Add(k, this.setFilter(k.getCellValue(0)));

        var dlg = new SelectValueDialog("Выберите главу", choices);
        dlg.form.GreedySearch = true;
        if (dlg.selectValue())
            return dlg.selectedValue
        return null
    }
})


function GetСhoiceHelpTopic() {
    if (!СhoiceHelpTopic._instance)
        new СhoiceHelpTopic();
    return СhoiceHelpTopic._instance;
}

var cht = GetСhoiceHelpTopic();
