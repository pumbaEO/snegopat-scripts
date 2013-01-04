$engine JScript
$uname mdNavigator
$dname Навигатор по метаданным
$addin vbs
$addin global
$addin stdlib

stdlib.require('SyntaxAnalysis.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);
stdlib.require('ScriptForm.js', SelfScript);
stdlib.require('SettingsManagement.js', SelfScript);
stdlib.require("SelectValueDialog.js", SelfScript);

global.connectGlobals(SelfScript)


// (c) Евгений JohnyDeath Мартыненков
// (c) Александр Орефков
// (c) Сосна Евгений <shenja@sosna.zp.ua>

var form = null
var vtMD = null
var currentFilter = ''
var listOfFilters = v8New("ValueList")
var listOfChoices = []
var fuctionlistview = false
var vtModules = v8New("ValueTable");
vtModules.Колонки.Add("Модуль");
vtModules.Колонки.Add("Наименование");
vtModules.Колонки.Add("Module1C");
var Icons = null;
var ЦветФонаДляМодулейМенеджера = v8New("Цвет", 240, 255, 240);
var treeSubSystems = null;
var subSystemMap = v8New("Map")
var isFilterOnSubSystem = false;
var subSystemFilter = {};
var currentSubSystemFilter = "";
var recursiveSubsystems = false;
var settings; // Хранит настройки скрипта (экземпляр SettingsManager'а).

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
    row.lName = row.Name.toLowerCase();
    row.parentUUID = (!mdObj.parent) ? "" : mdObj.parent.id;
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
    if(form.ТаблицаПроцедур.Количество())
        form.ЭлементыФормы.ТаблицаПроцедур.ТекущаяСтрока = form.ТаблицаПроцедур.Получить(0)
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
    var formTitle = 'Навигатор метаданных';
    if(!currentFilter.length & !isFilterOnSubSystem)
    {
        mode = "Недавно используемые объекты:"
        for(var k in listOfChoices)
        {
            var row = form.ТаблицаМетаданных.Add()
            row.Name = listOfChoices[k].Name
            row.UUID = listOfChoices[k].UUID
        }
        form.ЭлементыФормы.Подсистема.Видимость = false;
    } 
    else
    {
        if (form.ТаблицаМетаданных.Columns.Find("Rate") == undefined){
            var КвалификаторЧисла = v8New("КвалификаторыЧисла", 25, 10, ДопустимыйЗнак.Любой);
            form.ТаблицаМетаданных.Columns.Add("Rate", v8New("ОписаниеТипов", "Число", КвалификаторЧисла));
        }

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
            var lNameLength = 500;
            var maxIndex = 0;
            var rate = 0;
            if (isFilterOnSubSystem){
                if (!subSystemFilter.hasOwnProperty(vtMD[k].UUID) && !subSystemFilter.hasOwnProperty(vtMD[k].parentUUID)){
                    continue;
                }
            }
            var filtersLenth = (!filters.length)?1:filters.length
            var surcharge = lNameLength/filtersLenth;
            for(var s in filters)
            {
                var index = vtMD[k].lName.indexOf(filters[s])
                if( index < 0) {
                    continue outer
                } else {
                    //Посчитаем рейтинг...
                    percent = (100*index)/lNameLength;
                    if (percent < maxIndex) 
                        rate +=surcharge;
                    rate = rate + percent;
                    maxIndex = percent
                }
            }

            var row = form.ТаблицаМетаданных.Add()
            row.Name = vtMD[k].Name
            row.UUID = vtMD[k].UUID
            row.Rate = rate;
        }
        form.ТаблицаМетаданных.Sort("Rate, Name");
        mode+= (!currentFilter.length)?"":"фильтр '" + currentFilter + "' (" + form.ТаблицаМетаданных.Количество() + " шт.):"
        if (isFilterOnSubSystem){
            form.ЭлементыФормы.Подсистема.Видимость = true;
            form.ЭлементыФормы.Подсистема.Заголовок  = "    "+currentSubSystemFilter+((recursiveSubsystems)?" (рекурсивно)":"");
            formTitle+=" подсистема "+currentSubSystemFilter+((recursiveSubsystems)?" (рекурсивно)":"");
        }
        

    }
    form.ЭлементыФормы.Режим.Заголовок = mode
    form.Заголовок = formTitle;
    if(form.ТаблицаМетаданных.Количество())
        form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока = form.ТаблицаМетаданных.Получить(0)
}

