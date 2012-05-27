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
stdlib.require('ScriptForm.js', SelfScript);
global.connectGlobals(SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНайти текст'] = function() {
    
    var w = GetTextWindow();
    if (!w) return false;
    
    var es = GetExtSearch();
        
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();
    
    es.setSimpleQuery(selText);    
    es.show();
        
    if (selText == '')
    {
        es.clearSearchResults();
        es.setDefaultSearchQuery();
    }
    else
        es.searchActiveDoc(true);
        
    return true;
}

SelfScript.self['macrosОткрыть окно поиска'] = function() {
    GetExtSearch().show();
}

SelfScript.self['macrosЗакрыть окно поиска'] = function() {
    var es = GetExtSearch();
    if (es.isOpen()) {
        es.close();
        return true;
    }
    return false;
}

SelfScript.self['macrosПерейти к следующему совпадению'] = function() {
    var es = GetExtSearch();
    es.show();
    es.moveRowCursor(true);
}

SelfScript.self['macrosПерейти к предыдущему совпадению'] = function() {
    var es = GetExtSearch();
    es.show();
    es.moveRowCursor(false);
}

SelfScript.self['macrosСвернуть группировки'] = function() {
    var es = GetExtSearch();
    es.expandTree(true);
}

SelfScript.self['macrosРазвернуть группировки'] = function() {
    var es = GetExtSearch();
    es.expandTree(false);
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

RowTypes = {
    'SearchResult'  : 0, // Строка результата поиска.
    'ProcGroup'     : 1, // Строка группы-процедуры (в режиме группировки по процедурам и функциям).
    'FuncGroup'     : 2, // Строка группы-функции (в режиме группировки по процедурам и функциям).
    'SearchDoc'     : 3  // Строка документа, в котором производится поиск.
}

RE = {
    METHOD_START : /^\s*((?:procedure)|(?:function)|(?:процедура)|(?:функция))\s+([\wА-яёЁ\d]+)\s*\(/i,
    METHOD_END : /((?:EndProcedure)|(?:EndFunction)|(?:КонецПроцедуры)|(?:КонецФункции))/i
}

ExtSearch = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,
    
    settings : {
        pflSnegopat : {
            'IsRegExp'      : false, // Поиск регулярными выражениями.
            'CaseSensetive' : false, // Учитывать регистр при поиске.
            'WholeWords'    : false, // Поиск слова целиком.
            'SearchHistory' : v8New('ValueList'), // История поиска.
            'HistoryDepth'  : 15, // Количество элементов истории поиска.
            'TreeView'      : false // Группировать результаты поиска по методам.            
        }
    },

    construct : function () {
    
        this._super("scripts\\extSearch.results.ssf");
                
        this.form.КлючСохраненияПоложенияОкна = "extSearch.js"
        this.results = this.form.Controls.SearchResults.Value;
        this.results.Columns.Add('_method');
        this.results.Columns.Add('groupsCache');
        this.results.Columns.Add('_object');
        
        this.watcher = new TextWindowsWatcher();
        this.watcher.startWatch();
          
        this.loadSettings();
        
        this.targetWindow = null;
        
        this.Icons = {
            'Func': this.form.Controls.PicFunc.Picture,
            'Proc': this.form.Controls.PicProc.Picture
        }
        
        this.SearchDocRowFont = v8New('Font', undefined, undefined, true);
        
        this.SetControlsVisible();
        
        ExtSearch._instance = this;
    
    },
    
    setSimpleQuery : function (query) {
        this.form.Query = query;
        this.form.IsRegExp = false;
        this.form.CaseSensetive = false;
        this.addToHistory(query);
    },
    
    expandTree : function (collapse) {
        var tree = this.form.Controls.SearchResults;
        for (var i=0; i < this.results.Rows.Count(); i++)
        {
            var docRow = this.results.Rows.Get(i);
            for (var j=0; j < docRow.Rows.Count(); j++)
            {
                var row = docRow.Rows.Get(j);
                collapse ? tree.Collapse(row) : tree.Expand(row, true);
            }
        }
    },
        
    getWindowObject : function (view) {
       
        if (view.mdObj && view.mdProp) 
            return new MdObject(view.mdObj, view.mdProp, view.title);
            
        var obj = view.getObject();
        if (obj && toV8Value(obj).typeName(0) == 'TextDocument')
            return new TextDocObject(obj, view.title);        
            
        if (obj) Message('Неподдерживаемый тип объекта для поиска: ' + toV8Value(obj).typeName(0));
        
        return null;
    },
    
    searchActiveDoc : function (fromHotKey) {
        
        this.clearSearchResults();
        
        var activeWindow = this.watcher.getActiveTextWindow();
        if (!activeWindow) return;
             
        var re = this.buildSearchRegExpObject();
        if (!re) return;

        var obj = this.getWindowObject(activeWindow.GetView());
        if (!obj) return;
        
        var docRow = this.search(obj, re);
        
        this.expandTree();
        
        // Запомним строку поиска в истории.
        this.addToHistory(this.form.Query);
        
        if (this.results.Rows.Count() == 0) 
        {
            DoMessageBox('Совпадений не найдено!');
            return;
        }
        
        if (this.form.TreeView && docRow.Rows.Count() > 0)
        {
            var lastGroup = this.results.Rows.Get(this.results.Rows.Count() - 1);
            if (lastGroup.FoundLine == '<Текст вне процедур и функций>')
                lastGroup.FoundLine = "Раздел основной программы";
        }
        
        if (fromHotKey == true)
        { 
            // Для того чтобы курсор не прыгал при поиске текущего слова, 
            // тут бы еще добавить чтобы активизировалась именно текущая строка
            this.form.Open();
            this.form.CurrentControl=this.form.Controls.SearchResults;
            var curLineRow = this.getRowForTheCurrentLine(docRow);  
            if (curLineRow)
                this.form.Controls.SearchResults.CurrentRow = curLineRow;            
        }
        else
        {
            if (this.form.TreeView)
                this.goToLine(docRow.Rows.Get(0).Rows.Get(0));
            else
                this.goToLine(docRow.Rows.Get(0));        
        }
    },

    buildSearchRegExpObject : function () {
    
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
            return null;
        }
    
        return re;
    },
    
    search : function (obj, re) {
          
        var docRow = this.results.Rows.Add();
        docRow.FoundLine = obj.getTitle();
        docRow._object = obj;
        docRow.RowType = RowTypes.SearchDoc;
        docRow.groupsCache = v8New('Map');
          
        var curMethod = { 
            'Name'      : 'Раздел описания переменных',
            'IsProc'    : undefined,
            'StartLine' : 0
        }
                                
        var lines = StringUtils.toLines(obj.getText());
        for(var lineIx=0; lineIx < lines.length; lineIx++)
        {
            var line = lines[lineIx];
            
            // Проверим, не встретилось ли начало метода.
            var matches = line.match(RE.METHOD_START);
            if (matches && matches.length)
            {
                curMethod = {
                    'Name'      : matches[2],
                    'IsProc'    : matches[1].toLowerCase() == 'процедура' || matches[1].toLowerCase() == 'procedure',
                    'StartLine' : lineIx
                }
            }
            
            matches = line.match(re);
            if (matches && matches.length)
                this.addSearchResult(docRow, line, lineIx + 1, matches, curMethod);
               
            // Проверим, не встретился ли конец метода.
            matches = line.match(RE.METHOD_END);
            if (matches && matches.length)
            {
                curMethod = {
                    'Name'      : '<Текст вне процедур и функций>',
                    'IsProc'    : undefined,
                    'StartLine' : lineIx
                }
            }
        }    
        return docRow;
    },
    
    getRowForTheCurrentLine: function(docRow) {
        var twnd = docRow._object.activate();
        return docRow.Rows.Find(twnd.GetCaretPos().beginRow, "LineNo", true);
    },

    getGroupRow: function (docRow, methodData) {

        if (!this.form.TreeView)
            return docRow;

        var groupRow = docRow.groupsCache.Get(methodData);
        if (!groupRow) 
        {
            groupRow = docRow.Rows.Add();
            groupRow.FoundLine = methodData.Name;
            groupRow.Method = methodData.Name;
            groupRow._object = docRow._object;
            
            if (methodData.IsProc !== undefined)
                groupRow.RowType = methodData.IsProc ? RowTypes.ProcGroup : RowTypes.FuncGroup;
                
            groupRow.lineNo = methodData.StartLine + 1;
            groupRow._method = methodData;
            
            docRow.groupsCache.Insert(methodData, groupRow); 
        }
        return groupRow;
    },
    
    addSearchResult : function (docRow, line, lineNo, matches, methodData) {

        var groupRow = this.getGroupRow(docRow, methodData);

        var resRow = groupRow.Rows.Add();
        resRow.FoundLine = line;
        resRow.lineNo = lineNo;
        resRow._object = docRow._object;
        
        if(undefined != methodData)
            resRow.Method = methodData.Name;

        resRow._method = methodData;
            
        if (this.form.WholeWords)
            resRow.ExactMatch = matches[0].replace(/^[^\w\dА-я]/, '').replace(/[^\w\dА-я]$/, '');
        else
            resRow.ExactMatch = matches[0];
    },
    
    goToLine : function (row) {

        this.form.Controls.SearchResults.CurrentRow = row;    

        // Откроем и/или активируем окно объекта, в котором выполнялся поиск.
        var targetWindow = row._object.activate();
     
        if (!targetWindow.IsActive())
        {
            DoMessageBox("Окно, для которого выполнялся поиск, было закрыто!\nОкно поиска с результатами стало не актуально и будет закрыто.");
            this.clearSearchResults();
            this.Close();
            return;
        }
     
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
        targetWindow.SetCaretPos(row.LineNo, colNo);
        targetWindow.SetSelection(row.LineNo, colNo, row.LineNo, colNo + row.ExactMatch.length);
    },

    moveRowCursor : function (forward) {
        
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
    },
    
    clearSearchResults : function () {
        this.results.Rows.Clear();
    },
    
    setDefaultSearchQuery : function () {
        this.form.CurrentControl=this.form.Controls.Query;
    },
    
    addToHistory : function (query) {
        
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
        while (history.Count() > this.form.HistoryDepth)
            history.Delete(history.Count() - 1);
    },
    
    getRegExpEditorScriptPath : function () {
        var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
        var scriptPath = mainFolder + "scripts\\RegExpEditor.js";
        var f = v8New('File', scriptPath);
        if (f.Exist())
            return scriptPath;
        return '';
    },
    
    Form_OnOpen : function () {   
        if (!this.getRegExpEditorScriptPath())
            this.form.Controls.Query.ChoiceButton = false;
        
        this.SetControlsVisible();
    },

    Form_OnClose : function () {
        this.saveSettings();
    },

    CmdBar_BtPrev : function (control) {
        this.moveRowCursor(false);
    },

    CmdBar_BtNext : function (control) {
        this.moveRowCursor(true);
    },
    
    Query_OnChange : function (control) {
        if (this.form.Query != '')
            this.searchActiveDoc();
    },

    Query_StartListChoice : function (control, defaultHandler) {
        control.val.ChoiceList = this.form.SearchHistory;
    },

    BtSearch_Click : function (control) {

        if (this.form.Query == '')
        {
            DoMessageBox('Не задана строка поиска');
            return;
        }
        
        this.searchActiveDoc();
    },

    CmdBarOptions_BtAbout : function (control) {
        RunApp('http://snegopat.ru/scripts/wiki?name=extSearch.js');
    },

    SearchResults_Selection : function (control, selectedRow, selectedCol, defaultHandler) {
        this.goToLine(selectedRow.val);
        defaultHandler.val = false; // Это для того чтобы после нажатия на строку курсор не уходит с табличного поля, и при новой активизации формы можно было курсором посмотреть другие значения
    },
    
    beforeExitApp : function () {
        this.watcher.stopWatch();
    },

    IsRegExp_OnChange : function(Элемент) {
        if (this.form.IsRegExp)
            this.form.WholeWords = false;

        this.SetControlsVisible()
    },

    WholeWords_OnChange : function(Элемент) {
        if (this.form.WholeWords)
            this.form.IsRegExp = false;

        this.SetControlsVisible();
    },
    
    Query_StartChoice : function (Control, DefaultHandler) {
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
    },
    
    SearchResults_OnRowOutput : function (Control, RowAppearance, RowData) {
        
        var cell = RowAppearance.val.Cells.FoundLine;
        
        switch (RowData.val.RowType)
        {
        case RowTypes.FuncGroup:
            cell.SetPicture(this.Icons.Func);
            break;
        
        case RowTypes.ProcGroup:
            cell.SetPicture(this.Icons.Proc);
            break;

        case RowTypes.SearchDoc:
            RowAppearance.val.Cells.LineNo.SetText('');
            RowAppearance.val.Font = this.SearchDocRowFont;
            RowAppearance.val.TextColor = WebColors.DarkBlue;
            break;
            
        default:
            break;
        }
        
        if (RowData.val._method && RowData.val._method.IsProc !== undefined)
            RowAppearance.val.Cells.Method.SetPicture(RowData.val._method.IsProc ? this.Icons.Proc : this.Icons.Func);
        
    },
    
    switchView : function (setTreeView) {
        
        var results = this.results.Copy();
        
        this.clearSearchResults();
        
        for (var docRowIx = 0; docRowIx < results.Rows.Count(); docRowIx++)
        {
            var oldDocRow = results.Rows.Get(docRowIx);
            var docRow = this.results.Rows.Add();
            FillPropertyValues(docRow, oldDocRow);
            docRow.groupsCache = v8New('Map');
            
            if (setTreeView)
            {
                for (var i=0; i<oldDocRow.Rows.Count(); i++)
                {
                    var row = oldDocRow.Rows.Get(i);
                    var groupRow = this.getGroupRow(docRow, row._method);
                    var resRow = groupRow.Rows.Add();
                    FillPropertyValues(resRow, row);
                }
            }
            else
            {
                for (var i=0; i<oldDocRow.Rows.Count(); i++)
                {
                    var groupRow = oldDocRow.Rows.Get(i);
                    for (var j=0; j<groupRow.Rows.Count(); j++)
                    {
                        var row = groupRow.Rows.Get(j);
                        var resRow = docRow.Rows.Add();
                        FillPropertyValues(resRow, row);
                    }
                }
            }    
        }
        this.expandTree();        
        this.SetControlsVisible();
    },
    
    CmdBar_TreeView : function (Button) {
        this.form.TreeView = !this.form.TreeView;
        Button.val.Check = this.form.TreeView;
        //this.form.Controls.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;
        this.switchView(this.form.TreeView);
    },
    
    CmdBar_ExpandAll : function (Button) {
        this.expandTree(false);
    },
    
    CmdBar_CollapseAll : function (Button) {
        this.expandTree(true);
    },

    SetControlsVisible : function() {
        
        var ctr = this.form.Controls;
        //ctr.SearchResults.Columns.FoundLine.ShowHierarchy = this.form.TreeView;    
        ctr.CmdBar.Buttons.TreeView.Check = this.form.TreeView;
        this.form.Controls.SearchResults.Columns.Method.Visible = !this.form.TreeView;
        this.form.Controls.SearchResults.Columns.ExactMatch.Visible = this.form.IsRegExp;

        var buttons = this.form.Controls.CmdBar.Buttons;
        buttons.ExpandAll.Enabled = this.form.TreeView;
        buttons.Actions.Buttons.ExpandAll.Enabled = this.form.TreeView;
        buttons.CollapseAll.Enabled = this.form.TreeView;
        buttons.Actions.Buttons.CollapseAll.Enabled = this.form.TreeView;

    }
  
}); // end of ExtSearch class

