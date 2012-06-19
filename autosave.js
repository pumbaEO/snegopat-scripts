$engine JScript
$uname autosave
$dname Автосохранение
$addin stdcommands
// (c) Александр Орефков

// Восстановим настройки
var pflAutoSaveEnable = "Autosave/Enable"		// Зададим путь в профайле
var pflAutoSaveInterval = "Autosave/Interval"
// Для начала надо создать ключи в настройках, указав их дефолтные значения, а также
// в каком хранилище их сохранять, иначе setValue не будет работать.
// Будем сохранять в хранилище снегопата.
profileRoot.createValue(pflAutoSaveEnable, false, pflSnegopat)
profileRoot.createValue(pflAutoSaveInterval, 60, pflSnegopat)
// Теперь прочитаем актуальные значения из профайла
var enabled = profileRoot.getValue(pflAutoSaveEnable)
var interval = profileRoot.getValue(pflAutoSaveInterval)
var myTimerID = 0

initTimer()

function initTimer()
{
    if(enabled)
        myTimerID = createTimer(interval * 1000, SelfScript.self, "onTimer")
}

// Всю работу будем делать во время простоя программы
function onTimer(timerID)
{
    // Временно отключим настройку "Проверять автоматически"
    var isAutoCheck = profileRoot.getValue("ModuleTextEditor/CheckAutomatically")
    if(isAutoCheck)
        profileRoot.setValue("ModuleTextEditor/CheckAutomatically", false)
    // Сохраним конфигурацию
    stdcommands.Config.Save.send()
    // Сохраним текущий файл
    stdcommands.Frame.FileSave.send()
    // Восстановим настройку "Проверять автоматически"
    if(isAutoCheck)
        profileRoot.setValue("ModuleTextEditor/CheckAutomatically", true)
}

// Макрос для вызова окна настройки
function macrosНастройкаАвтоСохранения()
{
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    // Обработку событий формы привяжем к самому скрипту
    form = loadScriptForm(pathToForm, SelfScript.self)
    form.Включить = enabled
    form.Интервал = interval
    form.ОткрытьМодально()
    form = null
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'НастройкаАвтоСохранения';
}

// Обработчики нажатий кнопок в форме
function ОкНажатие(Элемент)
{
    // Прочитаем значения из формы и если они изменились, сохраним их
    if(form.Включить != enabled)
    {
        enabled = form.Включить
        profileRoot.setValue(pflAutoSaveEnable, enabled)
    }
    if(form.Интервал != interval)
    {
        interval = form.Интервал
        profileRoot.setValue(pflAutoSaveInterval, interval)
    }
    form.Закрыть()
    if(myTimerID)
    {
        killTimer(myTimerID)
        myTimerID = 0
    }
    initTimer()
}
