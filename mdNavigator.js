$engine JScript
$uname mdNavigator
$dname Навигатор по метаданным
$addin vbs
$addin global

global.connectGlobals(SelfScript)

// (c) Евгений JohnyDeath Мартыненков
var form = null
var vtMD = null
var currentFilter = ''
var listOfFilters = []
var listOfChoices = []

function walkMdObjs(mdObj, parentName)
{
    // Получим и покажем класс объекта
    var mdc = mdObj.mdclass;
    var row = {UUID : mdObj.id}
    if (mdObj == metadata.current.rootObject)
        row.Name = "Конфигурация";
    else
        row.Name = (parentName == "Конфигурация" ? "" : parentName + ".") + mdc.name(1, true) + "." + mdObj.name
    row.lName = row.Name.toLowerCase()
    vtMD.push(row)

    // Перебираем классы потомков (например у Документа это Реквизиты, ТабличныеЧасти, Формы)
    for(var i = 0; i < mdc.childsClassesCount; i++)
    {
        var childMdClass = mdc.childClassAt(i)
        //Реквизиты пропустим
        if (childMdClass.name(1, true) == "Реквизиты") {continue}

        // Для остального переберем потомков этого класса.
        for(var chldidx = 0, c = mdObj.childObjectsCount(i); chldidx < c; chldidx++){
            var childObject = mdObj.childObject(i, chldidx);
            walkMdObjs(childObject, row.Name);
        }
    }
}

function PropsOfMdObj(mdObj){
    var text = []
    var mdc = mdObj.mdclass
    var okStr = "Модуль,Картинка,Форма,МодульОбъекта,МодульМенеджера,";

    for(var i = 0, c = mdc.propertiesCount; i < c; i++)
    {
        var mdPropName = mdc.propertyAt(i).name(1);
        if (okStr.search(mdPropName + '\,') != -1)
            text.push(mdPropName);
    }

    return text;
}

function onTimer()
{
    vbs.var0 = form.ЭлементыФормы.ТекстФильтра
    vbs.DoExecute("var0.GetTextSelectionBounds var1, var2, var3, var4")
    form.ЭлементыФормы.ТекстФильтра.УстановитьГраницыВыделения(1, 1, 1, 10000)
    var newText = form.ЭлементыФормы.ТекстФильтра.ВыделенныйТекст.replace(/^\s*|\s*$/g, '').toLowerCase()
    form.ЭлементыФормы.ТекстФильтра.УстановитьГраницыВыделения(vbs.var1, vbs.var2, vbs.var3, vbs.var4)
    if(newText != currentFilter)
    {
        currentFilter = newText
        fillTable()
    }
}

function readMDtoVT()
{
    vtMD = []
    walkMdObjs(metadata.current.rootObject, "")
}

function fillTable()
{
    form.ТаблицаМетаданных.Clear()
    var mode = ''
    if(!currentFilter.length)
    {
        mode = "Недавно используемые объекты:"
        for(var k in listOfChoices)
        {
            var row = form.ТаблицаМетаданных.Add()
            row.Name = listOfChoices[k].Name
            row.UUID = listOfChoices[k].UUID
        }
    }
    else
    {
        var filters = currentFilter.split(' ')
        outer: for(var k in vtMD)
        {
            for(var s in filters)
            {
                if(vtMD[k].lName.indexOf(filters[s]) < 0)
                    continue outer
            }
            var row = form.ТаблицаМетаданных.Add()
            row.Name = vtMD[k].Name
            row.UUID = vtMD[k].UUID
        }
        mode = "Объекты, подходящие под фильтр '" + currentFilter + "' (" + form.ТаблицаМетаданных.Количество() + " шт.):"
    }
    form.ЭлементыФормы.Режим.Заголовок = mode
    if(form.ТаблицаМетаданных.Количество())
        form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока = form.ТаблицаМетаданных.Получить(0)
}

function doAction(func)
{
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    if(!curRow)
        return
    var mdObj = metadata.current.findByUUID(curRow.UUID);
    if(!mdObj)
    {
        MessageBox("Объект '" + curRow.Name + "' не найден.");
        return
    }
    // Сохраним текущий фильтр в списке
    if(form.ТекстФильтра.length)
    {
        for(var k in listOfFilters)
        {
            if(listOfFilters[k] == form.ТекстФильтра)
            {
                listOfFilters.splice(k, 1)
                break
            }
        }
        listOfFilters.unshift(form.ТекстФильтра)
        if(listOfFilters.length > 15)
            listOfFilters.pop()
    }
    // Сохраним текущий объект в списке
    var row = {Name: curRow.Name, UUID: curRow.UUID}
    for(var k in listOfChoices)
    {
        if(listOfChoices[k].UUID == row.UUID)
        {
            listOfChoices.splice(k, 1)
            break
        }
    }
    listOfChoices.unshift(row)
    if(listOfChoices.length > 15)
        listOfChoices.pop()
    // Очистим фильтр и закроем форму
    form.ТекстФильтра = ''
    currentFilter = ''
    form.ТекущийЭлемент = form.ЭлементыФормы.ТекстФильтра
    fillTable()
    // Вызовем функцию для объекта метаданных
    form.Close({mdObj:mdObj, func:func})
}

