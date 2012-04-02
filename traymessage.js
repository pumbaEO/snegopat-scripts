$engine JScript
$uname traymessage
$dname Индикация окончания сравнения конфигураций
$addin stdcommands
$addin global

// (c) Сосна Евгений
// Скрипт определяет окна окончанием сравнения конфигураций: обновление, сравнение, сравнение с базой
//  сравнение с конфигурацией хранилища и выводит в трай сообщение. 
// Заголовок сообщения - Заголовок окна Конфигуратора (есть люди которые не пользуются configCaption ????)
// Текст - Сравнение окончено Конфигурация1 - Конфигурация 2 
// Время сообщения по умолчанию 15 сек, макс 30 


global.connectGlobals(SelfScript)

// Восстановим настройки
var pflTrayTimeEvent = "TrayMessage/TimeEvent" // Зададим путь в профайле
var pflTrayMessageInterval = "TrayMessage/Interval"
profileRoot.createValue(pflTrayMessageInterval, 1, pflSnegopat)
profileRoot.createValue(pflTrayTimeEvent, 20, pflSnegopat);

// Теперь прочитаем актуальные значения из профайла
var interval = profileRoot.getValue(pflTrayMessageInterval)
var timeout = profileRoot.getValue(pflTrayTimeEvent);
var myTimerID = 0
var myTimerIDMessage = 0;
var countTimer = 0;
var mainFolder = profileRoot.getValue("Snegopat/MainFolder")
var cmdExist = false;
var isUpdate = false;

Init();

function onCompare(cmd) {
    if(myTimerID)
    {
        //Message("timer kill before new "+myTimerID);
        killTimer(myTimerID)
        myTimerID = 0
    }
    if(!cmd.isBefore)
    {
        countTimer = 0;
        myTimerID = createTimer(interval * 1000, SelfScript.self, "onTimer")
        //Message("start timer "+myTimerID);
    } 
}

// Для обноления, если полностью на поддержке, при окончании обнолвения спрашивает, хочешь обновить базу?
// если забыли в течении минуты, тогда напомним. 
function onCompareUpdate(cmd) {

    if(myTimerID)
    {
        killTimer(myTimerID)
        myTimerID = 0
    }
    if(!cmd.isBefore)
    {
        countTimer = 0;
        myTimerID = createTimer(interval * 1000, SelfScript.self, "onTimer");
        //isUpdate = false;
        
    } else {
        isUpdate = true;
        events.connect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdate");
    }
}

function onUpdateDBCf(cmd) {
    if(cmd.isBefore)
    {
        events.connect(windows, "onDoModal", SelfScript.self, "onMessageBox");
    }
}

function onMessageBox(dlgInfo) {
    
    if ((dlgInfo.stage == beforeDoModal) && (dlgInfo.Caption=="Реорганизация информации")) { 
        //Стартанем таймер в 5 сек, больше не имеет смысла, вдруг будут разбираться, а что там изменилось. 
        myTimerIDMessage = createTimer(5 * 1000, SelfScript.self, "onTimerMessageBox");
       
    } else {
        if ((dlgInfo.stage == afterDoModal) && (dlgInfo.Caption=="Реорганизация информации")) { 
            if (myTimerIDMessage) {
                killTimer(myTimerIDMessage);
                myTimerIDMessage = 0;
            }
            events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBox");
        }
    }
    
}

function onMessageBoxUpdate(dlgInfo) {
    if ((dlgInfo.stage == openModalWnd) && (dlgInfo.Caption=="Конфигуратор")) {
        if(myTimerID)
        {
            //Message("timer kill before new "+myTimerID);
            killTimer(myTimerID)
            myTimerID = 0
        }
        myTimerID = createTimer(5 * 1000, SelfScript.self, "onTimerMessageBoxUpdate");
        
    } else {
        if ((dlgInfo.stage == afterDoModal) && (dlgInfo.Caption=="Конфигуратор")) {
            
            if (myTimerID) {
                killTimer(myTimerID);
                myTimerID = 0;
            }
            if (isUpdate) { //Мы быстрее отреагировали
                events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdate");
            }
        }
    
    }
}

