$engine JScript
$uname DebugInstruments
$dname Отладка с Инструментами разработчика
$addin stdlib
$addin hotkeys
$addin global
$addin stdcommands

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// (с) 2007, Старых С.А.
// 
// 


stdlib.require('ScriptForm.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);

//stdlib.require(stdlib.getSnegopatMainFolder() + 'scripts\\epf\\epfloader.js', SelfScript);
global.connectGlobals(SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНастройка'] = function() {
    var sm = GetDebugInstruments();
    sm.changeSettings();
    return true;
}

SelfScript.self['macrosОтладить запрос модально'] = function() {
    var sm = GetDebugInstruments();
    
    var w = GetTextWindow();
    if (!w) return false;
    
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    sm.debugQuery(selText, true);
    return true;
}


SelfScript.self['macrosОтладить запрос не модально'] = function() {
    var w = GetTextWindow();
    if (!w) return false;
    
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    sm.debugQuery(selText, false);
    return true;
}

SelfScript.self['macrosИсследовать'] = function() {
    var sm = GetDebugInstruments();
    
    var w = GetTextWindow();
    if (!w) return false;
    
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    sm.research(selText);
    
    return true;
}

SelfScript.self['macrosНачать трассу в технологическом журнале'] = function() {
    var sm = GetDebugInstruments();
    
    sm.startTechLog();
    
    return true;
}

SelfScript.self['macrosКончить трассу в технологическом журнале'] = function() {
    var sm = GetDebugInstruments();
    
    sm.stopTechLog();
    
    return true;
}

SelfScript.self['macrosПоп модально'] = function() {
    var sm = GetDebugInstruments();
    
    var w = GetTextWindow();
    if (!w) return false;
    
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    pop = sm.pop(selText, true);
    
    Message(""+pop);
    
    return true
}

SelfScript.self['macrosПоп не модально'] = function() {
    var sm = GetDebugInstruments();
    
    var w = GetTextWindow();
    if (!w) return false;
    
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    pop = sm.pop(selText, false);
    
    Message(""+pop);
    
    return true
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

////} Макросы

DebugInstruments = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,
    
    settings : {
        pflSnegopat : {
            'pathToEpf': "", // Путь к каталогу с файлами настроек. 
            'useEpf'   : false, //Автозаменна текста после форматирования. 
            'queryCommand' : "Отладить", 
            'startTechLog' : "ТехН",
            'stopTechLog': "ТехК",
            'poopCommand': "Поп",
            'researchCommand': "Исследовать",
            'duCommand':"Ду",
            'prCommand' : "Пр",
            'perCommand' : "Пер",
            'operateCommand' : "Оперировать"
        }
    },

    construct : function () {
        
        this._super("scripts\\DebugInstruments.ssf");


        this.loadSettings();

        DebugInstruments._instance = this;

    }, 
    
    loadSettings : function(){
        this._super();
        if (this.form.useEpf){
            
            if (!fileExists(getAbsolutePath(this.form.pathToEpf))){
                var notifysend = stdlib.require('NotifySend.js').GetNotifySend();
                var СистемнаяИнформация = v8New("СистемнаяИнформация");
                var версия = СистемнаяИнформация.ВерсияПриложения;
                if (версия.indexOf("8.2.13")==-1){
                  notifysend.provider = notifysend.initprovider("Встроенный1С");
                }
                notifysend.Error("Не нашли ", "Не смогли найти файл внешней обработки \n путь "+getAbsolutePath(this.form.pathToEpf), 3);
                notify = false;
                stdlib.setTimeout(function () {
                  notify = true;
                }, 3000);
            }
        }
    },
    
    isDebugEvalEnabled: function(){
        // Команда "Шагнуть в" неактивна - значит, мы не в останове. Считать переменные нельзя, возможен вылет
        var state = stdcommands.CDebug.StepIn.getState()
        return state && state.enabled
    },
    
    exprText : function(text){
        var expText = '';
        if (!text) text = ''
        
        if (this.form.useEpf){
            var f = v8New('File', getAbsolutePath(this.form.pathToEpf));
            if (f.IsFile() && f.Exist()){
                expText = 'ВнешниеОбработки.Создать("' +f.FullName +'").'
            }
        }
        return expText + text;
    },
    
    debugQuery : function(text, doModal){
        if (!this.isDebugEvalEnabled())
            return
        
        exprCtrl = ''+ this.form.queryCommand + '(' + text + ', ' + (doModal ? 'Истина' :  'Ложь') + ')';
        
        exprCtrl = this.exprText(exprCtrl);
        
        // Рассчитаем отладочное значение в строке
        var expr = v8debug.eval(exprCtrl)
        if (!expr.value.match(/^\s*$/))
            Message(""+expr.value);
    },
    
    startTechLog : function (){
        if (!this.isDebugEvalEnabled())
            return
        
        exprCtrl = ''+ this.form.startTechLog + '()';
        
        exprCtrl = this.exprText(exprCtrl);
        
        // Рассчитаем отладочное значение в строке
        var expr = v8debug.eval(exprCtrl)
        if (!expr.value.match(/^\s*$/))
            Message(""+expr.value);
    },
    
    stopTechLog : function (){
        if (!this.isDebugEvalEnabled())
            return
        
        exprCtrl = ''+ this.form.stopTechLog + '()';
        
        exprCtrl = this.exprText(exprCtrl);
        
        // Рассчитаем отладочное значение в строке
        var expr = v8debug.eval(exprCtrl)
        if (!expr.value.match(/^\s*$/))
            Message(""+expr.value);
    },
    
    research : function(text, doModal){
        
        if (!this.isDebugEvalEnabled())
            return
        
        debugger;
        exprCtrl = ''+ this.form.researchCommand + '(' + text + ', ' + (doModal ? 'Истина' :  'Ложь') + ')';
        
        exprCtrl = this.exprText(exprCtrl);
        
        // Рассчитаем отладочное значение в строке
        var expr = v8debug.eval(exprCtrl)
        if (!expr.value.match(/^\s*$/))
            Message(""+expr.value);
    },
    
    pop : function(text, doModal){
        
        if (!this.isDebugEvalEnabled())
            return
        
        exprCtrl = ''+ this.form.poopCommand + '(' + text + ', ' + (doModal ? 'Истина' :  'Ложь') + ')';
        
        exprCtrl = this.exprText(exprCtrl);
        
        // Рассчитаем отладочное значение в строке
        var expr = v8debug.eval(exprCtrl)
        if (!expr.value.match(/^\s*$/))
            Message(""+expr.value);
    },
    
    beforeExitApp : function () {
        //this.watcher.stopWatch();
    }, 
    
    changeSettings : function(){
        this.show(true);
    },
    
    saveSettings_Click : function(Button){
        this.saveSettings();
        this.loadSettings();
    },
    
    Cancel_Click : function(Button){
        this.close();
    }
    

})





