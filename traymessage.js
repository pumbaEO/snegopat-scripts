$engine JScript
$uname traymessage
$dname Индикация окончания сравнения конфигураций
$addin stdcommands
$addin global
$addin stdlib
// (c) Сосна Евгений
// Скрипт определяет окна окончанием сравнения конфигураций: обновление, сравнение, сравнение с базой
//  сравнение с конфигурацией хранилища и выводит в трай сообщение. 
// Заголовок сообщения - Заголовок окна Конфигуратора (есть люди которые не пользуются configCaption ????)
// Текст - Сравнение окончено Конфигурация1 - Конфигурация 2 
// Время сообщения по умолчанию 15 сек, макс 30 


global.connectGlobals(SelfScript)
stdlib.require('log4js.js', SelfScript);
var notifysend = stdlib.require('NotifySend.js').GetNotifySend();

// Восстановим настройки
var pflTrayMessageInterval = "TrayMessage/Interval"
profileRoot.createValue(pflTrayMessageInterval, 1, pflSnegopat)

// Теперь прочитаем актуальные значения из профайла
var interval = profileRoot.getValue(pflTrayMessageInterval)

var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
logger.addAppender(appender);
logger.setLevel(Log4js.Level.ERROR);

var isCfgMessageStrat = false;
Init();

function onSaveDB(cmd) {
    if(!cmd.isBefore)
    { 
        try {
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxSaveDB");
             } catch (e) { }
            
    } else {
        events.connect(windows, "onDoModal", SelfScript.self, "onMessageBoxSaveDB");
    }
}

function onMessageBoxSaveDB(dlgInfo) {
    if ((dlgInfo.stage == openModalWnd) && (dlgInfo.Caption=="Конфигуратор")) {
        var text = ''+windows.caption;
        var caption = "Выгрузка базы завершенна!";
        TrayMessage(caption, text);
        
    } else {
        if ((dlgInfo.stage == afterDoModal) && (dlgInfo.Caption=="Конфигуратор")) {
            
            try {
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxSaveDB");
             } catch (e) { }
            }
        }
}

function onSaveToFileCF(cmd) {
    if(!cmd.isBefore)
    { 
        try {
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxSaveToFileCF");
             } catch (e) { }
            
    } else {
        events.connect(windows, "onDoModal", SelfScript.self, "onMessageBoxSaveToFileCF");
    }
}

function onMessageBoxSaveToFileCF(dlgInfo) {
    if ((dlgInfo.stage == openModalWnd) && (dlgInfo.Caption=="Конфигуратор")) {
        var text = ''+windows.caption;
        var caption = "Выгрузка конфигурации завершенна!";
        TrayMessage(caption, text);
        
    } else {
        if ((dlgInfo.stage == afterDoModal) && (dlgInfo.Caption=="Конфигуратор")) {
            
            try {
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxSaveToFileCF");
             } catch (e) { }
            }
        }
}


function onRestoreDB(cmd) {
    if(!cmd.isBefore)
    { 
        try {
             events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxRestoreDB");
             } catch (e) { }
            
    } else {
        events.connect(windows, "onDoModal", SelfScript.self, "onMessageBoxRestoreDB");
    }
}

function onMessageBoxRestoreDB(dlgInfo) {
    //Message("1 "+dlgInfo.stage +" capt "+dlgInfo.Caption)
    if ((dlgInfo.stage == 1) && (dlgInfo.Caption=="")) {
    
        var text = ''+windows.caption;
        var caption = "Загрузка базы завершенна!";
        TrayMessage(caption, text);
        
    } else {
        //Message("3 "+dlgInfo.stage +" capt "+dlgInfo.Caption)
        if ((dlgInfo.stage == afterDoModal) && (dlgInfo.Caption=="")) {
       //Message("4 "+dlgInfo.stage +" capt "+dlgInfo.Caption)
       
            try {
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxRestoreDB");
             } catch (e) { }
            }
        }
}
// если забыли в течении минуты, тогда напомним. 

function onUpdateDBCf(cmd) {
    if(cmd.isBefore)
    {
        //Message("onUpdateDBCf before")
        events.connect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdateDBCf");
    } else {
        try {
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxRestoreDB");
             } catch (e) { }
        //Message("onUpdateDBCf after")
    }
}

