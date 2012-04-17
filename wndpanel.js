$engine JScript
$uname wndpanel
$dname Панель окон
$addin vbs
$addin global
$addin stdlib
$addin stdcommands

// (c) Александр Орефков
// Скрипт для показа "панели окон".
// В отличии от штатной панели окон показывает список окон в табличном поле, сортируя
// их не в порядке открытия окон, а по объектам метаданных, к которым они относятся +
// по алфавиту. Также как всегда поддерживается фильтрация списка по подстроке.

global.connectGlobals(SelfScript)

var form
var listOfViews
var clrActive = ЗначениеИзСтрокиВнутр('{"#",9cd510c7-abfc-11d4-9434-004095e12fc7,2,\n{3,1,\n{2}\n}\n}')
var needActivate, needHide
var boldFont

function getFullMDName(mdObj, mdProp)
{
    var names = []
    while(true)
    {
        names.unshift(mdObj.name)
        var className = mdObj.mdclass.name(1)
        if(!mdObj.parent)
            className = ""
        names.unshift(className)
        if(!className.length)
            break
        mdObj = mdObj.parent
    }
    return names.join('.') + "#" + (mdProp ? mdProp.name(1) : "")
}

WndListItem = stdlib.Class.extend(
{
    construct: function(view)
    {
        this.view = view
        this.rowInVt = null
        this.color = 0
        this.makeSortKey()
    },
    isAlive: function()
    {
        try{
            if(this.view.hwnd && this.view.position().state == vsMDI)
                return true
        }catch(e){}
        return false
    },
    makeTitle: function()
    {
        var result = {title : '', info: ''}
        if(this.isAlive())
        {
            result.title = this.view.title
            var mdObj = this.view.mdObj
            if(mdObj)
            {
                var mdname = mdObj.container.identifier
                if(result.title.indexOf(mdname) < 0)
                    result.info += mdname + " "
            }
            var obj = this.view.getObject()
            if(obj)
                result.info += toV8Value(obj).typeName(1) + " "
        }
        return result
    },
    makeSortKey : function()
    {
        // Основной алгоритм упорядочивания окон
        var md = this.view.mdObj
        if(md)
        {
            // Если окно относится к объекту метаданных. Сначала пусть идут окна
            // основной конфигурации, далее конфигурации ИБ, затем внешние отчеты/обработки и cf-ники.
            // При закрытой основной конфигурации metadata.current равно metadata.ib, поэтому сначала
            // проверяем на metadata.ib
            if(md.container == metadata.ib)
                this.sortkey = "2#"
            else if(md.container == metadata.current)
                this.sortkey = "1#"
            else
                this.sortkey = "3#" + md.container.identifier + "#"
            this.sortkey += getFullMDName(md, this.view.mdProp)
        }
        else    // Дальше пусть идут всякие файлы по алфавиту
            this.sortkey = "4#" + this.view.title
        this.sortkey = this.sortkey.toLowerCase()
    }
})

