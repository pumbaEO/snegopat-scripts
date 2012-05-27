$engine JScript
$uname mdNavigator
$dname Навигатор по метаданным
$addin vbs
$addin global
$addin stdlib

stdlib.require('SyntaxAnalysis.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);
stdlib.require('ScriptForm.js', SelfScript);
global.connectGlobals(SelfScript)


// (c) Евгений JohnyDeath Мартыненков
// (c) Александр Орефков

var form = null
var vtMD = null
var currentFilter = ''
var listOfFilters = []
var listOfChoices = []
var fuctionlistview = false
var vtModules = v8New("ValueTable");
vtModules.Колонки.Add("Модуль");
vtModules.Колонки.Add("Наименование");
vtModules.Колонки.Add("Module1C");
var Icons = null;
var ЦветФонаДляМодулейМенеджера = v8New("Цвет", 240, 255, 240);

RowTypes = {
    'ProcGroup'     : 1,
    'FuncGroup'     : 2
}


function walkMdObjs(mdObj, parentName)
{
    // Получим и покажем класс объекта
    var mdc = mdObj.mdclass;
    var row = {UUID : mdObj.id}
    if (mdObj == metadata.current.rootObject)
        row.Name = "Конфигурация";
    else
        row.Name = (parentName == "Конфигурация" ? "" : parentName + ".") + mdc.name(1) + "." + mdObj.name
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

// Класс для отслеживания изменения текста в поле ввода, для замены
// события АвтоПодборТекста. Штатное событие плохо тем, что не возникает
// - при установке пустого текста
// - при изменении текста путем вставки/вырезания из/в буфера обмена
// - при отмене редактирования (Ctrl+Z)
// не позволяет регулировать задержку
// Параметры конструктора
// field - элемент управления поле ввода, чье изменение хотим отслеживать
// ticks - величина задержки после ввода текста в десятых секунды (т.е. 3 - 300 мсек)
// invoker - функция обратного вызова, вызывается после окончания изменения текста,
//  новый текст передается параметром функции
function TextChangesWatcher(field, ticks, invoker)
{
    this.ticks = ticks
    this.invoker = invoker
    this.field = field
}

// Начать отслеживание изменения текста
TextChangesWatcher.prototype.start = function()
{
    this.lastText = this.field.Значение.replace(/^\s*|\s*$/g, '').toLowerCase()
    this.noChangesTicks = 0
    this.timerID = createTimer(100, this, "onTimer")
}
// Остановить отслеживание изменения текста
TextChangesWatcher.prototype.stop = function()
{
    killTimer(this.timerID)
}
// Обработчик события таймера
TextChangesWatcher.prototype.onTimer = function()
{
    // Получим текущий текст из поля ввода
    vbs.var0 = this.field
    vbs.DoExecute("var0.GetTextSelectionBounds var1, var2, var3, var4")
    this.field.УстановитьГраницыВыделения(1, 1, 1, 10000)
    var newText = this.field.ВыделенныйТекст.replace(/^\s*|\s*$/g, '').toLowerCase()
    this.field.УстановитьГраницыВыделения(vbs.var1, vbs.var2, vbs.var3, vbs.var4)
    // Проверим, изменился ли текст по сравению с прошлым разом
    if(newText != this.lastText)
    {
        // изменился, запомним его
        this.lastText = newText
        this.noChangesTicks = 0
    }
    else
    {
        // Текст не изменился. Если мы еще не сигнализировали об этом, то увеличим счетчик тиков
        if(this.noChangesTicks <= this.ticks)
        {
            if(++this.noChangesTicks > this.ticks)  // Достигли заданного количества тиков.
                this.invoker(newText)               // Отрапортуем
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее и переходим по строке.
////

TextWindowsWatcher = stdlib.Class.extend({

    construct : function(LineNo) {
        this.timerId = 0;
        this.lastActiveTextWindow = null;
        this.Line = LineNo;
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
        this.timerId = createTimer(1*300, this, 'onTimer');
    },

    stopWatch : function () {
        if (!this.timerId)
            return;
        killTimer(this.timerId);
        this.timerId = 0;
    },
    
    goToLine : function() {
        if (!this.Line)
            return
        
        wnd = this.getActiveTextWindow()
        if (wnd){
            var LineNo = this.Line;
            var textline = wnd.GetLine(LineNo+1);
            wnd.SetCaretPos(LineNo+2, 1);
            wnd.SetSelection(LineNo+1, 1, LineNo+1, textline.length-1);
        }
    },

    onTimer : function (timerId) {
        var wnd = GetTextWindow();    
        if (wnd){
            this.lastActiveTextWindow = wnd;
            this.goToLine()
        }
        this.stopWatch();
    }
    
}); 
//} end of TextWindowsWatcher class

function readMDtoVT()
{
    vtMD = []
    walkMdObjs(metadata.current.rootObject, "")
}

function fillTableProcedur(filter)
{
    //Определим надо ли нам заполнять таблицу и надо ли вообще ее показывать...
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    var propsModules = [
    {propName: "Модуль",            title: "Открыть модуль",        hotkey: 13, modif: 0},
    {propName: "МодульОбъекта",     title: "Модуль объекта",        hotkey: 13, modif: 0},
    {propName: "Форма",            title: "Открыть модуль",        hotkey: 13, modif: 0},
    {propName: "МодульМенеджера",   title: "Модуль менеджера",      hotkey: 13, modif: 4}
    ]
    
    
    if(curRow && vtModules.Count()==0)
    {
        var mdObj = findMdObj(curRow.UUID)
        if(mdObj)
        {
            enabled = true;
            // Переберем свойства объекта, и добавим команды для их обработки
            var mdc = mdObj.mdclass
            for(var i = 0, c = mdc.propertiesCount; i < c; i++)
            {
                var mdPropName = mdc.propertyAt(i).name(1);
                for(var k in propsModules)
                {
                    if(propsModules[k].propName == mdPropName)
                    {
                        var text = mdObj.getModuleText(mdPropName);
                        parseModule = SyntaxAnalysis.AnalyseModule(text, true);
                        for (var z=0; z<parseModule._vtAllMethods.Count(); z++){
                            var НоваяСтрока = vtModules.Add();
                            var RowMethod = parseModule._vtAllMethods.Get(z);
                            НоваяСтрока.Модуль = mdPropName;
                            НоваяСтрока.Наименование = RowMethod.Name;
                            НоваяСтрока.Module1C = RowMethod._method;
                        }
                    }
                }
            }
        }
    }
    
    if (!form.ЭлементыФормы.ТаблицаПроцедур.Visible) {
        form.ЭлементыФормы.ТаблицаПроцедур.Visible = true;
    }
    var filters = filter.split(' ');
    form.ТаблицаПроцедур.clear();
    for (var i=0; i<vtModules.Count(); i++){
        var CurRow = vtModules.Get(i);
        Method = CurRow.Наименование.toLowerCase();
        var needAdd = true;
        if (filter.length>0){
            for(var s in filters)
            {
                if(Method.indexOf(filters[s]) < 0) {
                    needAdd = false
                    break;
                }
            }
        }
        if(!needAdd) continue
        
        var newRow = form.ТаблицаПроцедур.Add();
        newRow.Модуль = CurRow.Модуль;
        newRow.Наименование = CurRow.Наименование;
        newRow.RowNumber = CurRow.Module1C.StartLine;
        newRow.RowType = CurRow.Module1C.IsProc ? RowTypes.ProcGroup : RowTypes.FuncGroup;
    }
}

// Функция заполнения списка объектов метаданных
// Если есть строка фильтра, выводит объекты, удовлетворяющие фильтру,
// иначе выводит список последних выбранных объектов
function fillTable(newFilter)
{
    currentFilter = newFilter
    if (currentFilter.indexOf(":")!=-1){
        //form.ТаблицаМетаданных.Clear();
        form.ЭлементыФормы.Панель1.ТекущаяСтраница = form.ЭлементыФормы.Панель1.Страницы.Страница2;
    }else {
        form.ЭлементыФормы.Панель1.ТекущаяСтраница = form.ЭлементыФормы.Панель1.Страницы.Страница1;
        form.ТаблицаМетаданных.Clear();
    }
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
        if (currentFilter.indexOf(":")!=-1){
            fuctionlistview = true;
            var filters = currentFilter.substr(0, currentFilter.indexOf(":"));
            var filtersProc = currentFilter.substr(currentFilter.indexOf(":")+1);
            //Уже все есть, надо только вызвать нашу функцию. 
            fillTableProcedur(filtersProc);
            return;
        } else {
            var filters = currentFilter.split(' ')
            var filtersProc = "";
            fuctionlistview = false;
        }
        
        //var filters = currentFilter.split(' ')
        //var filters = currentFilter.substr(0, cur
        outer: for(var k in vtMD)
        {   
            for(var s in filters)
            {
                if(vtMD[k].lName.indexOf(filters[s])  < 0) 
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

function findMdObj(uuid)
{
    if(uuid == metadata.current.rootObject.id)
        return metadata.current.rootObject
    return metadata.current.findByUUID(uuid);
}

// Единый метод обработки выбора пользователя.
// Параметром передается функтор, который непосредственно выполняет действие.
function doAction(func)
{
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    if(!curRow)
        return
    var mdObj = findMdObj(curRow.UUID);
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
    // Очистим фильтр и закроем форму, указав как результат объект и функтор
    form.ТекстФильтра = ''
    form.ТекущийЭлемент = form.ЭлементыФормы.ТекстФильтра
    fillTable('')
    form.Close({mdObj:mdObj, func:func})
}

// Описание команд для обработки свойств
var propsCommands = [
    {propName: "Модуль",            title: "Открыть модуль",        hotkey: 13, modif: 0},
    {propName: "Картинка",          title: "Открыть картинку",      hotkey: 13, modif: 0},
    {propName: "Форма",             title: "Открыть форму",         hotkey: 13, modif: 0},
    {propName: "МодульОбъекта",     title: "Модуль объекта",        hotkey: 13, modif: 0},
    {propName: "МодульМенеджера",   title: "Модуль менеджера",      hotkey: 13, modif: 4},
    {propName: "Макет",             title: "Открыть макет",         hotkey: 13, modif: 0},
    {propName: "Права",             title: "Открыть права",         hotkey: 13, modif: 0},
]

// Функция настройки команд для текущего выбранного объекта
function updateCommands()
{
    // Сначала удалим непостоянные команды
    var cmdBar = form.ЭлементыФормы.Команды
    var buttons = cmdBar.Кнопки
    for(var k = buttons.Count() - 5; k > 0; k--)
        buttons.Delete(5)
    // Получим текущую выбранную строку
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    var enabled = false
    if(curRow)
    {
        var mdObj = findMdObj(curRow.UUID)
        if(mdObj)
        {
            enabled = true;
            // Переберем свойства объекта, и добавим команды для их обработки
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
    if (vtModules.Count()>0){
        vtModules.Clear();
    }
}

SelfScript.self['macrosОткрыть объект метаданных'] = function()
{
    if(!vtMD)
        readMDtoVT();
    if(!form)
    {
        form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
        form.КлючСохраненияПоложенияОкна = "mdNavigator"
        Icons = {
        'Func': form.Controls.PicFunc.Picture,
        'Proc': form.Controls.PicProc.Picture
        }

        // Заполним таблицу изначально
        fillTable('')
    }
    else
        currentFilter = form.ТекстФильтра.replace(/^\s*|\s*$/g, '').toLowerCase()
    
    updateCommands()
    // Будем отлавливать изменение текста с задержкой 300 мсек
    var tc = new TextChangesWatcher(form.ЭлементыФормы.ТекстФильтра, 3, fillTable)
    tc.start()
    var res = form.ОткрытьМодально()
    tc.stop()
    if(res) // Если что-то выбрали, вызовем обработчик
        res.func(res.mdObj)
}

/*
 * Обработчики событий формы
 */

// Это для пермещения вверх/вниз текущего выбора
function ТекстФильтраРегулирование(Элемент, Направление, СтандартнаяОбработка)
{
    //debugger
    if (form.ЭлементыФормы.Панель1.ТекущаяСтраница == form.ЭлементыФормы.Панель1.Страницы.Страница1){
        var curTableForm = form.ЭлементыФормы.ТаблицаМетаданных;
        var curTable = form.ТаблицаМетаданных;
    } else {
        var curTableForm = form.ЭлементыФормы.ТаблицаПроцедур;
        var curTable = form.ТаблицаПроцедур;
    }
    
    if(!curTableForm.ТекущаяСтрока)
        return
    var curRow = curTable.Индекс(curTableForm.ТекущаяСтрока), newRow = curRow
    
    if(-1 == Направление.val)
    {
        if(curRow != curTable.Количество() - 1)
            newRow++
    }
    else
    {
        if(curRow > 0)
            newRow--
    }
    if(newRow != curRow)
        curTableForm.ТекущаяСтрока = curTable.Получить(newRow)
    СтандартнаяОбработка.val = false
}

// Выбор из списка фильтров
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
            form.ТекстФильтра = res.Значение;
    }
}

// Изменение текущей строки - обновить команды
function ТаблицаМетаданныхПриАктивизацииСтроки(Элемент)
{
    updateCommands()
}

// Команда "Обновить МД"
function КомандыОбновитьМД(Кнопка)
{
    readMDtoVT()
    if(currentFilter.length)
        fillTable(currentFilter)
}

// Команда "Открыть в дереве"
function КомандыАктивировать(Кнопка)
{
    doAction(function(mdObj){mdObj.activateInTree()})
}

// Команда "Редактировать"
function КомандыРедактировать(Кнопка)
{
    doAction(function(mdObj){mdObj.openEditor()})
}

// Команда открытия свойств
function openProperty(Кнопка)
{
    var n = Кнопка.val.Name
    if (form.ЭлементыФормы.Панель1.ТекущаяСтраница == form.ЭлементыФормы.Панель1.Страницы.Страница1){
        doAction(function(mdObj){mdObj.editProperty(n)})
    } else {
        var CurRow = form.ЭлементыФормы.ТаблицаПроцедур.ТекущаяСтрока;
        if (CurRow) {
            startTextWindowWather(CurRow.RowNumber);
            var n = CurRow.Модуль;
            if (n=="Форма"){
                doAction(function(mdObj){mdObj.openModule(n.toString())})
            } else {
                doAction(function(mdObj){mdObj.editProperty(n.toString())})
            }
        }
    }
    /*
    doAction(function(mdObj)
    {
        var ep = mdObj.getExtProp(n);
        var file = ep.saveToFile(v8files.open("file://c:\\temp\\test.data", fomOut));
        file.close()
    })
    */
}
// Двойной щелчок по таблице
function ТаблицаМетаданныхВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
    doAction(function(mdObj){mdObj.activateInTree()})
}

function ТаблицаМетаданныхПриВыводеСтроки(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
    var mdObj = findMdObj(ДанныеСтроки.val.UUID);
    ОформлениеСтроки.val.Ячейки.Name.УстановитьКартинку(mdObj.picture)
}


function ТаблицаПроцедурПриВыводеСтроки(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
    //var mdObj = findMdObj(ДанныеСтроки.val.UUID);
    
    var cell = ОформлениеСтроки.val.Cells.Наименование;
    if (Icons!=null) {
        switch (ДанныеСтроки.val.RowType)
        {
        case RowTypes.FuncGroup:
            cell.SetPicture(Icons.Func);
            break;
        
        case RowTypes.ProcGroup:
            cell.SetPicture(Icons.Proc);
            break;
            
        default:
            break;
        }
    }
    if (ДанныеСтроки.val.Модуль == "МодульМенеджера"){
        ОформлениеСтроки.val.BackColor = ЦветФонаДляМодулейМенеджера;
    }
    //ОформлениеСтроки.val.Ячейки.Name.УстановитьКартинку(mdObj.picture)
}

function startTextWindowWather(line){
    (new TextWindowsWatcher(line)).startWatch();
}

function ТаблицаПроцедурВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
    
    startTextWindowWather(ВыбраннаяСтрока.val.RowNumber);
    var n = ВыбраннаяСтрока.val.Модуль;
    if (n=="Форма"){
        doAction(function(mdObj){mdObj.openModule(n.toString())})
    } else {
        doAction(function(mdObj){mdObj.editProperty(n.toString())})
    }
    
}




/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros()
{
    return 'Открыть объект метаданных';
}

// Создадим макросы для открытия модулей конфигурации
(function()
{
    var mdObj = metadata.current.rootObject
    var mdc = mdObj.mdclass
    for(var i = 0, c = mdc.propertiesCount; i < c; i++)
    {
        var mdProp = mdc.propertyAt(i)
        if(mdObj.isPropModule(mdProp.id))
        {
            var descr = mdProp.description.split('\n')[0].toLowerCase()
            SelfScript.self["macrosОткрыть " + descr] = new Function('metadata.current.rootObject.openModule("' + mdProp.id + '")')
        }
    }
})()