function findMdObj(uuid)
{
    if(uuid == metadata.current.rootObject.id)
        return metadata.current.rootObject
    return metadata.current.findByUUID(uuid);
}

function withSelected(func)
{
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    if(!curRow)
        return
    for(var rows = new Enumerator(form.Controls.ТаблицаМетаданных.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext())
        func(rows.item().Окно)
}

// Единый метод обработки выбора пользователя.
// Параметром передается функтор, который непосредственно выполняет действие.
function doAction(func)
{
    var isMultiSelect = (form.Controls.ТаблицаМетаданных.ВыделенныеСтроки.Count() > 1)?true:false;
    var curRow = form.ЭлементыФормы.ТаблицаМетаданных.ТекущаяСтрока
    if(!curRow)
        return
    var mdObj = findMdObj(curRow.UUID);
    if(!mdObj)
    {
        MessageBox("Объект '" + curRow.Name + "' не найден.");
        if (!isMultiSelect)
            return
    }
    // Сохраним текущий фильтр в списке
    if(form.ТекстФильтра.length)
    {
        addToHistory(form.ТекстФильтра);
        
    }
    if (!isMultiSelect){
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
            
    }
    // Очистим фильтр и закроем форму, указав как результат объект и функтор
    form.ТекстФильтра = ''
    form.ТекущийЭлемент = form.ЭлементыФормы.ТекстФильтра
    var res = {mdObj:mdObj, func:func};
    if (isMultiSelect){
        var res = [];
        for(var rows = new Enumerator(form.Controls.ТаблицаМетаданных.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext()){

            var mdObj = findMdObj(rows.item().UUID);
            
            if(!mdObj)
            {
                Message("Объект '" + curRow.Name + "' не найден.");
                continue;
            }
            res.push({mdObj:mdObj, func:func});
        }

    }

    fillTable('');
    form.Close(res);
    
    
}

function addToHistory(query) {
        
        if (!query) 
            return;
        
        // Добавляем в историю только если такой поисковой строки там нет.
        if (!listOfFilters){
            listOfFilters = v8New("ValueList");
        }
        var history = listOfFilters;
        if (history.FindByValue(query))
            return;
            
        if (history.Count())
            history.Insert(0, query);
        else
            history.Add(query);
           
        // Не позволяем истории расти более заданной глубины.
        while (history.Count() > 20)
            history.Delete(history.Count() - 1);
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
    for(var k = buttons.Count() - 7; k > 0; k--)
        buttons.Delete(7)
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
    buttons.Get(5).Enabled = enabled
    buttons.Get(6).Enabled = true;
    buttons.Get(6).Пометка = isFilterOnSubSystem;
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
        fillTable('');

    }
    else
        currentFilter = form.ТекстФильтра.replace(/^\s*|\s*$/g, '').toLowerCase()
    
    updateCommands()

    // Будем отлавливать изменение текста с задержкой 300 мсек
    var tc = new TextChangesWatcher(form.ЭлементыФормы.ТекстФильтра, 3, fillTable)
    tc.start()
    var wnd = GetTextWindow();    
    if (wnd){
        var selText = wnd.GetSelectedText();
        selText = selText.replace(/^\s*|\s*$/g, '');
        if (selText.length>0){
            if (currentFilter.length==0){
                form.ЭлементыФормы.ТекстФильтра.Значение = selText;
            }
        }
    }

    var res = form.ОткрытьМодально()
    tc.stop()
    if(res) // Если что-то выбрали, вызовем обработчик
        var typeName = Object.prototype.toString.call(res);
        if (typeName === '[object Array]') {
            for (var i=0; i<res.length; i++) {
                res[i].func(res[i].mdObj);
            }
        } else if (typeName === '[object Object]') {            
            res.func(res.mdObj)
        }
}

/*
 * Обработчики событий формы
 */

// Это для пермещения вверх/вниз текущего выбора
function ТекстФильтраРегулирование(Элемент, Направление, СтандартнаяОбработка)
{
    
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
    if(listOfFilters.Count())
    {
        //var vl = v8New("СписокЗначений")
        //for(var k in listOfFilters)
        //    vl.Add(listOfFilters[k])
        var res = form.ВыбратьИзСписка(listOfFilters, Элемент.val)
        if(res){
            form.ТекстФильтра = res.Значение;

            if (form.ТекстФильтра.length){
                new ActiveXObject("WScript.Shell").SendKeys("{END}");
            }
        }
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

function КомандыCaptureIntoCfgStore(Кнопка){
    doAction(function(mdObj){
        try {
            var cfgStore = stdlib.require(stdlib.getSnegopatMainFolder()+"scripts\\CfgStore.js");    
            cfgStore.CaptureIntoCfgStore(mdObj);
        } catch (e){
            Message(""+e.description())
        }
    });
}

function fillSubSystemUUIDRecursive(row){
    if (recursiveSubsystems){
        for (var i=0; i<row.Rows.Count(); i++){
            var curRow = row.Rows.Get(i);
            fillSubSystemUUIDRecursive(curRow);
        }
    }
    var arrayСостав = subSystemMap.Get(row.Имя);
    for (var i=0; i<arrayСостав.Count(); i++){
        var uuid = arrayСостав.Get(i);
        subSystemFilter[uuid]=true;
    }    
}

function КомандыFilterOnSubSystem(Кнопка){
    var selectedRow = null;
    if (!treeSubSystems)
        walkSubSystems();
    if (treeSubSystems.Rows.Count()>0){
        var curRow = treeSubSystems.Rows.Get(0);
        var indent = "";
        var valuelist = v8New("ValueList");
        (function (row,valuelist,indent) {
            for (var i = 0; i<row.Rows.Count(); i++){
                var curRow = row.Rows.Get(i);
                valuelist.Add(curRow, ""+indent+curRow.Имя);

                if (curRow.Rows.Count()>0){
                    arguments.callee(curRow, valuelist, indent+"    ");
                }
            }
        
        })(curRow, valuelist, indent);    

        var dlg = new SelectValueDialogMdNavigator("Какую подсистему желаете отобрать?", valuelist, form.Controls.PicRecursive.Picture);
        dlg.form.sortByName = recursiveSubsystems; //Тут переорпределяем кнопку сортировки по алфавиту на кнопку рекурсивного обхода. 
        
        result = dlg.selectValue(null, currentSubSystemFilter);
        selectedRow = dlg.selectedValue;
        
        recursiveSubsystems = dlg.form.sortByName;
    }
    
    if (!selectedRow){
        isFilterOnSubSystem = false;
        currentSubSystemFilter = "";
    } else{
        subSystemFilter = {};
        currentSubSystemFilter = selectedRow.Имя;
        isFilterOnSubSystem = true;
        fillSubSystemUUIDRecursive(selectedRow);
    }

    if(currentFilter.length)
        fillTable(currentFilter);
    else
        fillTable('');

    updateCommands();
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
    try{ОформлениеСтроки.val.Ячейки.Name.УстановитьКартинку(mdObj.picture)}catch(e){}
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

function parseSubSystems (mdObj, row){
        // Получим и покажем класс объекта
        var mdc = mdObj.mdclass;
        //var mdPropName = mdc.propertyAt(0);
        var Имя = toV8Value(mdObj.property(0)).presentation();
        var Состав = toV8Value(mdObj.property("Content")).toStringInternal();
        var newRow = row.Rows.Add();
        newRow.Имя = ""+Имя;
        var arrayСостав = v8New("Array");
        //newRowContent = newRow.Rows.Add();
        arrayСостав.Add(mdObj.id);
        //newRowContent.Состав = mdObj.id; //Добавим самих себя в состав.
        var listUUID = v8New("ValueList");
        var re = new RegExp(/\{"#",157fa490-4ce9-11d4-9415-008048da11f9,\n\{1,(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\}/igm);
        while ((matches = re.exec(Состав)) != null){
            arrayСостав.Add( "{"+matches[1].toUpperCase()+"}");
            //newRowContent = newRow.Rows.Add();
            //newRowContent.Состав = "{"+matches[1].toUpperCase()+"}";
        }
        subSystemMap.Insert(newRow.Имя, arrayСостав);
        
        // Перебираем классы потомков (например у Документа это Реквизиты, ТабличныеЧасти, Формы)
        for(var i = 0; i < mdc.childsClassesCount; i++)
        {
            var childMdClass = mdc.childClassAt(i)
            
            for(var chldidx = 0, c = mdObj.childObjectsCount(i); chldidx < c; chldidx++)
                parseSubSystems(mdObj.childObject(i, chldidx), newRow)
        }
}

function walkSubSystems(){
        
    var md = metadata.current;
    treeSubSystems = v8New("ValueTree");
    treeSubSystems.Columns.Add("Имя");
    if (!md){
        return;
    }

        try{
            if(md.rootObject.childObjectsCount("Подсистемы") > 0)
                var newRow = treeSubSystems.Rows.Add();
                newRow.Имя = "Подсистемы";
                var mdObj = md.rootObject;
                for(var i = 0, c = mdObj.childObjectsCount("Подсистемы"); i < c; i++){
                    mdSubs = mdObj.childObject("Подсистемы", i);
                    parseSubSystems(mdSubs, newRow);
                }
                
        }catch(e){
           Message("Не удалось распарсить подсистемы"+e.description);
        }
        //return tree;
}

SelectValueDialogMdNavigator = SelectValueDialog.extend({
    //Меняем картинку у кнопки SortByName и в дальнейшем в логике учитываем ее как recursiveSubsystems
    construct : function (caption, values, pic) {
        this._super(caption, values);
        if (pic == undefined) pic = null
        this.pic = pic; //Сюда передаем картинку. 
    },

    selectValue: function (values, currentFilter) {
        if (!this.pic){

        } else {
            try{
                this.form.Controls.CmdBar.Buttons.SortByName.Picture = this.pic;    
            } catch (e) {}
        }
        var currSearch = this.form.DoNotFilter;
        this.form.DoNotFilter = true;
        this.updateList(currentFilter);
        this.form.DoNotFilter = currSearch;
        this.form.Controls.CmdBar.Buttons.SortByName.ToolTip = "Рекурсивно обходить все вложенные подсистемы";
        this._super(values);
    },

    sortValuesList: function (sortByName, vt) {
        if (!vt) {
            vt = this.form.ValuesList;
        }
        vt.Sort('Order');
    }

})




SelfScript.self['macrosНастройка фильтра для подсистем'] = function(){
    var values = v8New('СписокЗначений');
    values.Add(1, 'Отбирать состав только текущей подсистемы');
    values.Add(2, 'Рекурсивно обходить дерево подсистем');
    var dlg = new SelectValueDialog("Выберете вариант фильтра по подсистеме!", values);
    if (dlg.selectValue()) {
        settings.current.recursiveSubsystems = (dlg.selectedValue==2)?true:false;
        recursiveSubsystems = settings.current.recursiveSubsystems;
        settings.SaveSettings();                        
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

settings = SettingsManagement.CreateManager('mdNavigator', { 'listOfFilters': v8New('ValueList'), 
                                        'recursiveSubsystems':false}, pflBase);
settings.LoadSettings();
listOfFilters = settings.current.listOfFilters;
recursiveSubsystems = settings.current.recursiveSubsystems;
function beforeExitApp(){
    settings.current.listOfFilters = listOfFilters;
    settings.current.recursiveSubsystems = recursiveSubsystems;

    settings.SaveSettings();
}

events.connect(Designer, "beforeExitApp", SelfScript.self);