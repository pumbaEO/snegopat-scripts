$engine JScript
$uname funcprocpanel
$dname Панель функ/проц с группировкой по контексту компиляции
$addin vbs
$addin global
$addin stdlib
$addin stdcommands

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// Скрипт для показа "списка процедур".
// В отличии от штатной панели окон показывает список процедур/функций в табличном поле, 
// сортируя в контексте выполенения процедур НаКлиенте/НаСервере

stdlib.require('SyntaxAnalysis.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);
stdlib.require('SettingsManagement.js', SelfScript);


global.connectGlobals(SelfScript)

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosОткрыть окно'] = function() {
    GetFuncProcPanel().Show();
}
/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Открыть окно';
}

////} Макросы


function FuncProcPanel() {
    
    FuncProcPanel._instance = this;
    
    this.form = loadScriptForm("scripts\\FuncProcPanel.ssf", this);
    this.form.КлючСохраненияПоложенияОкна = "FuncProcPanel.js"
    this.results = this.form.FunctionList;
    this.results.Columns.Add('_method');
    //Таблица, на основании которой будет делать или дерево или просто список... 
    this.methods = this.results.Copy();
    
    this.watcher = new TextWindowsWatcher();
    this.watcher.startWatch();
    
    this.isForm = false;
    this.defaultSettings = {
        'TreeView'      : false // Группировать результаты поиска по контекстам.
    };
    //this.tc = new TextChangesWatcher(this.form.ЭлементыФормы.ТекстФильтра, 3, this.viewFunctionList);
    
    this.settings = SettingsManagement.CreateManager(SelfScript.uniqueName, this.defaultSettings);
    this.settings.LoadSettings();
    this.settings.ApplyToForm(this.form);
    
    this.targetWindow = null;
    
    this.lastFilter = '';
    
    this.groupsCache = v8New("Map");
    
    this.Icons = {
        'Func': this.form.Controls.PicFunc.Picture,
        'Proc': this.form.Controls.PicProc.Picture
    }
}

FuncProcPanel.prototype.Show = function () {
    
    this.form.Open();
    //this.tc.start();
    //this.tc.stop();
    
}

FuncProcPanel.prototype.Close = function () {
    if (this.form.IsOpen())
    {
        this.form.Close();
        return true;
    }
    return false;
}

FuncProcPanel.prototype.IsOpen = function () {
    return this.form.IsOpen();
}

FuncProcPanel.prototype.GetList = function () {
            
    this.methods.Rows.Clear();
    this.targetWindow = this.watcher.getActiveTextWindow();
    
    // Проверим, что это Форма.
    // Свойство mdProp показывает, к какому свойству объекта метаданных относится окно
    //debugger
    this.isForm = (this.targetWindow.textWindow.mdProp.name(1) == "Форма")

    cnt = SyntaxAnalysis.AnalyseTextDocument(this.targetWindow);
    vtModules = cnt.getMethodsTable();
    for (var i = 0; i<vtModules.Count(); i++) {
        var thisRow = vtModules.Get(i);
        var newRow = this.methods.Rows.Add();
        newRow.LineNo = thisRow.StartLine;
        newRow.Method = thisRow.Name;
        newRow.Context =this.isForm?thisRow.Context:" ";
        newRow._method = thisRow._method;
    }
    this.methods.Rows.Sort("Context, LineNo");
    
}

FuncProcPanel.prototype.beforeExitApp = function () {
    this.watcher.stopWatch();
}
FuncProcPanel.prototype.OnOpen = function() {
    this.GetList();
    this.viewFunctionList(this.ТекстФильтра);
    events.connect(Designer, "onIdle", this)
}
FuncProcPanel.prototype.OnClose= function() {
    this.results.Rows.Clear();
    events.disconnect(Designer, "onIdle", this)
    //this.tc.stop();
}
FuncProcPanel.prototype.CmdBarTreeView = function (Button) {
    this.form.TreeView = !this.form.TreeView;
    Button.val.Check = this.form.TreeView;
    //this.form.Controls.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;
    //this.switchView(this.form.TreeView);
    this.viewFunctionList(this.ТекстФильтра);
}
FuncProcPanel.prototype.expandTree = function () {
    if (this.form.TreeView)
    {
        for (var rowNo=0; rowNo < this.results.Rows.Count(); rowNo++)
            this.form.Controls.FunctionList.Expand(this.results.Rows.Get(rowNo), true);
    }
}

FuncProcPanel.prototype.getGroupRow = function (methodData) {

    if (!this.form.TreeView)
        return this.results;

    var groupRow = this.groupsCache.Get(methodData);
    if (!groupRow) 
    {
        groupRow = this.results.Rows.Add();
        groupRow.Method = methodData;
        this.groupsCache.Insert(methodData, groupRow); 
    }
    return groupRow;
}

