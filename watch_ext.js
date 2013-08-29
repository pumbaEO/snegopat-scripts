$engine JScript
$uname watch_ext
$dname Расширенное табло
$addin stdcommands
$addin stdlib
$addin global

stdlib.require('SyntaxAnalysis.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);
stdlib.require('SettingsManagement.js', SelfScript);

stdlib.require('log4js.js', SelfScript);

global.connectGlobals(SelfScript);


var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
logger.addAppender(appender);
logger.setLevel(Log4js.Level.ERROR);
var loggerInfo = Log4js.getLogger(SelfScript.uniqueName+"info");
loggerInfo.addAppender(appender);
loggerInfo.setLevel(Log4js.Level.INFO);



events.connect(v8debug, "onDebugEvent", SelfScript.Self)
stdcommands.CDebug.Break.addHandler(SelfScript.self, "onStopDebug")

var form = loadScriptForm(SelfScript.fullPath.replace(/js$/i, "ssf"), SelfScript.self)
form.КлючСохраненияПоложенияОкна = "watch_ext"
form.ПеременныеОтладки.Колонки.Добавить("Modified")
var rModule = form.ПеременныеОтладки.Строки.Добавить();
rModule.Название = "Переменные модуля";
var rParams = form.ПеременныеОтладки.Строки.Добавить();
rParams.Название = "Параметры метода";
var rLocal = form.ПеременныеОтладки.Строки.Добавить();
rLocal.Название = "Локальные переменные";
var rHands = form.ПеременныеОтладки.Строки.Добавить();
rHands.Название = "Табло";
getRow(rHands, '');
var colorRed = v8new("Цвет", 255, 0, 0), colorGray = v8new("Цвет", 200, 200, 200)
var curViewHwnd = "";
var curSyntaxAnalysis = null;
var needTestModified = false;
var timerExpressionUpdater = null;
var valueBrkptCond = "";

SelfScript.self['macrosОткрыть окно отладки'] = function()
{
	
    form.Open() // Покажем окно
}

SelfScript.self['macrosПереключитьавтообновление'] = function()
{
    logger.debug(this.name);
    if (!timerExpressionUpdater){
        logger.debug("timerExpressionUpdater: "+timerExpressionUpdater);
    }
    else {

        timerExpressionUpdater.stop = !timerExpressionUpdater.stop;
        //Message("Теперь автообновление "+timerExpressionUpdater.stop?"остановленно" : "включено");
        loggerInfo.info("timerExpressionUpdater.stop is "+timerExpressionUpdater.stop);
    }
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Переключитьавтообновление';
}

function setTimeForUpdateExpression(timeout) {

    logger.debug(this.name);
    if (!timerExpressionUpdater){
    } else {
        if ((timerExpressionUpdater.timeout + timeout) < 0 ) {
            Message("Время ниже нуля нельзя. "+(timerExpressionUpdater.timeout + timeout));
            return;
        }
        timerExpressionUpdater.timeout = timerExpressionUpdater.timeout + timeout;
    }

    logger.debug(timerExpressionUpdater.timeout);

}

function hookBrkptCond(dlgInfo)
{
    if(dlgInfo.stage == openModalWnd)
    {
        dlgInfo.form.getControl("Condition").value = valueBrkptCond;

        dlgInfo.cancel = false;
        dlgInfo.result = mbaOk;
    }
}

function hookBrkptCondAuto(dlgInfo)
{
    if(dlgInfo.stage == openModalWnd)
    {
        dlgInfo.form.getControl("Condition").value = valueBrkptCond;

        dlgInfo.cancel = true   // Отменяем показ диалога
        dlgInfo.result = 1      // как будто в нем нажали Ок
    }
}



SelfScript.self['macrosУстановить точку останова по условию'] = function(){
    if (!form.ЭлементыФормы.ПеременныеОтладки.ТекущаяСтрока) {
        logger.error("Не определенна текущая строка для выражения");
        return;
    }
    
    events.connect(windows, "onDoModal", SelfScript.self, "hookBrkptCond");
    var state = stdcommands.CDebug.BrkptCond.getState();
    var curRow = form.ЭлементыФормы.ПеременныеОтладки.ТекущаяСтрока;
    var curValue = ''+curRow.Значение;
    var name = fullName(curRow);
    valueBrkptCond = ""+ name + " = "+curValue;
    stdcommands.CDebug.BrkptCond.send();
    events.disconnect(windows, "onDoModal", SelfScript.self, "hookBrkptCond");
    
}

SelfScript.self['macrosУстановить точку останова по условию для выделенных строк'] = function(){
    if (!form.ЭлементыФормы.ПеременныеОтладки.ТекущаяСтрока) {
        logger.error("Не определенна текущая строка для выражения");
        return;
    }

    var wnd = GetTextWindow();
    if(!wnd)
        return;
    view = wnd.GetView();

    var curRow = form.ЭлементыФормы.ПеременныеОтладки.ТекущаяСтрока;
    var curValue = ''+curRow.Значение;
    var name = fullName(curRow);
    valueBrkptCond = ""+ name + " = "+curValue;

    var vbs = addins.byUniqueName("vbs").object
    vbs.var0 = valueBrkptCond; vbs.var1 = "Введите выражение"; vbs.var2 = 0, vbs.var3 = false;
    if (vbs.DoEval("InputString(var0, var1, var2, var3)")) {
            valueBrkptCond  = vbs.var0;
    }
    if (valueBrkptCond.length = 0)
        return;

    events.connect(windows, "onDoModal", SelfScript.self, "hookBrkptCondAuto");
    var state = stdcommands.CDebug.BrkptCond.getState();

    sel = wnd.GetSelection();
    for (var i = sel.beginRow; i<sel.endRow; i++){
        stdcommands.CDebug.BrkptCond.send();
        wnd.SetCaretPos(i, sel.beginCol);
    }
    
    events.disconnect(windows, "onDoModal", SelfScript.self, "hookBrkptCondAuto");
    valueBrkptCond = "";
    loggerInfo.info("Точки останова установленны!");
    
}


SelfScript.self['macrosУвеличить период обновления на 1 сек. '] = function() {
    setTimeForUpdateExpression(1000);
}

SelfScript.self['macrosУменьшить период обновления на 1 сек. '] = function() {
    setTimeForUpdateExpression(-1000);
}

//TODO: Добавить вычисление выражения. 
function onDebugEvent(eventID, eventParam)
{
    logger.debug(this.name);
    logger.debug(eventID);
    if (!timerExpressionUpdater){
        logger.debug("timerExpressionUpdater не определен "+timerExpressionUpdater)
        timerExpressionUpdater = GetTimerExpressionUpdater();
    }
    //Message("SCRIPT " + eventID + ", " + eventParam);
    if(eventID == "{FE7C6DDD-7C99-42F8-BA14-CDD30EDF2EF1}")
    {
        var view = windows.getActiveView()
        form.Open() // Покажем окно
        if(view)
            view.activate()
    }
    else if(eventID == "{71501A9D-CD34-427D-81B6-562491BEF945}")
    {
        clearExpressions();
        timerExpressionUpdater.stopWatch();
    }
    if(eventID == "{5B5F928D-DF2D-4804-B2D0-B453163A2C4C}")
    {
        //Message("eventParam " + eventParam);
        if(eventParam == 37 || eventParam == 24 )    // Остановились в точке останова
        {
            //Message("SCRIPT Остановились в точке останова")
            needTestModified = true
            fillLocalVariables()    // Заполним локальные переменные
            //events.connect(Designer, "onIdle", SelfScript.self) // Будем их обновлять
            timerExpressionUpdater.updateTimer();
        }
    }
}


function isDebugEvalEnabled()
{
    // Команда "Шагнуть в" неактивна - значит, мы не в останове. Считать переменные нельзя, возможен вылет
    var state = stdcommands.CDebug.StepIn.getState()
    return state && state.enabled
}

function onStopDebug()
{
    clearExpressions()
}

function onIdle()
{
    if(!isDebugEvalEnabled())
    {
        events.disconnect(Designer, "onIdle", SelfScript.self)
        return
    }
    try{
        updateDebugExpressions()
    }catch(e)
    {
        // Все ошибки будем гасить
    }
    events.disconnect(Designer, "onIdle", SelfScript.self)
}

function clearExpressions()
{
    rModule.Строки.Очистить()
    rParams.Строки.Очистить()
    rLocal.Строки.Очистить()
    if(form.Открыта())
        form.Закрыть()
}

function getRow(parent, name)
{
    var r = parent.Строки.Найти(name, "Название")
    if(!r)
    {
        r = parent.Строки.Добавить()
        r.Название = name
        r.Modified = 0
    }
    return r
}

function removeRows(parent, all)
{
    var del = []
    for(var k = new Enumerator(parent.Строки); !k.atEnd(); k.moveNext())
    {
        var r = k.item()
        if(!all[r.Название])
            del.push(r)
    }
    for(var k in del)
        parent.Строки.Удалить(del[k])
}

function fillLocalVariables()
{
    var wnd = GetTextWindow();
    if(!wnd)
        return
    view = wnd.GetView();
    title = "";
    if (!view){
    } else {
        if (view.mdObj && view.mdProp) {
            
            function getMdName(mdObj) {                             
                if (mdObj.parent && mdObj.parent.mdClass.name(1) != 'Конфигурация')
                    return getMdName(mdObj.parent) + '.' + mdObj.mdClass.name(1) + ' ' + mdObj.name;
                var cname = mdObj.mdClass.name(1);
                return  (cname ? cname + ' ' : '') + mdObj.name;
            }
            title = getMdName(view.mdObj) + ': ' + view.mdProp.name(1);
            
            if (wnd.GetHwnd() != curViewHwnd)
                curSyntaxAnalysis = null;
                curMdObject = wnd.GetHwnd();
        }
    }
    
    if (!curSyntaxAnalysis || !view){
        var mod = SyntaxAnalysis.AnalyseTextDocument(wnd);
        curSyntaxAnalysis = mod;
    } else {
        var mod = curSyntaxAnalysis;
    }
    
    var meth = mod.getActiveLineMethod()
    rModule.Значение = title;
    //debugger
    // Заполним переменные модуля
    var all = {}
    for(var k in mod.context.ModuleVars)
    {
        getRow(rModule, mod.context.ModuleVars[k])
        all[mod.context.ModuleVars[k]] = true
    }
    removeRows(rModule, all)
    if (!meth){
        rParams.Значение = "<Вне процедуры/функции>"
    } else {
        // Заполним параметры
        rParams.Значение = meth.Name;
        if(!meth.Params){

        }else{
            var all = {}
            for(var k in meth.Params)
            {
                getRow(rParams, meth.Params[k])
                all[meth.Params[k]] = true
            }
            removeRows(rParams, all)
        }
        // Заполним локальные переменные
        var all = {}
        for(var k in meth.DeclaredVars)
        {
            getRow(rLocal, meth.DeclaredVars[k])
            all[meth.DeclaredVars[k]] = true
        }
        for(var k in meth.AutomaticVars)
        {
            getRow(rLocal, meth.AutomaticVars[k])
            all[meth.AutomaticVars[k]] = true
        }
    }
    
    removeRows(rLocal, all)
    form.ЭлементыФормы.ПеременныеОтладки.Развернуть(rModule, false)
    form.ЭлементыФормы.ПеременныеОтладки.Развернуть(rParams, false)
    form.ЭлементыФормы.ПеременныеОтладки.Развернуть(rLocal, false)
    form.ЭлементыФормы.ПеременныеОтладки.Развернуть(rHands, false);
}

function setRowValue(row, value, type)
{
    if(needTestModified)
    {
        if(row.Modified == 0)   // Строка только что добавилась
            row.Modified = 1    // В следующий раз проверять строку на изменение
        else
            row.Modified = row.Значение !== value ? 2 : 1
    }
    row.Значение = value
    row.Тип = type
}

function updateOneExpression(row, parentName)
{
    // Рассчитаем отладочное значение в строке
    if (row.Название.length<1){
        setRowValue(row, '', '');
        return;
    }
    var expr = v8debug.eval(parentName + row.Название)
    // Установим значение и модифицированность
    setRowValue(row, expr.value, expr.type)
    // Переберем свойства вычисленного выражения
    var all = {}
    for(var k = 0; k < expr.propCount; k++)
    {
        var prop = expr.prop(k)
        var r = getRow(row, prop.name)
        all[prop.name] = true
        setRowValue(r, prop.value, prop.type)
        
        if(prop.expandable)
        {
            // Свойство имеет подсвойства, надо показывать плюсик
            if(!r.Строки.Количество()) // Для этого при необходимости добавим пустую строку
                r.Строки.Добавить().Название = "-"
                
            // Если свойство само развернуто, его надо тоже обновить
            if(form.ЭлементыФормы.ПеременныеОтладки.Развернут(r))
                updateOneExpression(r, parentName + row.Название + ".")
        }
        else
        {
            // Не разворачиваемое свойство, на всякий случай удалим подчиненные строки
            r.Строки.Очистить()
        }
    }
    removeRows(row, all)
}

function updateRows(parent)
{
    for(var rows = new Enumerator(parent.Строки); !rows.atEnd(); rows.moveNext())
        updateOneExpression(rows.item(), "")
}

function updateDebugExpressions()
{
    if(!form.Открыта())
        return
    //debugger
    updateRows(rModule)
    updateRows(rParams)
    updateRows(rLocal)
    updateRows(rHands);
    needTestModified = false
}

function fullName(row)
{
    logger.debug(this.name + " уровень "+row.Уровень());
    var t = row.Название
    if (row.Уровень() > 1){
        t = fullName(row.Родитель) +"."+t;
    }
    logger.debug(""+t);
    return t
}

function ПеременныеОтладкиВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка)
{
    //Message('ПеременныеОтладкиВыбор');
    var value = ВыбраннаяСтрока.val.Значение
    if(value.indexOf('\n') >= 0)
    {
        Message("Значение '" + fullName(ВыбраннаяСтрока.val) + "':", mInfo)
        Message(value)
    }
}