var propsCommands = [
    {propName: "Модуль",            title: "Открыть модуль",        hotkey: 13, modif: 0},
    {propName: "Картинка",          title: "Открыть картинку",      hotkey: 13, modif: 0},
    {propName: "Форма",             title: "Открыть форму",         hotkey: 13, modif: 0},
    {propName: "МодульОбъекта",     title: "Модуль объекта",        hotkey: 13, modif: 0},
    {propName: "МодульМенеджера",   title: "Модуль менеджера",      hotkey: 13, modif: 4},
]

function updateCommands()
{
    var cmdBar = form.ЭлементыФормы.Команды
    var buttons = cmdBar.Кнопки
    for(var k = buttons.Count() - 5; k > 0; k--)
        buttons.Delete(5)
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    var enabled = false
    if(curRow)
    {
        var mdObj = metadata.current.findByUUID(curRow.UUID)
        if(mdObj)
        {
            enabled = true;
            var mdc = mdObj.mdclass
            for(var i = 0, c = mdc.propertiesCount; i < c; i++)
            {
                var mdPropName = mdc.propertyAt(i).name(1);
                for(var k in propsCommands)
                {
                    if(propsCommands[k].propName == mdPropName)
                    {
                        var cmd = buttons.Add(mdPropName, ТипКнопкиКоманднойПанели.Действие,
                            propsCommands[k].title, v8New("Действие", "openProperty"))
                        // Очень хитрый способ назначить любой хоткей, любезно взято с
                        // http://infostart.ru/public/22214/
                        cmd.СочетаниеКлавиш = ЗначениеИзСтрокиВнутр(
                            '{"#",69cf4251-8759-11d5-bf7e-0050bae2bc79,1,\n{0,' +
                            propsCommands[k].hotkey + ',' +
                            propsCommands[k].modif + '}\n}')
                        cmd.ToolTip = cmd.Description = propsCommands[k].title
                        break
                    }
                }
            }
        }
    }
    buttons.Get(2).Enabled = enabled
    buttons.Get(3).Enabled = enabled
}

SelfScript.self['macrosОткрыть объект метаданных'] = function()
{
    if(!vtMD)
        readMDtoVT();
    if(!form)
    {
        form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
        form.КлючСохраненияПоложенияОкна = "mdNavigator"
        // Заполним таблицу изначально
        currentFilter = ""
        fillTable()
    }
    else
        currentFilter = form.ТекстФильтра.replace(/^\s*|\s*$/g, '').toLowerCase()
    
    // Будем опрашивать изменение текста каждые 400 мсек
    tID = createTimer(400, SelfScript.self, "onTimer")
    updateCommands()
    var res = form.ОткрытьМодально()
    killTimer(tID)
    if(res)
        res.func(res.mdObj)
}

function ТекстФильтраРегулирование(Элемент, Направление, СтандартнаяОбработка)
{
    if(!form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока)
        return
    var curRow = form.ТаблицаМетаданных.Индекс(form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока), newRow = curRow
    
    if(-1 == Направление.val)
    {
        if(curRow != form.ТаблицаМетаданных.Количество() - 1)
            newRow++
    }
    else
    {
        if(curRow > 0)
            newRow--
    }
    if(newRow != curRow)
        form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока = form.ТаблицаМетаданных.Получить(newRow)
    СтандартнаяОбработка.val = false
}

function ТекстФильтраНачалоВыбора(Элемент, СтандартнаяОбработка)
{
    СтандартнаяОбработка.val = false
    if(listOfFilters.length)
    {
        var vl = v8New("СписокЗначений")
        for(var k in listOfFilters)
            vl.Add(listOfFilters[k])
        var res = form.ВыбратьИзСписка(vl, Элемент.val)
        if(res)
        {
            form.ТекстФильтра = res.Значение;
            onTimer()
        }
    }
}

function КомандыАктивировать(Кнопка)
{
    doAction(function(mdObj){mdObj.activateInTree()})
}

function КомандыРедактировать(Кнопка)
{
    doAction(function(mdObj){mdObj.openEditor()})
}

function ТаблицаМетаданныхПриАктивизацииСтроки(Элемент)
{
    updateCommands()
}

function ТаблицаМетаданныхВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
}

function КомандыОбновитьМД(Кнопка)
{
    readMDtoVT()
    if(currentFilter.length)
        fillTable()
}

function openProperty(Кнопка)
{
    var n = Кнопка.val.Name
    doAction(function(mdObj){mdObj.editProperty(n)})
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros()
{
    return 'Открыть объект метаданных';
}
