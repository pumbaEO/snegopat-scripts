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

function getPredefinedHotkeys(predef)
{
    predef.setVersion(3)
    predef.add("Открыть окно", "Ctrl + 3")
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
    
    this.isForm = false; //Признак формы и необходимости строить дерево.
    this.defaultSettings = {
        'TreeView'      : false // Группировать результаты поиска по контекстам.
    };
        
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

    //Возьмем пример у Орефкова из wndpanel
    this.needHide = false;

    this.form.Controls.InvisiblePanel.Кнопки.SelectAndHide.СочетаниеКлавиш = ЗначениеИзСтрокиВнутр(
        '{"#",69cf4251-8759-11d5-bf7e-0050bae2bc79,1,\n{0,13,8}\n}')

}
FuncProcPanel.prototype.InvisiblePanelSelectAndHide = function(Button) {

    this.goToLine(this.form.Controls.FunctionList.CurrentRow)
    this.needHide = true;
}

FuncProcPanel.prototype.FunctionListMethodПриИзменении = function(Элемент){
    this.goToLine(this.form.Controls.FunctionList.CurrentRow);
    this.needHide = true;
}

FuncProcPanel.prototype.Show = function () {

    this.form.Open();
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
    var contextCache = v8New("Map");
    cnt = SyntaxAnalysis.AnalyseTextDocument(this.targetWindow);
    vtModules = cnt.getMethodsTable();
    for (var i = 0; i<vtModules.Count(); i++) {
        var thisRow = vtModules.Get(i);
        var newRow = this.methods.Rows.Add();
        newRow.LineNo = thisRow.StartLine;
        newRow.Method = thisRow.Name;
        newRow.Context =this.isForm?thisRow.Context:" ";
        newRow._method = thisRow._method;
        contextCache.Insert(newRow.Context , "1"); 
    }
    this.form.TreeView = (this.isForm && (contextCache.Count()>1))
    
    //FIXME: добавить настройку сортировки по алфавиту/порядку объявления...
    this.methods.Rows.Sort("Context, LineNo"); //Сортировка по умолчанию по порядку.
    
    this.form.CurrentControl=this.form.Controls.ТекстФильтра;
    
}

FuncProcPanel.prototype.beforeExitApp = function () {
    this.watcher.stopWatch();
}
FuncProcPanel.prototype.OnOpen = function() {
    this.GetList();
    this.form.ТекстФильтра = '';
    this.viewFunctionList(this.form.ТекстФильтра);
    events.connect(Designer, "onIdle", this)
}
FuncProcPanel.prototype.OnClose= function() {
    this.results.Rows.Clear();
    this.methods.Rows.Clear();
    this.groupsCache.Clear();
    this.lastFilter='';
    this.isForm=false;
    events.disconnect(Designer, "onIdle", this)
}
FuncProcPanel.prototype.CmdBarTreeView = function (Button) {
    this.form.TreeView = !this.form.TreeView;
    Button.val.Check = this.form.TreeView;
    this.form.Controls.FunctionList.Columns.Method.ShowHierarchy = this.form.TreeView;
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
    
    //FIXME: тут undefined не должно быть... но почему-то есть.
    currentFilter = (newFilter!=undefined)?newFilter:'' //Шаманство, надо у Орефкова спросить, почему тут undefined 
    
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
    this.form.Controls.FunctionList.Columns.Context.Visible = !this.form.TreeView;
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
        DoMessageBox("Окно, для которого показывался список, было закрыто!\nОкно с результатами стало не актуально и будет закрыто.");
        this.Close();
        return;
    }
 
    // Переведем фокус в окно текстового редактора.
    this.activateEditor();

    // Установим выделение на найденное совпадение со строкой поиска.
    this.targetWindow.SetCaretPos(row.LineNo+1, 1);
    this.targetWindow.SetSelection(row.LineNo+1, 1, row.LineNo+1, 8);
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
    this.needHide = true; 
}

FuncProcPanel.prototype.onIdle = function(){
    this.updateList();
    if(this.needHide)
    {
        this.needHide = false
        // Теперь спрячем наше окно.
        // Для прячущегося окна нельзя делать form.Close, т.к. тогда оно пропадет совсем, не оставив кнопки на панели
        if(this.form.СостояниеОкна != ВариантСостоянияОкна.Прячущееся)
            this.form.Close()
    }
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

FuncProcPanel.prototype.moveRowCursor = function (forward) {
var curRow = this.form.Controls.FunctionList.ТекущаяСтрока
    if (!this.results.Rows.Count())
        return;
     
    var row;     
    var curRow = this.form.Controls.FunctionList.CurrentRow;
    
    if (!curRow)
    {
        row = this.results.Rows.Get(0);
        if (this.form.TreeView)
            row = row.Rows.Get(0);
            
        this.form.Controls.FunctionList.CurrentRow = row;     
        return;
    }

    function getNextRow(curRow, rows) {
        
        var curIndex = rows.indexOf(curRow);
        
        // Обеспечим возможность пролистывать результаты поиска по кругу.
        if (forward && curIndex == rows.Count()-1)
            curIndex = -1;
        else if (!forward && curIndex == 0)
            curIndex = rows.Count();
            
        return rows.Get(curIndex + (forward ? 1 : -1));
    }
    
    if (this.form.TreeView)
    {        
        if (curRow.Parent)
        {
            var rows = curRow.Parent.Rows;
            var curIndex = rows.IndexOf(curRow);
            
            if (forward && curIndex == rows.Count()-1)
            {
                var groupRow = getNextRow(curRow.Parent, this.results.Rows);
                row = groupRow.Rows.Get(0);
            }
            else if (!forward && curIndex == 0)
            {
                var groupRow = getNextRow(curRow.Parent, this.results.Rows);
                row = groupRow.Rows.Get(groupRow.Rows.Count() - 1);            
            }
            else
            {
                row = getNextRow(curRow, rows);
            }
        }
        else
        {
            if (forward)
            {
                row = curRow.Rows.Get(0); 
            }
            else 
            {
                var groupRow = getNextRow(curRow, this.results.Rows);
                row = groupRow.Rows.Get(groupRow.Rows.Count() - 1);
            }
        }
    }
    else
    {               
        row = getNextRow(curRow, this.results.Rows);
    }
    
    this.form.Controls.FunctionList.CurrentRow = row;     
 }

FuncProcPanel.prototype.ТекстФильтраРегулирование = function(Элемент, Направление, СтандартнаяОбработка) {
    
    var forward = (-1 == Направление.val);
    this.moveRowCursor(forward);
    
    СтандартнаяОбработка.val = false
}

FuncProcPanel.prototype.ТекстФильтраОкончаниеВводаТекста = function(Элемент, Текст, Значение, СтандартнаяОбработка){
    //Message("Элемент, Текст, Значение, СтандартнаяОбработка");
    //var curRow = this.form.Controls.FunctionList.ТекущаяСтрока;
    //if (curRow==undefined) return
    //if (!curRow)
    //    this.goToLine(curRow)
    
}
FuncProcPanel.prototype.FunctionListПриАктивизацииСтроки = function(Элемент){
    //Message("FunctionListПриАктивизацииСтроки");
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