function ПеременныеОтладкиПриВыводеСтроки(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
    if(ДанныеСтроки.val.Уровень() == 0)
        ОформлениеСтроки.val.ЦветФона = colorGray
    else
    {
        if(ДанныеСтроки.val.Modified == 2)
            ОформлениеСтроки.val.ЦветТекста = colorRed
        // Для строк с переносом строки покажем картинку, что на нее можно щелкнуть
        if(ДанныеСтроки.val.Значение.indexOf('\n') >= 0)
        {
            var cell = ОформлениеСтроки.val.Ячейки.Значение
            cell.ОтображатьКартинку = true
            cell.ИндексКартинки = 0
        }
    }
}

function ПеременныеОтладкиПередРазворачиванием(Элемент, Строка, Отказ)
{
    if(isDebugEvalEnabled())    // Если возможно вычисление отладочных выражений
    {
        var row = Строка.val
        if(row.Уровень() > 0)   // Это не строка с именем раздела
        {
            if(row.Строки.Количество() == 1 && row.Строки.Получить(0).Название == "-")
            {
                // Разворачиваем первый раз
                updateOneExpression(row, fullName(row.Родитель) + ".")
            }
        }
    }
}

function ПеременныеОтладкиПередНачаломДобавления(Элемент, Отказ, Копирование, Родитель){

    Message(Родитель.Наименование);
    if (!Родитель){
        Отказ = true;
        return;
    }
    
    //if (Родитель.Уровень() > 0){
    //    Отказ = true;
    //    return;
    //}
    
    if (Родитель.Наименование != rHands.Наименование){
        Отказ = true;
        return;
    }
    
}