////} ExtSearch

////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные объекты.
////

MdObject = stdlib.Class.extend({           
    construct: function (obj, prop, title) {
        this.obj = obj;
        this.prop = prop;
        this.title = title;
    },
    getText: function() {
        return this.obj.getModuleText(this.prop.id);
    },
    activate: function() {
        this.obj.openModule(this.prop.id);
        return GetTextWindow();
    },
    getTitle: function() {
        if (!this.title)
        {
            function getMdName(mdObj) {                             
                if (mdObj.parent && mdObj.parent.mdClass.name(1) != 'Конфигурация')
                    return getMdName(mdObj.parent) + '.' + mdObj.mdClass.name(1) + ' ' + mdObj.name;
                var cname = mdObj.mdClass.name(1);
                return  (cname ? cname + ' ' : '') + mdObj.name;
            }
            this.title = getMdName(this.obj) + ': ' + this.prop.name(1);
        }
        return this.title;
    }
});

TextDocObject = stdlib.Class.extend({
    construct: function (txtDoc, title) {
        this.obj = txtDoc;
        this.title = title;
    },
    getText: function() {
        return this.obj.GetText();
    },
    activate: function() {
        this.obj.Show();
        return GetTextWindow();
    },
    getTitle: function() {
        if (!this.title)
            this.title = this.obj.UsedFileName;
        return this.title;
    }
});

////
////} Вспомогательные объекты.
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее.
////

TextWindowsWatcher = stdlib.Class.extend({

    construct : function() {
        this.timerId = 0;
        this.lastActiveTextWindow = null;
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
        this.timerId = createTimer(500, this, 'onTimer');
    },

    stopWatch : function () {
        if (!this.timerId)
            return;
        killTimer(this.timerId);
        this.timerId = 0;
    },

    onTimer : function (timerId) {
        var wnd = GetTextWindow();    
        if (wnd)
            this.lastActiveTextWindow = wnd;
        else if (this.lastActiveTextWindow && !this.lastActiveTextWindow.IsActive())
            this.lastActiveTextWindow = null;
    }
    
}); // end of TextWindowsWatcher class

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