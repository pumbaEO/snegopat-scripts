$engine JScript
$uname SessionManager
$dname Менеджер сессии
$addin stdcommands
$addin global
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт- менеджер сессий для проекта "Снегопат"
////
//// Описание: Сохраняет список окон и позиции курсора при выходе из конфигуратора
//// и восстанавливает их при входе.
//// 
////
//// Автор Сосна Евгений <shenja@sosna.zp.ua>
////}
////////////////////////////////////////////////////////////////////////////////////////


stdlib.require('TextWindow.js', SelfScript);
global.connectGlobals(SelfScript)

stdlib.require('ScriptForm.js', SelfScript);
var timerId = 0;

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosСохранить текущие окна'] = function() {
    var sm = GetSessionManager();
    sm.saveSession();
    sm.saveSettings();
    return true;
}

SelfScript.self['macrosВосстановить последнюю сессию'] = function() {
    var sm = GetSessionManager();
    sm.restoreSession("");
    return true;
}

SelfScript.self['macrosОткрыть открыть список сохраненных сессий'] = function() {
    var sm = GetSessionManager();
    sm.show();
    return true;
}
SelfScript.self['macrosОчистить всю историю'] = function() {

    var sm = GetSessionManager();
    sm.sessionTreeClear();
    return true;
}

SelfScript.self['macrosОткрыть настройку'] = function() {

    var sms = GetSessionManagerSettings();
    sms.show(true);
    sms = null;
    var sm = GetSessionManager();
    sm.reloadSettings();
    return true;
}