function onMessageBoxUpdateDBCf(dlgInfo) {
    //Message("onMessageBoxUpdateDBCf state " + dlgInfo.stage + "caption" + dlgInfo.Caption)
    if ((dlgInfo.stage == beforeDoModal) && (dlgInfo.Caption=="Реорганизация информации")) { 
        //Message("  onMessageBoxUpdateDBCf state " + dlgInfo.stage + "caption" + dlgInfo.Caption)
        var caption = ''+windows.caption;
        var text = "Необходимо подтвеждение реорганизации базы!"
        TrayMessage(text, caption);
    } else {
        //Message("  else onMessageBoxUpdateDBCf state " + dlgInfo.stage + "caption" + dlgInfo.Caption)
        if ((dlgInfo.stage == afterDoModal) && (dlgInfo.Caption=="Реорганизация информации")) { 
            //Message("      elseif onMessageBoxUpdateDBCf state " + dlgInfo.stage + "caption" + dlgInfo.Caption)
            events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdateDBCf");
        }
    }
    
}

function onMessageCfgStore(param) {
    
    text = param.text;
    if (!text.length)
        return;
    
    
    if (text.indexOf("Начало операции с хранилищем")!=-1){
       isCfgMessageStrat = new Date();
    }
    
    if (text.indexOf("хранилищем конфигурации завершена")!=-1){
        var curDate = new Date();
        try {
            if ((curDate - isCfgMessageStrat) > 60000){
                TrayMessage("Хранилище", "Операция закончена. Дождались!", 20);
            }
         } catch(e){}
    }
    
    //events.disconnect(Designer, "onMessage", SelfScript.self, "onMessageCfgStore");
    //logger.error(text);
    //param.cancel = true;
    

}

function Init(){
    
    var compare = new TrayCompareWatcher();
    stdcommands.Config.CompareDBCfg.addHandler(new TrayCompareWatcher(), "onCompare");
    var compareUdate = new CompareUdate()
    stdcommands.Config.Update.addHandler(compareUdate, "onCompare");
    stdcommands.Config.LoadFromFile.addHandler(new TrayCompareWatcher(), "onCompare");
    stdcommands.CfgStore.MergeCfgStoreWithFile.addHandler(new TrayCompareWatcher(), "onCompare");
    stdcommands.CfgStore.MergeConfigWithCfgStore.addHandler(new TrayCompareWatcher(), "onCompare");
    stdcommands.Config.UpdateDBCfg.addHandler(SelfScript.self, "onUpdateDBCf");
    stdcommands.Config.SaveIBDataToFile.addHandler(SelfScript.self, "onSaveDB");
    stdcommands.Config.LoadIBDataFromFile.addHandler(SelfScript.self, "onRestoreDB");
    stdcommands.Config.SaveToFile.addHandler(SelfScript.self, "onSaveToFileCF");
    logger.debug('onMessage connect')
    events.connect(Designer, "onMessage", SelfScript.self, "onMessageCfgStore");

}

function TrayMessage(Title, Text, Timeout, Type) {
    notifysend.Info(Title, Text, Timeout);
}

function TrayCompareWatcher() {
     this.test1 = ""
}
TrayCompareWatcher.prototype.onCompare = function (cmd) {
    
    if(!cmd.isBefore)
    {
        //Message("TrayCompareWatcher is not before start")
        this.start();
    }  else {
        //Message("TrayCompareWatcher is before stop")
        this.stop();
    }
}
TrayCompareWatcher.prototype.start = function() {
    this.countTimer = 0;
    this.timerID = createTimer(interval * 1000, this, "onTimer")
    //Message("TrayCompareWatcher start " + this.timerID + " count " + this.countTimer)
}
TrayCompareWatcher.prototype.stop = function(){
    //Message("TrayCompareWatcher stop " + this.timerID + " count " + this.countTimer)
    if (this.timerID) killTimer(this.timerID)
    this.timerID = 0;
    this.countTimer = 0;
}
TrayCompareWatcher.prototype.onTimer = function (timerID) {

    view = windows.getActiveView();
    var id = view.id;
    var r = view.title;
    var re = new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(.*)/);
    var mathes = r.match(re);
    if (mathes && mathes.length) {
        var caption = ''+windows.caption;
        TrayMessage(caption, 'Сравнение завершено для ~n '+ mathes[2])
        this.stop()
    }
    this.countTimer++;
    //Message("TrayCompareWatcher onTimer "+this.countTimer + " timerID " +this.timerID)
    if (this.countTimer>5) { //Такая простинькая защита от бесконечного цикла. 
        this.stop()
    }
}

