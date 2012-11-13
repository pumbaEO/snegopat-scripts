$engine JScript
$uname choiceHelpTopic
$dname Выбрать главу справки
$addin stdlib

// (c) Александр Орефков
// Скрипт позволяет быстрее выбрать нужную главу справки, когда одному слову
// соответствует несколько разделов



stdlib.require("SelectValueDialog.js", SelfScript);
stdlib.require('SettingsManagement.js', SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНастройка'] = function() {
    var sm = GetСhoiceHelpTopic();
    sm.changeSettings();
    return true;
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

////} Макросы

СhoiceHelpTopic = stdlib.Class.extend({


    settingsRootPath : 'choiceHelpTopic',
    
    defaultSettings : {
            'useNative': false 
    },


    construct : function () {    
        
        this.settings = SettingsManagement.CreateManager(this.settingsRootPath, this.defaultSettings);
        this.loadSettings();

        СhoiceHelpTopic._instance = this;
    },

    loadSettings:function(){
        this.settings.LoadSettings();
        if (!this.settings.current.useNative){

            try{
                this.api = stdlib.require("winapi.js")
                this.sel = new ActiveXObject('Svcsvc.Service')
            }catch(e)
            {
                Message("choiceHelpTopic.js: ошибка при инициализации. " + e.description);
                Message("Будим использовать нативные окна");
                this.settings.current.useNative = true;

            }

        }
        
        events.connect(windows, "onDoModal", this)

    },

    changeSettings : function(){
        var values = v8New('СписокЗначений');
        values.Add(0, 'Использовать Svcsvc для подсказки');
        values.Add(1, 'Использовать нативные окна');
        var dlg = new SelectValueDialog("Выберите вариант диалога подсказки!", values);
        if (dlg.selectValue()) {
            this.settings.current.useNative = (dlg.selectedValue==1)?true:false;
            this.settings.SaveSettings();                        
        }
    }, 


    onDoModal:function(dlgInfo){
        if(dlgInfo.caption == "Выбор главы")
            {
                if(dlgInfo.stage == openModalWnd)
                {
                    var vt = dlgInfo.form.getControl("tblTopics").value
                    if(vt.Count() > 3)
                    {
                        if (this.settings.current.useNative){
                            this.choiceNative(vt);
                        } else {
                            this.choicesSvcsvc(vt, dlgInfo);
                        }
                    }
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

    choiceNative:function(vt) {
        var choices = v8New('СписокЗначений');
        var i = 0;
        for(var rows = new Enumerator(vt); !rows.atEnd(); rows.moveNext()){
            //choices.Add(i, rows.item().Get(0));
            choices.Add(i, this.setFilter(rows.item().Get(0)));
            i++;
        }

        var dlg = new SelectValueDialog("Выберите главу", choices);
        dlg.form.GreedySearch = true;
        sel = dlg.selectValue();
        if (sel) {
            var sk = ""
            for (var i = 0; i<=dlg.selectedValue; i++) {
                sk += "{DOWN}"
            };
            sk +="~"; //enter
            sk +="{TAB}"; // tab, переместимся сразу в нижние окно справки, что бы работали стрелки вверх и вниз, если српавка не вмещается и появляется скролл. 
            new ActiveXObject("WScript.Shell").SendKeys(sk);


        }
    },

    choicesSvcsvc:function(vt, dlgInfo){
        var choices = []
        for(var rows = new Enumerator(vt); !rows.atEnd(); rows.moveNext())
            choices.push(rows.item().Get(0))
        var rect = this.api.GetWindowRect(this.api.GetParentWindow(this.api.GetParentWindow(dlgInfo.form.getControl(-1).hwnd)))  // -1 - это сама форма
        var choice = this.sel.FilterValue(choices.join("\r\n"), 1 | 8 | 32, 'Выберите главу',
            rect.left, rect.top, rect.width(), rect.height())
        if(choice.length)
        {
            var sk = ""
            for(var k in choices)
            {
                if(choices[k] == choice)
                    break
                sk += "{DOWN}"
            }
            new ActiveXObject("WScript.Shell").SendKeys(sk + "~")
        }
    }


})


function GetСhoiceHelpTopic() {
    if (!СhoiceHelpTopic._instance)
        new СhoiceHelpTopic();
    
    return СhoiceHelpTopic._instance;
}


var cht = GetСhoiceHelpTopic();