WndList = stdlib.Class.extend({
    construct: function()
    {
        this.list = []  // Массив - список окон
        this.find = {}  // Для поиска окна по его id
        this.lastFilter = ''
        this.activeView = null
    },
    // Функция для удаления устаревших, закрытых окон из нашего списка
    removeOldViews: function(vt)
    {
        var removed = false
        for(var i = this.list.length; i--;)
        {
            var item = this.list[i]
            if(!item.isAlive())
            {
                if(item.rowInVt)
                    vt.Delete(item.rowInVt)
                delete this.find[item.view.id]
                this.list.splice(i, 1)
                removed = true
            }
        }
        return removed
    },
    // Функция для добавления новых окон в список.
    // Перебирает все MDI-окна, и те, которых нет в списке, добавляет туда
    // Также определяет активное окно
    addNewViews: function()
    {
        var views = []      // Массив всех конечных отображений
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
            if(!this.find.hasOwnProperty(v.id))
            {
                var item = new WndListItem(v)
                this.list.push(item)
                this.find[v.id] = item
                added = true
            }
        }
        if(added)   // Что-то добавилось, отсортируем список
            this.list.sort(function(i1, i2){return i1.sortkey.localeCompare(i2.sortkey)})
        var activeView = null
        if(childs.count > 0)
        {
            activeView = childs.item(0)
            while(activeView.activeChild)
                activeView = activeView.activeChild
            activeView = this.find[activeView.id]
        }
        return {added: added, activeView: activeView}
    },
    filterList: function(filterString, vtControl)
    {
        vt = vtControl.Value
        var needUpdateColors = this.removeOldViews(vt)
        filterString = filterString.toLowerCase()
        var addedResults = this.addNewViews()
        if(addedResults.added || filterString != this.lastFilter)
        {
            needUpdateColors = true            
            this.lastFilter = filterString
            var filters = filterString.split(/\s+/)
            var idxInVt = 0
            for(var vidx in this.list)
            {
                var item = this.list[vidx]
                var needAdd = true
                var title = item.makeTitle().title.toLowerCase()
                for(var idx in filters)
                {
                    if(title.indexOf(filters[idx]) < 0)
                    {
                        needAdd = false
                        break
                    }
                }
                if(needAdd)
                {
                    if(!item.rowInVt)
                    {
                        item.rowInVt = vt.Insert(idxInVt)
                        item.rowInVt.Окно = item
                    }
                    idxInVt++
                }
                else if(item.rowInVt)
                {
                    vt.Delete(item.rowInVt)
                    item.rowInVt = null
                }
            }
        }
        if(needUpdateColors && vt.Count())
        {
            //debugger
            var prevItem = vt.Get(0).Окно
            prevItem.color = 0
            for(var k = 1; k < vt.Count(); k++)
            {
                var item = vt.Get(k).Окно
                item.color = (prevItem.color + 1) % 2
                var mdObj = item.view.mdObj
                var prevMdObj = prevItem.view.mdObj
                if(mdObj && prevMdObj)
                {
                    // Текущая строка - метаданные, и предыдущая строка - метаданные.
                    // Если они относятся к одному объекту, то цвет должен совпадать.
                    if(mdObj.container == prevMdObj.container)  // Находятся в одном контейнере
                    {
                        // Если это - внешняя обработка или принадлежат одному объекту первого уровня
                        if(mdObj.container.masterContainer != mdObj.container || find1LevelMdObj(mdObj) == find1LevelMdObj(prevMdObj))
                            item.color = prevItem.color
                    }
                }
                prevItem = item
            }
        }
        // Теперь отследим активное окно
        oldActiveView = this.activeView
        if(addedResults.activeView != oldActiveView)
        {
            this.activeView = addedResults.activeView
            if(oldActiveView && oldActiveView.rowInVt)
                vtControl.RefreshRows(oldActiveView.rowInVt)
            if(addedResults.activeView && addedResults.activeView.rowInVt)
            {
                vtControl.RefreshRows(addedResults.activeView.rowInVt)
                vtControl.ТекущаяСтрока = addedResults.activeView.rowInVt
            }
        }
    }
})

function macrosПоказать()
{
    form.Открыть()
    form.CurrentControl = form.Controls.Filter
}

function updateWndList()
{
    // Получим текущий текст из поля ввода
    vbs.var0 = form.Controls.Filter
    vbs.DoExecute("var0.GetTextSelectionBounds var1, var2, var3, var4")
    form.Controls.Filter.УстановитьГраницыВыделения(1, 1, 1, 10000)
    var newText = form.Controls.Filter.ВыделенныйТекст.replace(/^\s*|\s*$/g, '')
    form.Controls.Filter.УстановитьГраницыВыделения(vbs.var1, vbs.var2, vbs.var3, vbs.var4)
    listOfViews.filterList(newText, form.Controls.WndList)
}

function onIdle()
{
    //debugger
    updateWndList()
    if(needHide)
    {
        needHide = false
        // Теперь спрячем наше окно.
        // Для прячущегося окна нельзя делать form.Close, т.к. тогда оно пропадет совсем, не оставив кнопки на панели
        if(form.СостояниеОкна != ВариантСостоянияОкна.Прячущееся)
            form.Close()
    }
    if(needActivate)
    {
        try{
            needActivate.activate()
        }catch(e){}
        needActivate = null
    }
}

function WndListВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
    needActivate = ВыбраннаяСтрока.val.Окно.view
}

