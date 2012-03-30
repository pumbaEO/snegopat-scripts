$engine JScript
$uname traymessage
$dname Tray сообщение
$addin stdcommands
$addin global

// (c) Александр Орефков
// (c) Сосна Евгений

global.connectGlobals(SelfScript)

// Восстановим настройки
var pflTrayTimeEvent = "TrayMessage/TimeEvent" // Зададим путь в профайле
var pflTrayMessageInterval = "TrayMessage/Interval"
// Для начала надо создать ключи в настройках, указав их дефолтные значения, а также
// в каком хранилище их сохранять, иначе setValue не будет работать.
// Будем сохранять в хранилище снегопата.
//profileRoot.createValue(pflTrayMessageEnable, false, pflSnegopat)
profileRoot.createValue(pflTrayMessageInterval, 2, pflSnegopat)
// Теперь прочитаем актуальные значения из профайла
var interval = profileRoot.getValue(pflTrayMessageInterval)
var myTimerID = 0
var countTimer = 0;
var mainFolder = profileRoot.getValue("Snegopat/MainFolder")

Init();

function onCompare(cmd) {
    if(myTimerID)
    {
        killTimer(myTimerID)
        myTimerID = 0
    }
    if(!cmd.isBefore)
    {
        countTimer = 0;
        myTimerID = createTimer(interval * 1000, SelfScript.self, "onTimer")
    } 
}


function Init(){
    
    stdcommands.Config.CompareDBCfg.addHandler(SelfScript.self, "onCompare");
    stdcommands.Config.Update.addHandler(SelfScript.self, "onCompare");
    stdcommands.Config.LoadFromFile.addHandler(SelfScript.self, "onCompare");
    stdcommands.CfgStore.MergeCfgStoreWithFile.addHandler(SelfScript.self, "onCompare");
    stdcommands.CfgStore.MergeConfigWithCfgStore.addHandler(SelfScript.self, "onCompare");
    
}


// Всю работу будем делать во время простоя программы
function onTimer(timerID)
{
    view = windows.getActiveView();
    var id = view.id;
    var r = view.title;
    var re = new RegExp(/(Сравнение, объединение|Сравнение|Обновление)(.*)/);
    var mathes = r.match(re);
    if (mathes && mathes.length) {
        var caption = ''+windows.caption;
        caption = caption.replace(/\\/g, "\\\\");
        caption = caption.substr(0, 62);
        var cmd = mainFolder+'scripts\\bin\\TrayTip.exe "'+caption+'" "'+ 'Сравнение завершенно для ~n '+ mathes[2]+'"' +' 20 Info';
        ЗапуститьПриложение(cmd, "", false);
        if(myTimerID)
        {
            killTimer(myTimerID)
            myTimerID = 0
        }
    }
    countTimer++;
    if (countTimer>5) {
        if(myTimerID)
            {
                killTimer(myTimerID)
                myTimerID = 0;
                countTimer = 0;
            }
    }
    
}

// Макрос для вызова окна настройки
function macrosНастройкаTraСообщений()
{
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    // Обработку событий формы привяжем к самому скрипту
    form = loadScriptForm(pathToForm, SelfScript.self)
    form.Интервал = interval
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