////////////////////////////////////////////////////////////////////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее.
////

TextWindowsWatcher = stdlib.Class.extend({

    construct : function() {
        this.timerId = 0;
        this.lastActiveTextWindow = null;
        this.startWatch();
    },

    getActiveTextWindow : function () {
        if (this.lastActiveTextWindow && this.lastActiveTextWindow.IsActive())
            return this.lastActiveTextWindow;
        return null;
    },

    startWatch : function () {
        if (this.timerId)
            this.stopWatch();
        this.timerId = createTimer(500, this, 'onTimer');
    },

    stopWatch : function () {
        if (!this.timerId)
            return;
        killTimer(this.timerId);
        this.timerId = 0;
    },

    onTimer : function (timerId) {
        var wnd = GetTextWindow();    
        if (wnd)
            this.lastActiveTextWindow = wnd;
        else if (this.lastActiveTextWindow && !this.lastActiveTextWindow.IsActive())
            this.lastActiveTextWindow = null;
    }
    
}); // end of TextWindowsWatcher class

//} TextWindowsWatcher 

function fileExists(path) {

    if (path) 
    {
        var f = v8New('File', path);
        return f.IsFile() && f.Exist();
    }
    
    return false;
}

function pathExists(path) {

    if (path) 
    {
        var f = v8New('File', path);
        return f.Exist();
    }
    
    return false;
}



function getAbsolutePath(path) {

    // Путь относительный?
    if (path.match(/^\.{1,2}[\/\\]/))
    {
        // Относительные пути должны задаваться относительно главного каталога Снегопата.
        var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
        return mainFolder + path;
    }
    
    return path;
}

function GetDebugInstruments() {
    if (!DebugInstruments._instance)
        new DebugInstruments();
    
    return DebugInstruments._instance;
}



//var cht = GetFormatModule();
events.connect(Designer, "beforeExitApp", GetDebugInstruments());