function WndListПриВыводеСтроки(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
    var cell = ОформлениеСтроки.val.Ячейки.Окно
    var item = ДанныеСтроки.val.Окно
    try{cell.УстановитьКартинку(item.view.icon)}catch(e){}
    var title = item.makeTitle()
    cell.УстановитьТекст(title.title)
    if(item == listOfViews.activeView)
    {
        if(!boldFont)
            boldFont = v8New("Шрифт", cell.Шрифт, undefined, undefined, true)
        cell.Шрифт = boldFont
    }
    ОформлениеСтроки.val.ЦветФона = item.color ?  Элемент.val.ЦветФонаЧередованияСтрок : Элемент.val.ЦветФонаПоля
    ОформлениеСтроки.val.Ячейки.Инфо.УстановитьТекст(title.info)
}

function FilterРегулирование(Элемент, Направление, СтандартнаяОбработка)
{
    var curRow = form.Controls.WndList.ТекущаяСтрока
    if(!curRow)
    {
        if(form.WndList.Количество())
            form.Controls.WndList.ТекущаяСтрока = form.WndList.Получить(-1 == Направление.val ? 0 : form.WndList.Количество() - 1)
        return
    }
    var curRowIdx = form.WndList.Индекс(curRow), newRowIdx = curRowIdx
    
    if(-1 == Направление.val)
    {
        if(curRowIdx != form.WndList.Количество() - 1)
            newRowIdx++
    }
    else
    {
        if(curRowIdx > 0)
            newRowIdx--
    }
    if(newRowIdx != curRowIdx)
        form.Controls.WndList.ТекущаяСтрока = form.WndList.Получить(newRowIdx)
    СтандартнаяОбработка.val = false
}

function ПриОткрытии()
{
    updateWndList()
    events.connect(Designer, "onIdle", SelfScript.self)
}
function ПриЗакрытии()
{
    events.disconnect(Designer, "onIdle", SelfScript.self)
}

function find1LevelMdObj(mdObj)
{
    if(mdObj.mdclass.name(1).length)
    {
        while(mdObj.parent && mdObj.parent.parent)
            mdObj = mdObj.parent
    }
    return mdObj
}

function CmdsActivate(Кнопка)
{
    if(form.Controls.WndList.ТекущаяСтрока)    
        needActivate = form.Controls.WndList.ТекущаяСтрока.Окно.view
}

function CmdsClose(Кнопка)
{
    if(form.Controls.WndList.ТекущаяСтрока)
        form.Controls.WndList.ТекущаяСтрока.Окно.view.close()
}

function CmdsSave(Кнопка)
{
    if(form.Controls.WndList.ТекущаяСтрока)
    {
        stdcommands.Frame.FileSave.sendToView(form.Controls.WndList.ТекущаяСтрока.Окно.view)
        form.Controls.WndList.ОбновитьСтроки(form.Controls.WndList.ТекущаяСтрока)
    }
}

function CmdsFindInTree(Кнопка)
{
    if(form.Controls.WndList.ТекущаяСтрока)
    {
        var view = form.Controls.WndList.ТекущаяСтрока.Окно.view
        if(view.mdObj)
            view.mdObj.activateInTree()
    }
}

function CmdsMinimizeAll(Кнопка)
{
    var views = windows.mdiView.enumChilds()
    for(var k = 0; k < views.count; k++)
        views.item(k).sendCommand("{c9d3c390-1eb4-11d5-bf52-0050bae2bc79}", 6)
}

function CmdsPrint(Кнопка)
{
    if(form.Controls.WndList.ТекущаяСтрока)
        stdcommands.Frame.Print.sendToView(form.Controls.WndList.ТекущаяСтрока.Окно.view)
}

function InvisiblePanelSelectAndHide(Кнопка)
{
    if(form.Controls.WndList.ТекущаяСтрока)
    {
        needActivate = form.Controls.WndList.ТекущаяСтрока.Окно.view
        needHide = true
    }
}

// Инициализация скрипта
listOfViews = new WndList
form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
form.КлючСохраненияПоложенияОкна = "wndpanel"
form.WndList.Columns.Окно.ТипЗначения = v8New("ОписаниеТипов")
form.Controls.Cmds.Кнопки.Activate.СочетаниеКлавиш = ЗначениеИзСтрокиВнутр('{"#",69cf4251-8759-11d5-bf7e-0050bae2bc79,1,\n{0,13,0}\n}')
form.Controls.InvisiblePanel.Кнопки.SelectAndHide.СочетаниеКлавиш = ЗначениеИзСтрокиВнутр('{"#",69cf4251-8759-11d5-bf7e-0050bae2bc79,1,\n{0,13,8}\n}')