FuncProcPanel.prototype.Filter = function(filterString){
    filterString = filterString.toLowerCase()
    if (filterString!=this.lastFilter){
        this.lastFilter = filterString;
        this.viewFunctionList(filterString);
    }
}
FuncProcPanel.prototype.viewFunctionList = function(newFilter) {
    
    //FIXME: тут undefined не должно быть...
    
    currentFilter = (newFilter!=undefined)?newFilter:'' //Шаманство, надо у Орефкова спросить, почему тут undefined 
    //Message(currentFilter)
    //debugger;
    
    this.results.Rows.Clear();
    this.groupsCache.Clear();
    var filters = currentFilter.split(/\s+/)
    
    for (var i = 0; i<this.methods.Rows.Count(); i++) {
        
        var thisRow = this.methods.Rows.Get(i);
        var needAdd = true;
        var Method = thisRow.Method.toLowerCase()
        if (currentFilter.length>0) {
            for(var s in filters)
            {
                if(Method.indexOf(filters[s]) < 0) {
                    needAdd = false
                    break;
                }
            }
        }
        if(!needAdd) continue
        
        var groupRow = this.getGroupRow(thisRow.Context);
        var newRow = groupRow.Rows.Add();
        newRow.LineNo = thisRow.LineNo;
        newRow.Method = thisRow.Method;
        newRow.Context = thisRow.Context;
        newRow.RowType = thisRow._method.IsProc ? RowTypes.ProcGroup : RowTypes.FuncGroup;
    }
    this.expandTree();
    this.form.Controls.FunctionList.Columns.Context.Visible = (!this.form.TreeView && this.isForm);
}

FuncProcPanel.prototype.CmdBarActivate = function(Button){
    this.goToLine(this.form.Controls.FunctionList.CurrentRow);
}

FuncProcPanel.prototype.activateEditor = function () {
    if (!snegopat.activeTextWindow())
        stdcommands.Frame.GotoBack.send();
}

FuncProcPanel.prototype.goToLine = function (row) {

    this.form.Controls.FunctionList.CurrentRow = row;

    if (!this.targetWindow)
        return;
 
    if (!this.targetWindow.IsActive())
    {
        DoMessageBox("Окно, для которого выполнялся поиск, было закрыто!\nОкно поиска с результатами стало не актуально и будет закрыто.");
        //this.clearSearchResults();
        this.Close();
        return;
    }
 
    // Переведем фокус в окно текстового редактора.
    this.activateEditor();

    // Найдем позицию найденного слова в строке.
    //var searchPattern = this.form.WholeWords ? "(?:[^\\w\\dА-я]|^)" + row.ExactMatch + "([^\\w\\dА-я]|$)" : StringUtils.addSlashes(row.ExactMatch); 
    //var re = new RegExp(searchPattern, 'g');
    //var matches = re.exec(row.FoundLine);
    
    // Установим выделение на найденное совпадение со строкой поиска.
    this.targetWindow.SetCaretPos(row.LineNo, 1);
    
}

FuncProcPanel.prototype.FuncProcOnRowOutput = function(Control, RowAppearance, RowData) {
    var cell = RowAppearance.val.Cells.Method;
    
    switch (RowData.val.RowType)
    {
    case RowTypes.FuncGroup:
        cell.SetPicture(this.Icons.Func);
        break;
    
    case RowTypes.ProcGroup:
        cell.SetPicture(this.Icons.Proc);
        break;
        
    default:
        break;
    }
    
    //if (RowData.val._method.IsProc !== undefined)
    //    RowAppearance.val.Cells.Method.SetPicture(RowData.val._method.IsProc ? this.Icons.Proc : this.Icons.Func);
    
}

FuncProcPanel.prototype.FuncProcOnSelection = function(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка) {
    this.goToLine(ВыбраннаяСтрока.val);
    СтандартнаяОбработка.val = false; // Это для того чтобы после нажатия на строку курсор не уходит с табличного поля, и при новой активизации формы можно было курсором посмотреть другие значения
}

FuncProcPanel.prototype.onIdle = function(){
    this.updateList();
}

FuncProcPanel.prototype.updateList = function()
{
    // Получим текущий текст из поля ввода
    FuncPanel = GetFuncProcPanel();
    vbs.var0 = this.form.Controls.ТекстФильтра;
    vbs.DoExecute("var0.GetTextSelectionBounds var1, var2, var3, var4")
    this.form.Controls.ТекстФильтра.УстановитьГраницыВыделения(1, 1, 1, 10000)
    var newText = this.form.Controls.ТекстФильтра.ВыделенныйТекст.replace(/^\s*|\s*$/g, '')
    this.form.Controls.ТекстФильтра.УстановитьГраницыВыделения(vbs.var1, vbs.var2, vbs.var3, vbs.var4)
    this.Filter(newText);
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

////////////////////////////////////////////////////////////////33////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее.
////

function TextWindowsWatcher() {
    this.timerId = 0;
    this.lastActiveTextWindow = null;
    this.startWatch();
}

TextWindowsWatcher.prototype.getActiveTextWindow = function () {
    if (this.lastActiveTextWindow && this.lastActiveTextWindow.IsActive())
        return this.lastActiveTextWindow;
    return null;
}

TextWindowsWatcher.prototype.startWatch = function () {
    if (this.timerId)
        this.stopWatch();
    this.timerId = createTimer(500, this, 'onTimer');
}

TextWindowsWatcher.prototype.stopWatch = function () {
    if (!this.timerId)
        return;
    killTimer(this.timerId);
    this.timerId = 0;
}

TextWindowsWatcher.prototype.onTimer = function (timerId) {
    var wnd = GetTextWindow();    
    if (wnd)
        this.lastActiveTextWindow = wnd;
    else if (this.lastActiveTextWindow && !this.lastActiveTextWindow.IsActive())
        this.lastActiveTextWindow = null;
}
//} TextWindowsWatcher 

////////////////////////////////////////////////////////////////////////////////////////
////{ StartUp
////
function GetFuncProcPanel() {
    if (!FuncProcPanel._instance)
        new FuncProcPanel();
    
    return FuncProcPanel._instance;
}

RowTypes = {
    'ProcGroup'     : 1,
    'FuncGroup'     : 2
}
events.connect(Designer, "beforeExitApp", GetFuncProcPanel());
////}