$engine JScript
$uname AnalizeEventSubscript
$dname Анализ подписок на события
$addin vbs
$addin global
$addin stdlib

// (c) Александр Орефков
// Небольшой скрипт, показывающий отчет по подпискам на события объектов метаданных.
// Идея и схема компоновки данных взята из разработки Владислава Данилина "Анализ подписок на события"
// http://infostart.ru/public/123745/

global.connectGlobals(SelfScript)

var form, schema

(function()
{
    form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
    form.Результат.Columns.Add("mdobj")
    // Получим текст схемы
    var readXml = v8New("ЧтениеXML")
    readXml.OpenFile(SelfScript.fullPath.replace(/\js$/, 'xml'))
    schema = СериализаторXDTO.ReadXML(readXml)
})()

function ТаблицаПодписок()
{
    vt	= v8New("ТаблицаЗначений")
    vt.Колонки.Добавить("Метаданные");
    vt.Колонки.Добавить("Объект");
    vt.Колонки.Добавить("Имя");
    vt.Колонки.Добавить("Событие");
    vt.Колонки.Добавить("Обработчик");
    vt.Колонки.Добавить("mdobj");
    vt.Колонки.Добавить("event");
    
    choice = v8New("СписокЗначений")
    for(var i = 0, c = metadata.openedCount; i < c; i++)
    {
        var container = metadata.getContainer(i)
        try{
            if(container.rootObject.childObjectsCount("ПодпискиНаСобытия") > 0)
                choice.Add(container, container.identifier)
        }catch(e){}
    }
    if(choice.Count() == 0)
    {
        MessageBox("Нет конфигураций с подписками")
        return null
    }
    else if(choice.Count() == 1)
        choice = choice.Get(0)
    else
        choice = choice.ChooseItem("Выберите конфигурацию для отчета")
    if(!choice)
        return null
    var container = choice.Value
    var mdObj = container.rootObject
    //debugger
    for(var i = 0, c = mdObj.childObjectsCount("ПодпискиНаСобытия"); i < c; i++)
    {
        var event = mdObj.childObject("ПодпискиНаСобытия", i)
        var typeString = ЗначениеВСтрокуВнутр(event.property("Источник"))
        var typesUUIDs = typeString.replace(/\n/g, "").replace(/\{"#",f5c65050-3bbb-11d5-b988-0050bae0a95d,\{"Pattern",|\}\}|"#",/g, '').split(',')
        for(var idx in typesUUIDs)
        {
            var obj = container.findByTypeUUID(typesUUIDs[idx])
            var mdClassName = obj.mdclass.name(1, true)
            if(!mdClassName.length)
            {
                obj = container.rootObject
                mdClassName = " Конфигурация"
            }
            if(obj)
            {
                var row = vt.Add()
                row.Имя = event.name
                row.Событие = toV8Value(event.property("Событие")).presentation()
                row.Обработчик = toV8Value(event.property("Обработчик")).presentation()
                row.Объект = obj.name
                row.Метаданные = mdClassName
                row.mdobj = obj
                row.event = event
            }
        }
    }
    vt.Sort("Метаданные,Объект,Имя")
    form.ЭлементыФормы.Конфигурация.Заголовок = container.identifier
    return vt
}

function makeReport()
{
    var source = ТаблицаПодписок()
    if(!source)
        return
    var tree = form.Результат
    tree.Rows.Clear()
    var lastMdName, lastMdRow, lastObjName, lastObjRow
    
    for(var rows = new Enumerator(source); !rows.atEnd(); rows.moveNext())
    {
        var row = rows.item()
        if(row.Метаданные !== lastMdName)
        {
            lastMdName = row.Метаданные
            lastMdRow = tree.Rows.Add()
            lastMdRow.Событие = lastMdName
            lastMdRow.mdobj = row.mdobj
            lastObjName = undefined
        }
        if(row.Объект !== lastObjName)
        {
            lastObjName = row.Объект
            lastObjRow = lastMdRow.Rows.Add()
            lastObjRow.Событие = lastObjName
            lastObjRow.mdobj = row.mdobj
        }
        var tr = lastObjRow.Rows.Add()
        tr.Событие = row.Событие
        tr.Имя = row.Имя
        tr.Обработчик = row.Обработчик
        tr.mdobj = row.event
    }
}

function macrosОткрытьОтчет()
{
    form.Открыть()
}

function CmdPanelСформировать(Кнопка)
{
    makeReport()
}

function РезультатПриВыводеСтроки(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
    if(ДанныеСтроки.val.mdobj)
        ОформлениеСтроки.val.Cells.Событие.УстановитьКартинку(ДанныеСтроки.val.mdobj.picture)
}

function РезультатВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
    СтандартнаяОбработка.val = false
    var mdobj = ВыбраннаяСтрока.val.mdobj
    
    if(Колонка.val.Имя == "Обработчик")
    {
        var handler = ВыбраннаяСтрока.val.Обработчик.split(".")
        try{
        var modulMdObj = mdobj.container.rootObject.childObject("ОбщиеМодули", handler[0])
        }catch(e){}
        if(modulMdObj)
        {
            var txtEdt = modulMdObj.openModule("Модуль")
            var text = txtEdt.text
            var found = text.match(new RegExp("\\s*(процедура|функция|procedure|function)\\s+" + handler[1] + "\\s*\\(", "im"))
            if(found)
            {
                var line = 1
                text.substr(0, found.lastIndex).replace(/\n/g, function(){line++;return ''})
                txtEdt.setCaretPos(line + 1, 1) // Чтобы процедура по-любому развернулась и окно проскроллилось
                txtEdt.setSelection(line, 1, line, txtEdt.line(line).length + 1)
            }
        }
    }
    else
    {
        mdobj.activateInTree()
    }
}
