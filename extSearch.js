﻿$engine JScript
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
        es.clearSearchResults();
    else
        es.runSearch();    
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

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ ExtSearch - Расширенный поиск в тексте модуля.
////
function ExtSearch() {
    
    ExtSearch._instance = this;
    
    this.form = loadScriptForm("scripts\\extSearch.results.ssf", this);
    this.form.КлючСохраненияПоложенияОкна = "extSearch.js"
    this.results = this.form.Controls.SearchResults.Value;
    
    this.watcher = new TextWindowsWatcher();
    this.watcher.startWatch();
        
    this.defaultSettings = {
        'IsRegExp'      : false, // Поиск регулярными выражениями.
        'CaseSensetive' : false, // Учитывать регистр при поиске.
        'SearchHistory' : v8New('ValueList'), // История поиска.
        'HistoryDepth'  : 10 // Количество элементов истории поиска.
    };
        
    this.settings = SettingsManagement.CreateManager(SelfScript.uniqueName, this.defaultSettings);
    this.settings.LoadSettings();
    this.settings.ApplyToForm(this.form);
    
    this.targetWindow = null;    
}

ExtSearch.prototype.Show = function () {
    if (!this.form.IsOpen())
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

ExtSearch.prototype.runSearch = function () {
            
    this.targetWindow = this.watcher.getActiveTextWindow();
    if (!this.targetWindow) return;
    
    this.clearSearchResults();
    
    var pattern = this.form.Query;
    if (!this.form.IsRegExp)
        pattern = StringUtils.addSlashes(pattern);
    
    var iFlag = !this.form.CaseSensetive;
    
    var re = new RegExp(pattern, iFlag ? 'i' : '');
            
    for(var lineNo=1; lineNo < this.targetWindow.LinesCount(); lineNo++)
    {
        var line = this.targetWindow.GetLine(lineNo);
        var matches = line.match(re);
        if (matches && matches.length)
            this.addSearchResult(line, lineNo, matches);
    }
    
    // Запомним строку поиска в истории.
    this.addToHistory(this.form.Query);
    
    if (this.results.Count() == 0) 
        DoMessageBox('Совпадений не найдено!');
    else
        this.goToLine(this.results.Get(0));
}

ExtSearch.prototype.addSearchResult = function (line, lineNo, matches) {
    var resRow = this.results.Add();
    resRow.FoundLine = line;
    resRow.LineNo = lineNo;
    resRow.ExactMatch = matches[0];
}

ExtSearch.prototype.activateEditor = function () {
	if (!snegopat.activeTextWindow())
		stdcommands.Frame.GotoBack.send();
}

ExtSearch.prototype.goToLine = function (row) {

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
    
    var pos = row.FoundLine.search(row.ExactMatch);        
    var colNo = pos < 1 ? 1 : pos;
    
    // Установим выделение на найденное совпадение со строкой поиска.
    this.targetWindow.SetCaretPos(row.LineNo, colNo);
    if (pos > 0) colNo++;
    this.targetWindow.SetSelection(row.LineNo, colNo, row.LineNo, colNo + row.ExactMatch.length);
}

ExtSearch.prototype.moveRowCursor = function (forward) {
    
    if (!this.results.Count())
        return;
        
    var curRow = this.form.Controls.SearchResults.CurrentRow;

    if (!curRow)
    {
        var row = this.results.Get(0);
        this.form.Controls.SearchResults.CurrentRow = row;    
        this.goToLine(row);    
        return;
    }
    
    var curIndex = this.results.indexOf(curRow);    
        
    // Обеспечим возможность пролистывать результаты поиска по кругу.
    if (forward && curIndex == this.results.Count()-1)
        curIndex = -1;
    else if (!forward && curIndex == 0)
        curIndex = this.results.Count();
    
    var offset = forward ? 1 : -1;
    
    var row = this.results.Get(curIndex + offset);
    this.form.Controls.SearchResults.CurrentRow = row;    
    this.goToLine(row);    
}

ExtSearch.prototype.clearSearchResults = function () {
    this.results.Clear();
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

ExtSearch.prototype.OnOpen = function () {
    
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
    RunApp('http://snegopat.ru/forum/viewtopic.php?f=3&t=90');
}

ExtSearch.prototype.SearchResultsSelection = function (control, selectedRow, selectedCol, defaultHandler) {
    this.goToLine(selectedRow.val);
}

ExtSearch.prototype.beforeExitApp = function () {
    this.watcher.stopWatch();
}

////} ExtSearch

////////////////////////////////////////////////////////////////////////////////////////
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