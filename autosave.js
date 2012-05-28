$engine JScript
$uname autosave
$dname Автосохранение
$addin stdcommands
$addin stdlib
$addin global
global.connectGlobals(SelfScript)
// (c) Александр Орефков

// Восстановим настройки
var pflAutoSaveEnable = "Autosave/Enable"		// Зададим путь в профайле
var pflAutoSaveInterval = "Autosave/Interval"
var pflAutoSaveCopyCreate = "Autosave/CopyCreate"
// Для начала надо создать ключи в настройках, указав их дефолтные значения, а также
// в каком хранилище их сохранять, иначе setValue не будет работать.
// Будем сохранять в хранилище снегопата.
profileRoot.createValue(pflAutoSaveEnable, false, pflSnegopat)
profileRoot.createValue(pflAutoSaveInterval, 60, pflSnegopat)
profileRoot.createValue(pflAutoSaveCopyCreate, true, pflSnegopat)
// Теперь прочитаем актуальные значения из профайла
var enabled = profileRoot.getValue(pflAutoSaveEnable)
var interval = profileRoot.getValue(pflAutoSaveInterval)
var createcopy = profileRoot.getValue(pflAutoSaveCopyCreate)
var myTimerID = 0
var SavedWnd = {} //Будем хранить wnd окон несохраняемых (добавили новую обработку для теста, но не хотим сохранять...)
var mainFolder = profileRoot.getValue("Snegopat/MainFolder")
var notifysend = stdlib.require('NotifySend.js').GetNotifySend();

initTimer()

function initTimer()
{
    if(enabled){
        myTimerID = createTimer(interval * 1000, SelfScript.self, "onTimer")
    }
        
}

function FilterViews() {

     // Функция для добавления новых окон в список.
    // Перебирает все MDI-окна, и те, которых нет в списке, добавляет туда
    // Также определяет активное окно
    //debugger
    var views = []      // Массив всех конечных отображений
    var result = {}
    var childs = windows.mdiView.enumChilds();   // Получим список MDI-окон
    (function(views, list)  // Далее надо каждое MDI-окно "раскрутить" до конечных отображений,
    {                       // т.к. MDI-окно может быть контейнером для одного или нескольких отображений
        for(var i = 0; i < views.count; i++)
        {
            var v = views.item(i)
            if(v.isContainer != vctNo)  // Окно - контейнер. Рекурсивно раскрутим его потомков
                arguments.callee(v.enumChilds(), list)
            else    // Окно не контейнер. Добавим в общий список
                list.push(v) 
        }
    })(childs, views)
    var added = false
    // Перебираем весь список окон
    for(var idx in views)
    {
        var v = views[idx]
        if (v.title.indexOf('*')!=-1) {
            result[v.title] = v;
        }
        
    }
    return result
    
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
    // Сохраним все не сохраннеые файлы...
    
    function isAlive(view)
    {
        try{
            if(view.hwnd && view.position().state == vsMDI)
                return true
        }catch(e){}
        return false
    }
    var views = FilterViews();
    for (var key in views){
        var v=views[key]
        var mdname = ""
        if (isAlive(v)){

            var mdObj = v.mdObj
            if(mdObj)
            {
                mdname = mdObj.container.identifier
                //Message("title" + key+"identifier"+mdname);
            } else {

                mdname += v.title;
            }
        }
        filePath = mdname.replace(/\*|[|]/g, '');
        var isPath = true;
        var hawError = false;
        try {
            var f = v8New('File', filePath);
            if (!f.Exist()) {
                isPath = false
            }
        } catch (e) {
            isPath = false;
        }

        if (!isPath) {
            //TODO: запомнить текушее окно, 1 раз вывести сообщение с предложением исправить, и в следующие разы просто игнорировать. Сейчас просто игнорируем.
            continue;
        }
        if (createcopy){
            var лИмяФайла = f.ИмяБезРасширения + "-"+snegopat.parseTemplateString("<?\"\", ДатаВремя,\"ДФ=yyyyMMdd-HHmmss\">")+f.Расширение;
            try {
                FileCopy(f.FullName, ''+f.Путь+лИмяФайла);    
            } catch (e) {
                notifysend.Error("Не удалось сохранить файл", "Новый путь "+f.Путь+"\\"+лИмяФайла +"\n Ошибка "+e.description)
                hawError = true;
            }
        }
        stdcommands.Frame.FileSave.sendToView(v)
    }
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
    form.СоздаватьКопию = createcopy;
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
    if (form.СоздаватьКопию!=createcopy){

        createcopy = form.СоздаватьКопию;
        profileRoot.setValue(pflAutoSaveCopyCreate, createcopy)
    }
    form.Закрыть()
    if(myTimerID)
    {
        killTimer(myTimerID)
        myTimerID = 0
    }
    initTimer()
}