function ПеременныеОтладкиНазваниеПриИзменении(Элемент) {

    updateOneExpression(form.ЭлементыФормы.ПеременныеОтладки.ТекущаяСтрока, "");
    
}


function GetTimerExpressionUpdater(){
    ////////////////////////////////////////////////////////////////////////////////////////
////{ TimerExpressionUpdater - переодически обновляем значения переменных
////

TimerExpressionUpdater = stdlib.Class.extend({

    construct : function() {
        this.timerId = 0;
        this.stop = false;
        this.timeout = 100;
        //this.startWatch();
    },

    updateTimer: function(){
        logger.debug(this.name);
        this.stopWatch();
        this.startWatch()
    },

    startWatch : function () {
        logger.debug(this.name + " "+ this.constructor.name);

        if (this.timerId)
            this.stopWatch();
        
        if (this.stop){
            logger.debug("Таймер отключен "+this.stop);
            return;
        }

        this.timerId = createTimer(this.timeout, this, 'onTimer');
    },

    stopWatch : function () {
        if (!this.timerId)
            return;
        killTimer(this.timerId);
        this.timerId = 0;
    },

    onTimer : function (timerId) {
        
        this.stopWatch();
        if(!isDebugEvalEnabled()){
            return;
        }

        if(!form.Открыта()){
            this.stopWatch();
            return
        }
        try {
        updateRows(rModule)
        updateRows(rParams)
        updateRows(rLocal)
        updateRows(rHands);
        
        } catch (e) {
             // Все ошибки будем гасить
        }
    }
    
}); // end of TimerExpressionUpdater class

    return new TimerExpressionUpdater();
}

