$engine JScript
$uname configCaption 
$dname Заголовок окна Конфигуратора
$addin global

global.connectGlobals(SelfScript)
var captionExprPath = "ConfigCaption/Expression"
profileRoot.createValue(captionExprPath, 'ibName() + $(metaDataVersion(), " (", ")") + " / " + cnnString() + " / " + mainTitleShort +  $(additionalTitle, " - [", "]")',
    pflSnegopat)
var captionExpr = profileRoot.getValue(captionExprPath)
var form

events.connect(windows, "onChangeTitles", SelfScript.self)

function setCaption(mainTitle, additionalTitle)
{
    var mainTitleShort = mainTitle.replace(/^Конфигуратор - /, "")
    windows.caption = eval(captionExpr) 
}

function ibName()
{
    return profileRoot.getValue("CmdLine/IBName").replace(/^\s*|\s*$/g, '');
}

function metaDataVersion()
{
    return metadata.current.rootObject.property("Версия")
}

function cnnString()
{
    КаталогИБ = НСтр(СтрокаСоединенияИнформационнойБазы(), "File")
    if(КаталогИБ)
        return КаталогИБ
    else
        return НСтр(СтрокаСоединенияИнформационнойБазы(), "Srvr") + ":" + НСтр(СтрокаСоединенияИнформационнойБазы(), "Ref")
}

function $(str, prefix, suffix, repl)
{
    if(arguments.length < 4)
        repl = ''
    if(arguments.length < 3)
        suffix = ''
    if(arguments.length < 2)
        prefix = ''
    return str.length ? prefix + str + suffix : repl
}

function onChangeTitles(param)
{
    setCaption(param.mainTitle, param.additionalTitle)
    param.cancel = true
}

setCaption(windows.mainTitle, windows.additionalTitle)

function macrosПоказатьНаименованиеБазы()
{
    Message("имя текущей базы = <" + ПолучитьНаименованиеБазы() + ">")
}

function ПолучитьНаименованиеБазы()
{
    return profileRoot.getValue("CmdLine/IBName").replace(/^\s*|\s*$/g, '');
}

function macrosПоказатьНаименованиеБазыПоПутиКНей()
{
    строкаСоединения = СтрокаСоединенияИнформационнойБазы();
    var baseName = ПолучитьНаименованиеБазы1CИзФайлаЗапуска(строкаСоединения)
    Message("имя текущей базы = <" + baseName + ">")
}

function ПолучитьНаименованиеБазы1CИзФайлаЗапуска(строкаСоединения)
{
    // удобно юзать из профиля CmdLine\IBName
    if(!строкаСоединения)
        return null
    Path1C = profileRoot.getValue("Dir/AppData") + "..\\1CEStart\\ibases.v8i"
    var file = v8New("Файл", Path1C)

    if(!file.Существует() || file.ЭтоКаталог())
    {
        Message("Файл <"+Path1C + "> не существует.")
        return
    }
    var textDoc = v8New("ТекстовыйДокумент")
    textDoc.Прочитать(Path1C)

    re_baseName = /^\s*\[\s*(.+)\s*\]\s*$/ig // имя базы без учета начальных и конечных пробелов
    re_connectString = /Connect=.*/ig // строка соединения
    
    var lineCount = textDoc.КоличествоСтрок()
    var currName = ""
    for(var lineNum = 1; lineNum <= lineCount; lineNum++)
    {
        var line = textDoc.ПолучитьСтроку(lineNum);
        if(line.match(re_baseName))
            currName = RegExp.$1.replace(/^\s*|\s*$/g, '')
        else if(line.match(re_connectString) && -1 != line.indexOf(строкаСоединения))
            return currName
    }
    return null
}

function macrosПоказатьСтрокуСоединенияИБ()
{
    КаталогИБ = НСтр(СтрокаСоединенияИнформационнойБазы(), "File")
    if(КаталогИБ)
        строкаСоединения = КаталогИБ
    else
        строкаСоединения = НСтр(СтрокаСоединенияИнформационнойБазы(), "Srvr") + ":" + НСтр(СтрокаСоединенияИнформационнойБазы(), "Ref")
    Message(строкаСоединения)
}

function macrosНастройка()
{
    form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
    form.Выражение = captionExpr
    form.ЭлементыФормы.Помощь.Заголовок = "Можно использовать:\n" + 
    "mainTitle - основной заголовок\n" +
    "mainTitleShort - основной заголовок без слова Конфигуратор\n" +
    "additionalTitle - дополнительный заголовок\n" +
    "ibName() - имя базы данных\n" +
    "metaDataVersion() - свойство \"Версия\" метаданных\n" +
    "cnnString() - данные из строки соединения\n" +
    "sVersion - версия Снегопата\n" +
    "v8Version - релиз 1С\n" +
    "Функция $(Строка, Префикс, Суффикс, ВместоПустой) - вывести Префикс + Строка + Суффикс если Строка не пустая, иначе вывести ВместоПустой\n"
    if(form.ОткрытьМодально())
    {
        captionExpr = form.Выражение
        profileRoot.setValue(captionExprPath, captionExpr)
        setCaption(windows.mainTitle, windows.additionalTitle)
    }
    form = null
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

function КоманднаяПанель1Проверить(Кнопка)
{
    var mainTitle = windows.mainTitle, additionalTitle = windows.additionalTitle
    var mainTitleShort = mainTitle.replace(/^Конфигуратор - /, "")
    MessageBox(eval(form.Выражение))
}

function КоманднаяПанель1ОК(Кнопка)
{
    form.Закрыть(true)
}