/* Возвращает название макроса по умолчанию - вызывается, когда пользователь
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Восстановить последнюю сессию';
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ SessionManager - Расширенный поиск в тексте модуля.
////
SessionManager = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,

    settings : {
        pflBase : {
            'SessionsHistory' : "", //Таблица значений 
            'SassionSaved'    : "",
            'AutoSave'        : true, // Автосохранение сессии.
            'HistoryDepth'    : 15, // Количество элементов истории сессий.
            'AutoRestore'     : true,
            'MarksSave'       : true,
            'MarksRestore'    : true

        }
    },

    construct : function (isExtend) {

        if (isExtend == undefined) isExtend = false;
        this._super("scripts\\SessionManager.ssf");

        this.form.КлючСохраненияПоложенияОкна = "SessionManager.js"
        this.sessionsList = this.form.Controls.SessionsList.Value;
        
        this.wndlist = new WndList;
        
        this.watcher = new TextWindowsWatcher(this.wndlist);
        this.watcher.startWatch();
        //debugger;
        this.loadSettings();

        this.sessionsList = this.SessionTree;

        if (!isExtend) SessionManager._instance = this;

    },
    loadSettings:function(){
        this._super();
        try{
            this.SessionTree = ValueFromStringInternal(this.form.SessionsHistory);
        } catch(e){
            this.SessionTree = v8New("ValueTree");
            this.SessionTree.Columns.Add("Name");
            this.SessionTree.Columns.Add("path");
            this.SessionTree.Columns.Add("uuid");
            this.SessionTree.Columns.Add("prop");
            this.SessionTree.Columns.Add("rootId");
            this.SessionTree.Columns.Add("sortkey");
            this.SessionTree.Columns.Add("curLine");
        }
        
        try{

            this.SessionTree.Columns.Add("curLine");
        } catch(e){  }

    },

    restoreSession:function(sessionName){

        var sessionsHistory = this.SessionTree;
        
        if (sessionsHistory.Rows.Count()==0){
            return ;
        }

        if (sessionName==undefined) sessionName = ""

        if (!this.form.AutoRestore) {
            return;
        }

        if (sessionName.length>0){
            for (var i = 0; i<sessionsHistory.Rows.Count(); i++){
                session  = sessionsHistory.Rows.Get(i);
                if (session.Name == sessionName){
                    sessionRow = session;
                    break;
                }
            }
        } else {
            sessionRow = sessionsHistory.Rows.Get(sessionsHistory.Rows.Count()-1);
        }
        if (sessionRow == undefined){
            Message("Not found session");
            return;
        }
        var mdCache = []
        for (var i=0; i<sessionRow.Rows.Count(); i++){
            var md = null;
            currRow = sessionRow.Rows.Get(i);

            if (!mdCache[currRow.rootId]){
                md = mdCache[currRow.rootId];
            }
            if (currRow.rootId.indexOf(metadata.current.rootObject.id)!=-1) md = metadata.current;
            if (md == null){
                isPath = true;
                try {
                    var f = v8New('File', currRow.path);
                    if (!f.Exist())  isPath = false
                } catch (e) {
                    isPath = false;
                }
                if (!isPath)
                    continue;

                stdlib.openFileIn1C(f.FullName);
                
                this.watcher.onTimer(1);

                view = this.wndlist.find;
                for (var vkey in view){
                    var v=view[vkey]
                    if (currRow.rootId == v.rootId){
                        var mdObj = v.view.mdObj;
                        md = mdObj.container;
                        break;
                    }
                }
            }
            if (md==null) {
                continue;
            } else {
                mdCache[currRow.rootId]=md
                var mdObj = this.findMdObj(md, currRow.uuid);
                if (mdObj){
                    n = currRow.prop;
                    if (n =="Форма"){
                        mdObj.openModule(n.toString());
                    } else {
                        mdObj.editProperty(n.toString());
                    }
                    if (currRow.curLine) {
                        //попробуем обойтись без таймера... 
                        twnd = new TextWindow;
                        if (twnd.IsActive()) {
                            twnd.SetCaretPos(currRow.curLine, 2);
                        }
                    }
                }
            }
        }
    },
    findMdObj: function(md, uuid){
        if(uuid == md.rootObject.id)
            return md.rootObject
        return md.findByUUID(uuid);
    },
    saveSession:function(sessionName, views){
        var dateStr = new Date().toLocaleString();
        var sessionRow = undefined;
        //debugger;
        if (sessionName==undefined) sessionName = ""
        if (sessionName.length>0){
            for (var i = 0; i<sessionsHistory.Rows.Count(); i++){
                session  = sessionsHistory.Get(i);
                if (session.Name == sessionName){
                    sessionRow = session;
                    break;
                }
            }
        } else {
            sessionName = "Session "+dateStr;
        }

        if (sessionRow == undefined){
            sessionRow = this.SessionTree.Rows.Add();
            sessionRow.Name = sessionName;
        }
        if (views == undefined){
            //var dictViews = this.walkViews();
            var views = this.wndlist.find;
        }
        for (var key in views){
            
            var item=views[key]
            newRow = sessionRow.Rows.Add();
            newRow.rootId = item.rootId;
            newRow.path = item.path;
            newRow.uuid = item.uuid;
            newRow.prop = item.prop;
            newRow.name = item.name;
            newRow.curLine = item.curLine;
            
        }

        // Не позволяем истории расти более заданной глубины.
        while (this.SessionTree.Rows.Count() > this.form.HistoryDepth){
            currRow = this.SessionTree.Rows.Get(0);
            this.SessionTree.Rows.Delete(currRow);
        }
        this.form.SessionsHistory = ValueToStringInternal(this.SessionTree);
    },
    saveSettings:function(){
        this.form.SessionsHistory = ValueToStringInternal(this.SessionTree);
        this._super();
    },
    beforeExitApp:function(){
        
        this.watcher.onTimer(1);
        this.watcher.stopWatch();

        if (this.form.AutoSave){
            this.saveSession();    
        }

        this.saveSettings();
    },

    expandTree : function (collapse) {
        var tree = this.form.Controls.SessionsList;
        for (var i=0; i < this.form.SessionsList.Rows.Count(); i++)
        {
            var docRow = this.form.SessionsList.Rows.Get(i);

            tree.Expand(docRow, true);
        }
    },

    showSessionsTree: function(){
        var SessionsList = this.form.SessionsList;
        SessionsList.Rows.Clear();
        for (var i = 0; i<this.SessionTree.Rows.Count(); i++){
            var currRow = this.SessionTree.Rows.Get(i);
            var newRow = SessionsList.Rows.Add();
            newRow.name = currRow.name;
            if (currRow.Rows.Count()>0){
                for (var y = 0; y < currRow.Rows.Count(); y++) {
                    listRow =  currRow.Rows.Get(y);
                    newListRow = newRow.Rows.Add();
                    newListRow.name = listRow.name;
                    newListRow.rootId = listRow.rootId;
                    newListRow.path = listRow.path;
                    newListRow.uuid = listRow.uuid;
                    newListRow.prop = listRow.prop; 
                    newListRow.curLine = listRow.curLine; 
                };

            };

        }
        //SessionsList = this.SessionTree;
    },

    Form_OnOpen : function () {
        this.showSessionsTree();
        this.expandTree();

        //his.SetControlsVisible();
    },

    Form_OnClose : function () {
        //debugger;
        this.saveSettings();
    },

    SessionsList_Selection:function(control, selectedRow, selectedCol, defaultHandler){
        defaultHandler.val = false;
        currRow = selectedRow.val;
        if (currRow.Строки.Count()>0){
            this.restoreSession(currRow.Name);
        }
    }, 
    CmdBar_Restore:function(Button){
        if (!this.SessionTree.Rows.Count())
            return;
                          
        var row = this.form.Controls.SessionsList.CurrentRow;
        
        if (!row)
        {
            return
        }
            if (row.Строки.Count()>0){
                this.restoreSession(row.Name);
            }
                 
    }, 

    CmdBar_Delete:function(Button){
        if (!this.SessionTree.Rows.Count())
            return;
                   
        
        var row = this.form.Controls.SessionsList.CurrentRow;
        
        if (!row)
        {
            return
        }
         
            //var name = row.name;
         
                //FIXME: исправить на нормальную функцию. 
                //this.form.SessionsList.Delete(row);
         
                // for (var i = this.SessionTree.Rows.Count() - 1; i >= 0; i--) {
                //     var curRow = this.SessionTree.Rows.Get(i);
         
                //     if (currRow.Name == name){
         
                //         this.SessionTree.Delete(currRow);
                //         break;
                //     }
                // };
                 
    },

    sessionTreeClear:function(){
        this.SessionTree.Rows.Clear();
    }, 
    reloadSettings:function(){
        this.loadSettings();
    }


})

////////////////////////////////////////////////////////////////////////////////////////
////{ SessionManagerSettings - Настройки менеджера сессий. 
////
SessionManagerSettings = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,

    settings : {
        pflBase : {
            'SessionsHistory' : "", //Таблица значений 
            'SassionSaved'    : "",
            'AutoSave'        : false, // Автосохранение сессии.
            'HistoryDepth'    : 15, // Количество элементов истории сессий.
            'AutoRestore'     : true,
            'MarksSave'       : true,
            'MarksRestore'    : true

        }
    },

    construct : function () {

        this._super("scripts\\SessionManager.settings.ssf");

        this.loadSettings();

        SessionManagerSettings._instance = this;

    },
    loadSettings:function(){
        this._super();
        try{
            this.SessionTree = ValueFromStringInternal(this.form.SessionsHistory);
        } catch(e){
            this.SessionTree = v8New("ValueTree");
            this.SessionTree.Columns.Add("Name");
            this.SessionTree.Columns.Add("path");
            this.SessionTree.Columns.Add("uuid");
            this.SessionTree.Columns.Add("prop");
            this.SessionTree.Columns.Add("rootId");
            this.SessionTree.Columns.Add("sortkey");
            this.SessionTree.Columns.Add("curLine");
        }
        
        try{

            this.SessionTree.Columns.Add("curLine");
        } catch(e){  }

    },

    saveSettings:function(){
        this.form.SessionsHistory = ValueToStringInternal(this.SessionTree);
        this._super();
    },

    Ok_Click:function(Button){
        this.saveSettings();
        this.form.Close();
    }, 

    Close_Click:function(Button){
        this.form.Close();
    }

})



////////////////////////////////////////////////////////////////////////////////////////
////{ TextWindowsWatcher - отслеживает активизацию текстовых окон и запоминает последнее.
////

TextWindowsWatcher = stdlib.Class.extend({

    construct : function(wndlist) {
        this.timerId = 0;
        this.lastActiveTextWindow = null;
        if (!wndlist) {
            wndlist = new WndList;
        }
        this.wndlist = wndlist;
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
        
        this.wndlist.removeOldViews();
        this.wndlist.addNewViews(this.getActiveTextWindow());
    }
    
}); // end of TextWindowsWatcher class

//} TextWindowsWatcher 


WndListItem = stdlib.Class.extend(
{
    construct: function(view)
    {
        this.view = view
        this.rowInVt = null
        this.color = 0
        this.makeSortKey();
        this.make();
        this.curLine = 0;
    },
    make:function(){
        var mdObj = this.view.mdObj;
        var mdname = mdObj.container.identifier;
        var mdProp = this.view.mdProp;
        this.rootId = mdObj.container.rootObject.id;
        this.path = mdname.replace(/\*|[|]/g, '');
        this.uuid = mdObj.id;
        this.prop = mdProp.name(1);
        this.name = this.getMdName(mdObj)+(mdProp ? mdProp.name(1) : "");
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
            this.sortkey += this.getMdName(md);
        }
        else    // Дальше пусть идут всякие файлы по алфавиту
            this.sortkey = "4#" + this.view.title
        this.sortkey = this.sortkey.toLowerCase()
    },
    getMdName:function(mdObj)
    {
        if (mdObj.parent && mdObj.parent.mdClass.name(1) != 'Конфигурация')
            return this.getMdName(mdObj.parent) + '.' + mdObj.mdClass.name(1) + ' ' + mdObj.name;
        var cname = mdObj.mdClass.name(1);
        return  (cname ? cname + ' ' : '') + mdObj.name;
    },
    addCurPosition:function(curLine)
    {
        if (this.curLine!=curLine)
            this.curLine = curLine;
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
    removeOldViews: function()
    {
        var removed = false
        for(var i = this.list.length; i--;)
        {
            var item = this.list[i]
            if(!item.isAlive())
            {
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
    addNewViews: function(twnd)
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
                //Нам интеерстны только объекты метаднных, на данном этапе.
                if (v.mdObj && v.mdProp){
                    var item = new WndListItem(v)
                    this.list.push(item)
                    this.find[v.id] = item
                    added = true
                }
            }
            if (twnd!=null){
                twndView = twnd.GetView();
                try {
                    if ((twnd!=null) && (v.id == twndView.id)){
                        item = this.find[v.id];
                        item.addCurPosition(twnd.GetCaretPos().beginRow);
                    }
                } catch (e) {}
                

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
    }
})



////////////////////////////////////////////////////////////////////////////////////////
////{ StartUp
////
function GetSessionManager() {
    if (!SessionManager._instance)
        new SessionManager();

    return SessionManager._instance;
}

function GetSessionManagerSettings() {
    if (!SessionManagerSettings._instance)
        new SessionManagerSettings();

    return SessionManagerSettings._instance;
}

function onTimer(Id) {

    se = GetSessionManager();
    se.restoreSession();
    if (!timerId)
        return;
    killTimer(timerId);
    timerId = 0;
    }

(function(){
    //Подождем 2 секунды пока проинициализируется SciColorer. 
    timerId = createTimer(2000, SelfScript.self, 'onTimer');
})()

events.connect(Designer, "beforeExitApp", GetSessionManager());
////}