function Init(){
    
    stdcommands.Config.CompareDBCfg.addHandler(SelfScript.self, "onCompare");
    stdcommands.Config.Update.addHandler(SelfScript.self, "onCompareUpdate");
    stdcommands.Config.LoadFromFile.addHandler(SelfScript.self, "onCompare");
    stdcommands.CfgStore.MergeCfgStoreWithFile.addHandler(SelfScript.self, "onCompare");
    stdcommands.CfgStore.MergeConfigWithCfgStore.addHandler(SelfScript.self, "onCompare");
    stdcommands.Config.UpdateDBCfg.addHandler(SelfScript.self, "onUpdateDBCf");
    // Подпишемся на событие при выводе предупреждения/вопроса о реорганизации. 
    //events.connect(windows, "onDoModal", SelfScript.self, "onMessageBox")
    
    var f = v8New("File", mainFolder+"scripts\\bin\\TrayTip.exe");
    cmdExist = f.Exist();
    
}

function TrayMessage(Title, Text, Timeout, Type) {
    
    if (Timeout==undefined) Timeout = timeout
    if (Text == undefined) Text = "";
    if (Title == undefined) return
    
    if ((Title.length > 62) && (Text.length==0)) {
        Text = Title.substr(62);
        Title = Title.substr(0, 62);
    }
    if (Type == undefined) Type = "Info";
    
    Title = Title.replace(/\\/g, "\\\\").substr(0, 62);
    Text = Text.replace(/\n/g, "~n").replace(/\t/g, "~t").replace(/"/g, "~q");
    
    if (!cmdExist) return 
    
    var cmd = mainFolder+'scripts\\bin\\TrayTip.exe "'+Title+'" "'+ Text +'" ' +Timeout+' '+Type;
    ЗапуститьПриложение(cmd, "", false);
    
    
}

// Всю работу будем делать во время простоя программы
function onTimer(timerID)
{
    //Message("timer exes "+myTimerID);
    view = windows.getActiveView();
    var id = view.id;
    var r = view.title;
    var re = new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(.*)/);
    var mathes = r.match(re);
    if (mathes && mathes.length) {
        var caption = ''+windows.caption;
        TrayMessage(caption, 'Сравнение завершенно для ~n '+ mathes[2])
        //var cmd = mainFolder+'scripts\\bin\\TrayTip.exe "'+caption+'" "'+ 'Сравнение завершенно для ~n '+ mathes[2]+'" ' +timeout+' Info';
        //ЗапуститьПриложение(cmd, "", false); 
        if(myTimerID)
        {
            //Message("timer kill "+myTimerID);
            killTimer(myTimerID)
            myTimerID = 0
        }
        if (isUpdate) {
            isUpdate = false;
            events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdate");
        }
    }
    countTimer++;
    if (countTimer>5) { //Такая простинькая защита от бесконечного цикла. 
        if(myTimerID)
            {
                
                killTimer(myTimerID)
                
                myTimerID = 0;
                countTimer = 0;
            }
        if (isUpdate) {
            isUpdate = false;
            events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdate");
        }
    }
    
}

function onTimerMessageBox(timerID) {

    var caption = ''+windows.caption;
    var text = "Хозяин ожидаю от тебя подтвеждения реорагинзации базы!"
    TrayMessage(text, caption, timeout, "Warning");
    if (myTimerIDMessage) {
        killTimer(myTimerIDMessage);
        myTimerIDMessage = 0;
    }
}

function onTimerMessageBoxUpdate(timerID) {
    var caption = ''+windows.caption;
    var text = "Хозяин жду от тебя подтвеждения обновления базы!"
    TrayMessage(text, caption, timeout, "Warning");
    if (myTimerID) {
        killTimer(myTimerID);
        myTimerID = 0;
    }
    isUpdate = false;
    events.disconnect(windows, "onDoModal", SelfScript.self, "onMessageBoxUpdate");
}

// Макрос для вызова окна настройки
function macrosНастройкаTraСообщений()
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
    return 'НастройкаTraСообщений';
}

// Обработчики нажатий кнопок в форме
function ОкНажатие(Элемент)
{
    if(form.ВремяСообщения != timeout)
    {
        timeout = form.ВремяСообщения
        profileRoot.setValue(pflTrayTimeEvent, timeout)
    }
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
