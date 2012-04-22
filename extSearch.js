$engine JScript
$uname ExtendedSearch
$dname Расширенный поиск
$addin global
$addin stdcommands
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Расширенный поиск" (extSearch.js) для проекта "Снегопат"
////
//// Описание: Реализует поиск текста при помощи регулярных выражений в активном окне редактора.
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}
////////////////////////////////////////////////////////////////////////////////////////

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('SettingsManagement.js', SelfScript);
global.connectGlobals(SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНайти текст'] = function() {
    
    var w = GetTextWindow();
    if (!w) return;
    
    var es = GetExtSearch();
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    es.setSimpleQuery(selText);    
    es.Show();
    
    if (selText == '')
    {
        es.clearSearchResults();
        es.setDefaultSearchQuery();
    }
    else
        es.runSearch(true); // добавил параметр который сигнализирует что идет поиск текущего слова
}

SelfScript.self['macrosОткрыть окно поиска'] = function() {
    GetExtSearch().Show();
}

SelfScript.self['macrosЗакрыть окно поиска'] = function() {
    return GetExtSearch().Close();
}

SelfScript.self['macrosПерейти к следующему совпадению'] = function() {
    var es = GetExtSearch();
    es.Show();
    es.moveRowCursor(true);
}

SelfScript.self['macrosПерейти к предыдущему совпадению'] = function() {
    var es = GetExtSearch();
    es.Show();
    es.moveRowCursor(false);
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Открыть окно поиска';
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ ExtSearch - Расширенный поиск в тексте модуля.
////
function ExtSearch() {
    
    ExtSearch._instance = this;
    
    this.form = loadScriptForm("scripts\\extSearch.results.ssf", this);
    this.form.КлючСохраненияПоложенияОкна = "extSearch.js"
    this.results = this.form.Controls.SearchResults.Value;
    this.results.Columns.Add('_method');
    
    this.watcher = new TextWindowsWatcher();
    this.watcher.startWatch();
        
    this.defaultSettings = {
        'IsRegExp'      : false, // Поиск регулярными выражениями.
        'CaseSensetive' : false, // Учитывать регистр при поиске.
        'WholeWords'    : false, // Поиск слова целиком.
        'SearchHistory' : v8New('ValueList'), // История поиска.
        'HistoryDepth'  : 10, // Количество элементов истории поиска.
        'TreeView'      : false // Группировать результаты поиска по методам.
    };
        
    this.settings = SettingsManagement.CreateManager(SelfScript.uniqueName, this.defaultSettings);
    this.settings.LoadSettings();
    this.settings.ApplyToForm(this.form);
    
    this.targetWindow = null;
    
    this.groupsCache = v8New("Map");
    
    this.Icons = {
        'Func': this.form.Controls.PicFunc.Picture,
        'Proc': this.form.Controls.PicProc.Picture
    }
}

ExtSearch.prototype.Show = function () {
    this.form.Open();
}

ExtSearch.prototype.Close = function () {
    if (this.form.IsOpen())
    {
        this.form.Close();
        return true;
    }
    return false;
}

ExtSearch.prototype.IsOpen = function () {
    return this.form.IsOpen();
}

ExtSearch.prototype.setSimpleQuery = function (query) {
    this.form.Query = query;
    this.form.IsRegExp = false;
    this.form.CaseSensetive = false;
    this.addToHistory(query);
}

ExtSearch.prototype.expandTree = function () {
    if (this.form.TreeView)
    {
        for (var rowNo=0; rowNo < this.results.Rows.Count(); rowNo++)
            this.form.Controls.SearchResults.Expand(this.results.Rows.Get(rowNo), true);
    }
}

ExtSearch.prototype.runSearch = function (fromHotKey) {
            
    this.targetWindow = this.watcher.getActiveTextWindow();
    if (!this.targetWindow) return;

    this.clearSearchResults();
    
    var pattern = this.form.Query;
    if (!this.form.IsRegExp) 
    {
        pattern = StringUtils.addSlashes(pattern);
        
        if (this.form.WholeWords)
            pattern = "([^\\w\\dА-я]|^)" + pattern + "([^\\w\\dА-я]|$)";
    }
    
    var iFlag = !this.form.CaseSensetive;
    
    var re = null;
    try 
    {
        re = new RegExp(pattern, iFlag ? 'i' : '');
    }
    catch (e)
    {
        DoMessageBox("В регулярном выражении допущена ошибка: \n" + e.message);
        return;
    }
            
    var curMethod = { 
        'Name'      : 'Раздел описания переменных',
        'IsProc'    : undefined,
        'StartLine' : 0
    }
            
    var re_method_start = /^\s*((?:procedure)|(?:function)|(?:процедура)|(?:функция))\s+([\wА-яёЁ\d]+)\s*\(/i;
    var re_method_end = /((?:EndProcedure)|(?:EndFunction)|(?:КонецПроцедуры)|(?:КонецФункции))/i;
            
    for(var lineNo=1; lineNo <= this.targetWindow.LinesCount(); lineNo++)
    {
        var line = this.targetWindow.GetLine(lineNo);
        
        // Проверим, не встретилось ли начало метода.
        var matches = line.match(re_method_start);
        if (matches && matches.length)
        {
            curMethod = {
                'Name'      : matches[2],
                'IsProc'    : matches[1].toLowerCase() == 'процедура' || matches[1].toLowerCase() == 'procedure',
                'StartLine' : lineNo - 1
            }
        }
        
        matches = line.match(re);
        if (matches && matches.length) //moduleData.getMethodByLineNumber(lineNo)
            this.addSearchResult(line, lineNo, matches, curMethod);
           
        // Проверим, не встретился ли конец метода.
        matches = line.match(re_method_end);
        if (matches && matches.length)
        {
            curMethod = {
                'Name'      : '',
                'IsProc'    : undefined,
                'StartLine' : lineNo
            }
        }
    }
        
    this.expandTree();
    
    // Запомним строку поиска в истории.
    this.addToHistory(this.form.Query);
    
    if (this.results.Rows.Count() == 0) 
    {
        DoMessageBox('Совпадений не найдено!');
        return;
    }
    
    if (this.form.TreeView && this.results.Rows.Count() > 0)
    {
        var lastGroup = this.results.Rows.Get(this.results.Rows.Count() - 1);
        if (lastGroup.FoundLine == '')
            lastGroup.FoundLine = "Раздел основной программы";
    }
    
    if(fromHotKey == true)
    { 
        // Для того чтобы курсор не прыгал при поиске текущего слова, 
        // тут бы еще добавить чтобы активизировалась именно текущая строка
        this.form.Open();
        this.form.CurrentControl=this.form.Controls.SearchResults;              
        var curLineRow = this.form.SearchResults.Rows.Find(this.targetWindow.GetCaretPos().beginRow, "LineNo");
        if (curLineRow)
            this.form.Controls.SearchResults.CurrentRow = curLineRow;
    }
    else
    {
        this.goToLine(this.results.Rows.Get(0).Rows.Get(0));
    }
}

RowTypes = {
    'SearchResult'  : 0,
    'ProcGroup'     : 1,
    'FuncGroup'     : 2
}

ExtSearch.prototype.getGroupRow = function (methodData) {

    if (!this.form.TreeView)
        return this.results;

    var groupRow = this.groupsCache.Get(methodData);
    if (!groupRow) 
    {
        groupRow = this.results.Rows.Add();
        groupRow.FoundLine = methodData.Name;
        groupRow.Method = methodData.Name;
        
        if (methodData.IsProc !== undefined)
            groupRow.RowType = methodData.IsProc ? RowTypes.ProcGroup : RowTypes.FuncGroup;
            
        groupRow.LineNo = methodData.StartLine + 1;
        groupRow._method = methodData;
        
        this.groupsCache.Insert(methodData, groupRow); 
    }
    return groupRow;
}

ExtSearch.prototype.addSearchResult = function (line, lineNo, matches, methodData) {

    var groupRow = this.getGroupRow(methodData);

    var resRow = groupRow.Rows.Add();
    resRow.FoundLine = line;
    resRow.LineNo = lineNo;
    
    if(undefined != methodData)
        resRow.Method = methodData.Name;

    resRow._method = methodData;
        
    if (this.form.WholeWords)
        resRow.ExactMatch = matches[0].replace(/^[^\w\dА-я]/, '').replace(/[^\w\dА-я]$/, '');
    else
        resRow.ExactMatch = matches[0];
}

ExtSearch.prototype.activateEditor = function () {
    if (!snegopat.activeTextWindow())
        stdcommands.Frame.GotoBack.send();
}

ExtSearch.prototype.goToLine = function (row) {

    this.form.Controls.SearchResults.CurrentRow = row;    

    if (!this.targetWindow)
        return;
 
    if (!this.targetWindow.IsActive())
    {
        DoMessageBox("Окно, для которого выполнялся поиск, было закрыто!\nОкно поиска с результатами стало не актуально и будет закрыто.");
        this.clearSearchResults();
        this.Close();
        return;
    }
 
    // Переведем фокус в окно текстового редактора.
    this.activateEditor();

    // Найдем позицию найденного слова в строке.
    var searchPattern = this.form.WholeWords ? "(?:[^\\w\\dА-я]|^)" + row.ExactMatch + "([^\\w\\dА-я]|$)" : StringUtils.addSlashes(row.ExactMatch); 
    var re = new RegExp(searchPattern, 'g');
    var matches = re.exec(row.FoundLine);

    var colNo = 1;    
    if (matches) 
    {        
        colNo = re.lastIndex - row.ExactMatch.length + 1;
        
        if (this.form.WholeWords && matches.length > 1)        
            colNo -= matches[1].length; 
           
    }
    
    // Установим выделение на найденное совпадение со строкой поиска.
    this.targetWindow.SetCaretPos(row.LineNo, colNo);
    this.targetWindow.SetSelection(row.LineNo, colNo, row.LineNo, colNo + row.ExactMatch.length);
}

ExtSearch.prototype.moveRowCursor = function (forward) {
    
    if (!this.results.Rows.Count())
        return;
     
    var row;     
    var curRow = this.form.Controls.SearchResults.CurrentRow;
    
    if (!curRow)
    {
        row = this.results.Rows.Get(0);
        if (this.form.TreeView)
            row = row.Rows.Get(0);
            
        this.goToLine(row);    
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
    
    this.goToLine(row);        
}

ExtSearch.prototype.clearSearchResults = function () {
    this.groupsCache.Clear();
    this.results.Rows.Clear();
}

ExtSearch.prototype.setDefaultSearchQuery = function () {
    this.form.CurrentControl=this.form.Controls.Query;
}

ExtSearch.prototype.addToHistory = function (query) {
    
    if (!query) 
        return;
    
    // Добавляем в историю только если такой поисковой строки там нет.
    var history = this.form.SearchHistory;
    if (history.FindByValue(query))
        return;
        
    if (history.Count())
        history.Insert(0, query);
    else
        history.Add(query);
        
    // Не позволяем истории расти более заданной глубины.
    while (history.Count() > this.settings.HistoryDepth)
        history.Delete(history.Count() - 1);
}

ExtSearch.prototype.getRegExpEditorScriptPath = function () {
    var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
    var scriptPath = mainFolder + "scripts\\RegExpEditor.js";
    var f = v8New('File', scriptPath);
    if (f.Exist())
        return scriptPath;
    return '';
}

ExtSearch.prototype.OnOpen = function () {
        
    if (!this.getRegExpEditorScriptPath())
        this.form.Controls.Query.ChoiceButton = false;
    
    var ctr = this.form.Controls;
    ctr.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;    
    ctr.CmdBar.Buttons.TreeView.Check = this.form.TreeView;
    this.form.Controls.SearchResults.Columns.Method.Visible = !this.form.TreeView;
}

ExtSearch.prototype.OnClose = function () {
    this.settings.ReadFromForm(this.form);
    this.settings.SaveSettings();
}

ExtSearch.prototype.CmdBarBtPrev = function (control) {
    this.moveRowCursor(false);
}

ExtSearch.prototype.CmdBarBtNext = function (control) {
    this.moveRowCursor(true);
}

ExtSearch.prototype.QueryChanged = function (control) {
    if (this.form.Query != '')
        this.runSearch();
}

ExtSearch.prototype.QueryStartListChoice = function (control, defaultHandler) {
    control.val.ChoiceList = this.form.SearchHistory;
}

ExtSearch.prototype.BtSearchClick = function (control) {

    if (this.form.Query == '')
    {
        DoMessageBox('Не задана строка поиска');
        return;
    }
    
    this.runSearch();
}

ExtSearch.prototype.CmdBarOptionsBtAbout = function (control) {
    RunApp('http://snegopat.ru/scripts/wiki?name=extSearch.js');
}

ExtSearch.prototype.SearchResultsSelection = function (control, selectedRow, selectedCol, defaultHandler) {
    this.goToLine(selectedRow.val);
    defaultHandler.val = false; // Это для того чтобы после нажатия на строку курсор не уходит с табличного поля, и при новой активизации формы можно было курсором посмотреть другие значения
}

ExtSearch.prototype.beforeExitApp = function () {
    this.watcher.stopWatch();
}

ExtSearch.prototype.IsRegExpChanged = function(Элемент) {
    if (this.form.IsRegExp)
        this.form.WholeWords = false;
}

ExtSearch.prototype.WholeWordsChanged = function(Элемент) {
    if (this.form.WholeWords)
        this.form.IsRegExp = false;
}

ExtSearch.prototype.QueryStartChoice = function (Control, DefaultHandler) {
    var reEditorPath = this.getRegExpEditorScriptPath();
    if (reEditorPath)
    {
        DefaultHandler.val = false;
        reEditorAddin = stdlib.require(reEditorPath);
        if (reEditorAddin)
        {
            this.form.IsRegExp = true;
            var reEditor = reEditorAddin.CreateRegExpEditor();
            reEditor.open(Control.val);
        }        
    }
}

ExtSearch.prototype.SearchResultsOnRowOutput = function (Control, RowAppearance, RowData) {
    
    var cell = RowAppearance.val.Cells.FoundLine;
    
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
    
    if (RowData.val._method.IsProc !== undefined)
        RowAppearance.val.Cells.Method.SetPicture(RowData.val._method.IsProc ? this.Icons.Proc : this.Icons.Func);
    
}

ExtSearch.prototype.switchView = function (setTreeView) {
    
    var results = this.results.Copy();
    //var curRow = this.form.Controls.SearchResults.CurrentRow;
    //if (curRow)
    this.clearSearchResults();
    
    if (setTreeView)
    {
        for (var i=0; i<results.Rows.Count(); i++)
        {
            var row = results.Rows.Get(i);
            var groupRow = this.getGroupRow(row._method);
            var resRow = groupRow.Rows.Add();
            FillPropertyValues(resRow, row);
        }
        this.expandTree();
    }
    else
    {
        for (var i=0; i<results.Rows.Count(); i++)
        {
            var groupRow = results.Rows.Get(i);
            for (var j=0; j<groupRow.Rows.Count(); j++)
            {
                var row = groupRow.Rows.Get(j);
                var resRow = this.results.Rows.Add();
                FillPropertyValues(resRow, row);
            }
        }
    }    
    this.form.Controls.SearchResults.Columns.Method.Visible = !setTreeView;
}

ExtSearch.prototype.CmdBarTreeView = function (Button) {
    this.form.TreeView = !this.form.TreeView;
    Button.val.Check = this.form.TreeView;
    this.form.Controls.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;
    this.switchView(this.form.TreeView);
}

////} ExtSearch

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
function GetExtSearch() {
    if (!ExtSearch._instance)
        new ExtSearch();
    
    return ExtSearch._instance;
}

events.connect(Designer, "beforeExitApp", GetExtSearch());
////}