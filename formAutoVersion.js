$engine JScript
$uname formAutoVersion
$dname Авто-простановка версии на форме
$addin stdcommands
$addin global
$addin stdlib

stdlib.require('ScriptForm.js', SelfScript);
global.connectGlobals(SelfScript);

// Александр Орефков
// Сосна Евгений <shenja@sosna.zp.ua>

var re = new RegExp('Функция\\s+Версия\\(\\)\\s+Экспорт', 'ig');
var rereplace = new RegExp('(Функция\\s+Версия\\(\\)\\s+Экспорт\\n\\s*Возврат\\s*")(\\d+.\\d+.)(\\d+)(")', 'im');

SelfScript.self['macrosОткрыть окно настройки'] = function() {
    GetAutoVersion().show();
}

/* Реализует диалог настройки параметров поиска.*/
AutoVersionDialog = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,
    
    settings : {
        pflSnegopat : {
            'useFormAutoVersion'   : false, // Устанавливать версию на форме. 
            'useModuleAutoVersion' : false // Устанавливать версию в модуле формы в экспортной функции Версия.
        }
    },

    construct : function (query, initSearchArea) {  
        this._instance = null;
        this._super("scripts\\formAutoVersion.ssf");                
        this.form.КлючСохраненияПоложенияОкна = "formAutoVersion.js"
        this.loadSettings();
            
        AutoVersionDialog._instance = this;
    },

    loadSettings : function(){
        this._super();

        if (this.form.useFormAutoVersion || this.form.useModuleAutoVersion) {
            // Добавим обработчик команды сохранения файла
            stdcommands.Frame.FileSave.addHandler(this, "onFileSave");
        }
    },
    
    Form_OnClose : function () {
        this.saveSettings();
        this.loadSettings();
    },
    
    btOk_Click: function (btn) {
        this.close(true);
    },
    
    btCancel_Click: function (btn) {
        this.close(false);
    }, 

    rreplacer: function (str, p1, p2, p3, p4, offset, s, ss, sss) {
        var i = parseInt(p3)+1;
        return p1+p2+''+i+p4;
    },


    onFileSave : function(cmd){
        if (!this.form.useFormAutoVersion && !this.form.useModuleAutoVersion){
            return;
        }


        if(cmd.isBefore)    // Обработчик вызван перед выполнением команды
        {
            // Получим объект метаданных текущего окна
            var mdObj, av = windows.getActiveView()
            if(!av || !(mdObj = av.mdObj))
                return
            // Посмотрим, не внешний ли отчет/обработка сохраняется.
            if(mdObj.container != mdObj.container.masterContainer)
            {
                // Тут надо перебрать все формы.
                mdObj = mdObj.container.rootObject
                var dateStr = new Date().toLocaleString() 
                var needAsk = -1

                if (this.form.useFormAutoVersion){
                    for(var i = 0, formsCount = mdObj.childObjectsCount("Формы"); i < formsCount; i++)
                    {
                        var formMDObj = mdObj.childObject("Формы", i)
                        //MessageBox(formMDObj.name)
                        var form = formMDObj.getExtProp("Форма").getForm()
                        if(form)
                        {
                            var label = form.Controls.Find("ВерсияНадпись")
                            if(!label)
                            {
                                if(needAsk == -1)
                                    needAsk = MessageBox("Добавить на формы надпись с версией?", mbYesNo | mbIconQuestion | mbDefButton1) == mbaYes ? 1 : 0
                                if(needAsk == 1)
                                {
                                    // Надо добавить надпись
                                    label = form.Controls.Add(v8New("ОписаниеТипов", "Надпись").Типы().Получить(0), "ВерсияНадпись", true)
                                    label.Заголовок = "Версия 0"
                                    form.Высота += 20
                                    label.Лево = 0
                                    label.Верх = form.Высота - 20
                                    label.Высота = 20
                                    label.Ширина = form.Ширина
                                }
                            }
                            if(label)
                            {
                                // Надпись найдена. Надо увеличить номер версии
                                var currentVersion = parseInt(label.Заголовок.match(/\d+/)[0])
                                label.Заголовок = "Версия " + (currentVersion + 1) + " (" + dateStr + ")"
                            }
                        }
                    }    
                } else {

                    mdObj = mdObj.container.rootObject;
                    var mdc = mdObj.mdclass;
                     for(var i = 0, c = mdc.propertiesCount; i < c; i++){
                        var mdProp = mdc.propertyAt(i);
                        var mdPropName = mdc.propertyAt(i).name(1);

                        if (mdObj.isPropModule(mdProp.id)){
                            var text = mdObj.getModuleText(mdProp.id);
                            var Mathes = re.exec(text)
                            if (Mathes !=null){
                                text = text.replace(rereplace, this.rreplacer);
                                mdObj.setModuleText(mdProp.id, text);
                            }
                        }
                    }
                }
                
            }
        }       

    }
    
}); // end of AutoVersionDialog


function GetAutoVersion() {
    if (!AutoVersionDialog._instance)
        new AutoVersionDialog();
    
    return AutoVersionDialog._instance;
}

var auto = GetAutoVersion();

function onFileSave(cmd)
{
    if(cmd.isBefore)    // Обработчик вызван перед выполнением команды
    {
        // Получим объект метаданных текущего окна
        var mdObj, av = windows.getActiveView()
        if(!av || !(mdObj = av.mdObj))
            return
        // Посмотрим, не внешний ли отчет/обработка сохраняется.
        if(mdObj.container != mdObj.container.masterContainer)
        {
            // Тут надо перебрать все формы.
            mdObj = mdObj.container.rootObject
            var dateStr = new Date().toLocaleString() 
            var needAsk = -1
            for(var i = 0, formsCount = mdObj.childObjectsCount("Формы"); i < formsCount; i++)
            {
                var formMDObj = mdObj.childObject("Формы", i)
                //MessageBox(formMDObj.name)
                var form = formMDObj.getExtProp("Форма").getForm()
                if(form)
                {
                    var label = form.Controls.Find("ВерсияНадпись")
                    if(!label)
                    {
                        if(needAsk == -1)
                            needAsk = MessageBox("Добавить на формы надпись с версией?", mbYesNo | mbIconQuestion | mbDefButton1) == mbaYes ? 1 : 0
                        if(needAsk == 1)
                        {
                            // Надо добавить надпись
                            label = form.Controls.Add(v8New("ОписаниеТипов", "Надпись").Типы().Получить(0), "ВерсияНадпись", true)
                            label.Заголовок = "Версия 0"
                            form.Высота += 20
                            label.Лево = 0
                            label.Верх = form.Высота - 20
                            label.Высота = 20
                            label.Ширина = form.Ширина
                        }
                    }
                    if(label)
                    {
                        // Надпись найдена. Надо увеличить номер версии
                        var currentVersion = parseInt(label.Заголовок.match(/\d+/)[0])
                        label.Заголовок = "Версия " + (currentVersion + 1) + " (" + dateStr + ")"
                    }
                }
            }
        }
    }
}