// Для обноления, если полностью на поддержке, при окончании обнолвения спрашивает, хочешь обновить базу?
function CompareUdate() {
     this.test1 = ""
     this.ConfigurationIsSupportet = false
}
CompareUdate.prototype.onCompare = function (cmd) {
    
    if(!cmd.isBefore)
    {
        //Message("CompareUdate is not before start")
        if (!this.ConfigurationIsSupportet){
            this.start()
            this.ConfigurationIsSupportet = false;
        }
    } else {
        //Message("CompareUdate is before stop")
        this.stop();
        events.connect(windows, "onDoModal", this, "onMessageBox");
    }
}
CompareUdate.prototype.start = function(time) {
    
    this.time = interval;
    this.countTimer = 0;
    this.timerID  = createTimer(this.time * 1000, this, "onTimer")
    //Message("CompareUdate start " + this.timerID + " count " + this.countTimer)
}
CompareUdate.prototype.stop = function(){
    //Message("CompareUdate stop " + this.timerID + " count " + this.countTimer)
    if (this.timerID) killTimer(this.timerID)
    
    this.timerID = 0;
    this.countTimer = 0;
}
CompareUdate.prototype.onTimer = function (timerID) {

    view = windows.getActiveView();
    var id = view.id;
    var r = view.title;
    var re = new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(.*)/);
    var mathes = r.match(re);
    if (mathes && mathes.length) {
        var caption = ''+windows.caption;
        TrayMessage(caption, 'Сравнение завершено для ~n '+ mathes[2])
        this.stop()
        try {
            events.disconnect(windows, "onDoModal", this, "onMessageBox");
        } catch (e) {
        
        }
    }
    this.countTimer++;
    //Message("CompareUdate onTimer "+this.countTimer + " timerID " +this.timerID)
    if (this.countTimer>5) { //Такая простинькая защита от бесконечного цикла. 
        //Message("CompareUdate onTimer "+this.countTimer + " timerID "+this.timerID)
        this.stop()
    }
}

CompareUdate.prototype.onMessageBox = function(dlgInfo) {
    //Message("CompareUdate onMessageBox dlgInfo stage"+dlgInfo.stage + " caption "+dlgInfo.Caption)
    if ((dlgInfo.stage == openModalWnd) && (dlgInfo.Caption=="Конфигуратор")) {
        this.stop();
        var caption = ''+windows.caption;
        var text = "Жду подтвеждения обновления базы!"
        TrayMessage(text, caption);
        try {
            events.disconnect(windows, "onDoModal", this, "onMessageBox");
        } catch (e) {
        
        }
        this.ConfigurationIsSupportet = true; //Конфигурация на поддержуке, формы диалога и сравнения не будет.
    }
}


// Макрос для вызова окна настройки
function macrosНастройкаTrayСообщений()
{
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    // Обработку событий формы привяжем к самому скрипту
    form = loadScriptForm(pathToForm, SelfScript.self)
    form.Интервал = interval
    form.ВремяСообщения = timeout;
    form.ОткрытьМодально()
    form = null
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'НастройкаTrayСообщений';
}

// Обработчики нажатий кнопок в форме
function ОкНажатие(Элемент)
{
    // Прочитаем значения из формы и если они изменились, сохраним их
    if(form.Интервал != interval)
    {
        interval = form.Интервал
        profileRoot.setValue(pflTrayMessageInterval, interval)
    }
    form.Закрыть()
    if(myTimerID)
    {
        killTimer(myTimerID)
        myTimerID = 0
    }
    Init();
}
