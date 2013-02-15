$engine JScript
$uname type_finder
$dname Быстрый поиск типа
$addin global
$addin stdlib
$addin stdcommands

// (c) Александр Орефков
// Скрипт, облегчающий работу в диалоге выбора типа

global.connectGlobals(SelfScript)
wapi = stdlib.require("winapi.js");
events.connect(windows, "onDoModal", SelfScript.self)

stdlib.require("TextChangesWatcher.js", SelfScript);

var form

function initForm()
{
    // Загрузим и настроим форму
    form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
    form.КлючСохраненияПоложенияОкна = SelfScript.uniqueName
    form.Types.Columns.Type.ТипЗначения = v8New("ОписаниеТипов")
    var hk = [
    ["ShowStd", 13, 4],
    ]
    for(var k in hk)
        form.Controls.Cmds.Кнопки.Найти(hk[k][0]).СочетаниеКлавиш = stdlib.v8hotkey(hk[k][1], hk[k][2])
}

function CmdsOk(Кнопка)
{
}

function CmdsShowStd(Кнопка)
{
    MessageBox("hhh")
    form.Закрыть()
}

function PatternРегулирование(Элемент, Направление, СтандартнаяОбработка)
{
}

function PatternОкончаниеВводаТекста(Элемент, Текст, Значение, СтандартнаяОбработка)
{
}

function TypesВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
}

function TypesПриВыводеСтроки(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
}

function PatternНачалоВыбора(Элемент, СтандартнаяОбработка)
{
}

initForm()
form.ОткрытьМодально()
form = null

var typeTreeCtrl, multyTypeCtrl, allTypes, quickSel

// Здесь мы будем отлавливать открытие и закрытие модального диалога
// редактирования типа.
function onDoModal(dlgInfo)
{
    // Привязываться к заголовку диалога не очень хорошо, он может быть другим
    // в другой локализации. А такой состав контролов говорит о том, что открылся
    // диалог выбора типа.
    try{
        var tt = dlgInfo.form.getControl('TypeTree')
        var mt = dlgInfo.form.getControl('CheckDomainEnable')
    }catch(e){ return }
    switch(dlgInfo.stage){
    case afterInitial:
        typeTreeCtrl = tt
        multyTypeCtrl = mt
        if(!multyTypeCtrl.value && MessageBox("Быстро выбрать один тип?", mbYesNo | mbIconQuestion | mbDefButton1) == mbaYes)
            quickSel = macrosНайтиТип()
        break
    case openModalWnd:
        if(quickSel)
            new ActiveXObject("WScript.Shell").SendKeys('^~')
        break;
    case afterDoModal:
        // Тут диалог уже закрывается, обнулим данные
        typeTreeCtrl = null
        multyTypeCtrl = null
        allTypes = null
        quickSel = false
        break
    }
}

function macrosПереключитьСоставныеТипы()
{
    if(!multyTypeCtrl)
        return false
    multyTypeCtrl.value = !multyTypeCtrl.value
}

function macrosНайтиТип()
{
    if(typeTreeCtrl)
    {
        /*
        Message(typeTreeCtrl.extInterface.columnCount)
        Message(typeTreeCtrl.extInterface.currentCol)
        var r = typeTreeCtrl.extInterface.currentRow
        Message(r.getCellAppearance(0).text);
        Message(typeTreeCtrl.extInterface.isExpanded(r))
        typeTreeCtrl.extInterface.expand(r, true, true);
        return
        */
        var grid = typeTreeCtrl.extInterface

        if(!allTypes)
        {
            allTypes = v8New("СписокЗначений");
            (function walkLines(parent, prefix)
            {
                var row = parent.firstChild
                while(row)
                {
                    var ca = row.getCellAppearance(0)
                    if(row.firstChild)
                        walkLines(row, ca.text + ".")
                    else
                        allTypes.Add(row, prefix + ca.text, false, ca.picture)
                    row = row.next
                }
            })(grid.dataSource.root, '')
        }
        var dlg = new SelectValueDialog("Выберите тип!", allTypes);
        if(dlg.selectValue())
        {
            var row = dlg.selectedValue
            if(!multyTypeCtrl.value)    // Не составной тип данных. Надо сбросить пометку у другого элемента
            {
                (function findAndRemoveCheck(parent)
                {
                    var row = parent.firstChild
                    while(row)
                    {
                        if(grid.isCellChecked(row, 0))
                        {
                            grid.checkCell(row, 0, 0)
                            return true
                        }
                        if(findAndRemoveCheck(row))
                            return true
                        row = row.next
                    }
                    return false
                })(grid.dataSource.root)
            }
            grid.currentRow = row
            grid.checkCell(row, 0, 1)
            wapi.SetFocus(typeTreeCtrl.hwnd)
            return true
        }
    }
    return false
}

