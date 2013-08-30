$engine JScript
$uname DebugTrace
$dname Трассировка кода 
$addin stdcommands
$addin global
$addin stdlib
$addin hotkeys

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт- трассировка кода для проекта "Снегопат"
////
//// Описание: Ставим две точки останова, запускаем скрипт и он сам нажимает F11 и в дерево пишет 
////    порядок вызова процедур и функций, можно посмотреть , что же выполняется по факту от начала и до конца 
////    процедуры или функции
////
//// Автор Сосна Евгений <shenja@sosna.zp.ua>
////}
////////////////////////////////////////////////////////////////////////////////////////


stdlib.require('TextWindow.js', SelfScript);
stdlib.require("SelectValueDialog.js", SelfScript);
stdlib.require('SyntaxAnalysis.js', SelfScript);

global.connectGlobals(SelfScript)

stdlib.require('ScriptForm.js', SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosНачать трасировку'] = function() {
    var sm = GetDebugTracer();
    sm.startDebuging();
    return true;
}


SelfScript.self['macrosПоказать дерево вызовов'] = function() {
    var sm = GetDebugTracer();
    sm.showStructure();
    return true;
}

SelfScript.self['macrosОтменить трассировку'] = function() {
    var sm = GetDebugTracer();
    sm.stopTrace();
    return true;
}

SelfScript.self['macrosСтоп автопереходы'] = function() {
    var sm = GetDebugTracer();
    sm.form.AutoJump = false;
    return true;
}

SelfScript.self['macrosСтарт автопереходы'] = function() {
    var sm = GetDebugTracer();
    sm.form.AutoJump = true;
    return true;
}

SelfScript.self['macrosПереключить признак показа формы'] = function() {
    var sm = GetDebugTracer();
    sm.form.ShowForm = !sm.form.ShowForm;
    return true;
}

// SelfScript.self['macrosВосстановить последнюю сессию'] = function() {
//     var sm = GetSessionManager();
//     sm.restoreSession("");
//     return true;
// }

// SelfScript.self['macrosОткрыть открыть список сохраненных сессий'] = function() {
//     var sm = GetSessionManager();
//     sm.show();
//     return true;
// }
// SelfScript.self['macrosОчистить всю историю'] = function() {

//     var sm = GetSessionManager();
//     sm.sessionTreeClear();
//     return true;
// }

// SelfScript.self['macrosОткрыть настройку'] = function() {

//     var sms = GetSessionManagerSettings();
//     sms.show(true);
//     sms = null;
//     var sm = GetSessionManager();
//     sm.reloadSettings();
//     return true;
// }


/* Возвращает название макроса по умолчанию - вызывается, когда пользователь
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Начать трасировку';
}

////} Макросы

////////////////////////////////////////////////////////////////////////////////////////
////{ DebugTracer - Расширенный поиск в тексте модуля.
////
DebugTracer = ScriptForm.extend({

    settingsRootPath : SelfScript.uniqueName,

     settings : {
         "pflBase" : {
             'AutoJump' : true, //Таблица значений 
             'ShowForm' : true
    //         'AutoSave'        : true, // Автосохранение сессии.
    //         'HistoryDepth'    : 15, // Количество элементов истории сессий.
    //         'AutoRestore'     : true,
    //         'MarksSave'       : true,
    //         'MarksRestore'    : true,
    //         'ColorSaved'      : v8New("Цвет", 229, 229, 229)

          }
        },

    construct : function (isExtend) {

        if (isExtend == undefined) isExtend = false;
        this._super("scripts\\DebugTrace.ssf");

        this.form.КлючСохраненияПоложенияОкна = "DebugTrace.js";
        //this.tree = this.form.TraceTree;
        this.tree = this.form.Controls.TraceTree.Value;
        // this.tree.Columns.Add("MdObject");
        // this.tree.Columns.Add("procName");
        // this.tree.Columns.Add("prop");
        // this.tree.Columns.add("uuid");
        // this.tree.Columns.Add("rootId");
        // this.tree.Columns.Add("root")
        // this.tree.Columns.Add("path");

        this.currRow = null;
        this.curSyntaxAnalysis = null;
        this.curMdObject = '';
        this.trace = false;
        this.firstEvent = false;
        
        this.stopUuid = '';
        this.stopLine = 0;
        
        this.watcher = new TextWindowsWatcher(this.wndlist);
        this.watcher.startWatch();
        
        this.timer = new TimerExpressionUpdater(this);
        //debugger;
        this.loadSettings();

        if (!isExtend) DebugTracer._instance = this;

    },
    loadSettings:function(){
        this._super();
    },

    onDebugEvent:function(eventID, eventParam){

        if(eventID == "{FE7C6DDD-7C99-42F8-BA14-CDD3XEDF2EF1}")
        {
            //form.Open() // Покажем окно
            //Начало трассировки
            Message("Начало трассировки"+eventID + "param:"+eventParam);
        }
        else if(eventID == "{71501A9D-CD34-427D-81B6-562491BEF945}")
        {
            //КонецТрассировки.
            //clearExpressions()
        }
        else if(eventID == "{5B5F928D-DF2D-4804-B2D0-B453163A2C4C}")
        {
            //Message("param:"+eventParam);
            if (!this.trace)
                return;

            if(eventParam == 37 || eventParam == 24 )    // Остановились в точке останова
            {
                //needTestModified = true
                //fillLocalVariables()    // Заполним локальные переменные
                //events.connect(Designer, "onIdle", SelfScript.self) // Будем их обновлять
                //form.Открыть()
                
                //Message("eventParam "+eventParam);
                //if (!this.isDebugEvalEnabled()){
                //    Message('not enabled');
                //    return
                //}

                    
                
                if (eventParam == 24 ){
                    this.firstEvent = true;
                    //Message('param ');
                    this.parseCurLine();
                } else {
                    if (!this.firstEvent) {
                        this.parseCurLine();
                    }
                    this.firstEvent = false;
                }
            }
        } else {

            //Message("Неизвестный "+eventID + "param:"+eventParam);   
        }

    },

    isDebugEvalEnabled:function(){
            // Команда "Шагнуть в" неактивна - значит, мы не в останове. Считать переменные нельзя, возможен вылет
            var state = stdcommands.CDebug.StepIn.getState()
            return state && state.enabled
    },

    parseCurLine:function(){
        
        //stdcommands.CDebug.CurrentLine.send();
        
        var wnd = GetTextWindow();
        if(!wnd){
            return;

        }
            
        view = wnd.GetView();
        var uuid = '';
        if (!view){
        } else {
            if (view.mdObj && view.mdProp) {
                
                function getMdName(mdObj) {                             
                    if (mdObj.parent && mdObj.parent.mdClass.name(1) != 'Конфигурация')
                        return getMdName(mdObj.parent) + '.' + mdObj.mdClass.name(1) + ' ' + mdObj.name;
                    var cname = mdObj.mdClass.name(1);
                    return  (cname ? cname + '.' : '') + mdObj.name;
                }
                title = getMdName(view.mdObj) + ': ' + view.mdProp.name(1);
                uuid = view.mdObj.id;
                if (title != this.curMdObject)
                    this.curSyntaxAnalysis = null;
                    this.curMdObject = title;
            }
        }    

        var pos = wnd.GetCaretPos();
        if (uuid == this.stopUuid && pos.beginRow == this.stopLine) {
            
            this.trace = false;
            this.timer.stopWatch();
        } else {
            if (this.form.AutoJump){
                this.timer.updateTimer();    
            }
            
            //stdlib.setTimeout(function(){ stdcommands.CDebug.StepIn.send() }, 500);
        }
        
        if (!this.curSyntaxAnalysis || !view){
            var mod = SyntaxAnalysis.AnalyseTextDocument(wnd);
            this.curSyntaxAnalysis = mod;
        } else {
            var mod = this.curSyntaxAnalysis;
        }
        var meth = mod.getActiveLineMethod()
        if (!meth){
            return;
        }

        var curLine = wnd.GetLine(pos.beginRow).toLowerCase();

        if (!this.currRow || ( this.currRow.MdObject != this.curMdObject || this.currRow.procName != meth.Name)){
            if (!this.currRow) {
                this.currRow = this.tree.Rows.Add();
            } else {
                this.currRow = this.currRow.Rows.Add();    
            }
            //this.currRow = !this.currRow ?this.tree.Rows.Add() : this.currRow.Rows.Add();
            this.currRow.procName = meth.Name;
            this.currRow.MdObject = this.curMdObject;
            this.currRow.uuid = uuid;
            if (this.curMdObject.length>0){
                //debugger;
                var re = new RegExp("([А-яA-z]{1,})\.(.{1,}):\\s([А-яA-z]{1,})", "gi");
                //var re = /(.{1,})\\s([А-яA-z]{1,}):\\s([А-яA-z]{1,})/gi
                var matches = this.curMdObject.match(re);
                if (matches && matches.length)
                {
                    this.currRow.prop = matches[3];
                    this.currRow.root = matches[1];
                    this.currRow.path = matches[2];
                }
                
                
            this.showResult(this.currRow);
            }
        }

        var pos = wnd.GetCaretPos();
        var curLine = wnd.GetLine(pos.beginRow).toLowerCase();
        if (pos.beginRow == meth.EndLine+1) {
            if (!this.currRow.Parent) {
                this.currRow = null;
                Message("Пошли дальше чем планировали.");
                //return;
            } else {
                this.currRow = this.currRow.Parent;
            }
            
        }
        
    },

    startDebuging:function(runToEnd){
        
        if (!this.isDebugEvalEnabled()){
            Message("Мы сейчас не в режиме отладки. ");
            return;
        }
        var wnd = GetTextWindow();
        if(!wnd)
            return
        view = wnd.GetView();
        var uuid = '';
        if (!view){ 
            Message("Не найденно текущее окно");
            return;
        }
        
        if (!runToEnd) {
            var pos = wnd.GetCaretPos();
            var curLine = wnd.GetLine(pos.beginRow).toLowerCase()
            curLine  = curLine.replace(/^\s+|\s+$/g, '');
            //FIXME: задай вопрос пользователю. 
            if (curLine.length > 0) {
                this.stopUuid = view.mdObj.id;
                this.stopLine = pos.beginRow;
            } else {
                Message('Строка пустая, тут не остановимся, поэтому отмена');
                return;
            }
        
        } else {
            var mod = SyntaxAnalysis.AnalyseTextDocument(wnd);
            this.curSyntaxAnalysis = mod;

            var meth = mod.getActiveLineMethod()
            if (!meth){
                return;
            }
            this.stopUuid = views.mdObj.id;
            this.stopLine = meth.EndLine + 1;
            
        }
        
        this.trace = true;
        this.tree.Rows.Clear();
        this.currRow = null;
        //this.currRow = this.tree.Rows.Add();
        events.connect(v8debug, "onDebugEvent", this);
        hotkeys.AddHotKey("Ctrl+Shift+BkSpace", "DebugTrace", "Отменить трассировку");
        stdcommands.CDebug.CurrentLine.send();
        //debugger;
        this.parseCurLine();
        

    },

    showStructure:function(){
        //debugger;
        //var row = this.tree.ChooseRow();
        this.show();
    },

    stopTrace:function(){
    
        this.trace = false;
        events.disconnect(v8debug, "onDebugEvent", this);
        for(var i = 0; i < HotKeys.count; i++)
        {
            var hk = HotKeys.item(i);
            Команда = hk.addin + "::" + hk.macros
            if (Команда.indexOf("DebugTrace::Отменить трассировку")!=-1){
                try {
                    HotKeys.remove(i);
                } catch (e) {}
            }
        }
    },

    showResult:function(docRow){
        
        if (this.form.ShowForm){
            this.show();
        }
        this.form.CurrentControl=this.form.Controls.TraceTree;
        this.expandTree(false);
        this.form.Controls.TraceTree.CurrentRow = docRow;            
    },

    expandTree : function (collapse) {
        var tree = this.form.Controls.TraceTree;
        for (var i=0; i < this.tree.Rows.Count(); i++)
        {        
            var docRow = this.tree.Rows.Get(i);
            tree.Expand(docRow, true);
            //if (this.form.TreeView)
            //{
                for (var j=0; j < docRow.Rows.Count(); j++)
                {
                    var row = docRow.Rows.Get(j);
                    tree.Expand(row, true);
                    
                }
            
        }
    }
    // autoRestoreSession:function(sessionName){
    //     if (!this.form.AutoRestore) {
    //         return;
    //     }
    //     this.restoreSession(sessionName);
    // },

    // restoreSession:function(sessionName, table){

    //     if (table==undefined) table = 'SessionsHistory';
    //     var sessionsHistory = this.sessions[table];
        
    //     if (sessionsHistory.Rows.Count()==0){
    //         return ;
    //     }

    //     if (sessionName==undefined) sessionName = ""


    //     if (sessionName.length>0){
    //         for (var i = 0; i<sessionsHistory.Rows.Count(); i++){
    //             session  = sessionsHistory.Rows.Get(i);
    //             if (session.Name == sessionName){
    //                 sessionRow = session;
    //                 break;
    //             }
    //         }
    //     } else {
    //         sessionRow = sessionsHistory.Rows.Get(sessionsHistory.Rows.Count()-1);
    //     }
    //     if (sessionRow == undefined){
    //         Message("Not found session");
    //         return;
    //     }
    //     var mdCache = []
    //     for (var i=0; i<sessionRow.Rows.Count(); i++){
    //         var md = null;
    //         currRow = sessionRow.Rows.Get(i);

    //         if (!mdCache[currRow.rootId]){
    //             md = mdCache[currRow.rootId];
    //         }
    //         if (currRow.rootId.indexOf(metadata.current.rootObject.id)!=-1) md = metadata.current;
    //         if (md == null){
    //             isPath = true;
    //             try {
    //                 var f = v8New('File', currRow.path);
    //                 if (!f.Exist())  isPath = false
    //             } catch (e) {
    //                 isPath = false;
    //             }
    //             if (!isPath)
    //                 continue;

    //             stdlib.openFileIn1C(f.FullName);
                
    //             this.watcher.onTimer(1);

    //             view = this.wndlist.find;
    //             for (var vkey in view){
    //                 var v=view[vkey]
    //                 if (currRow.rootId == v.rootId){
    //                     var mdObj = v.view.mdObj;
    //                     md = mdObj.container;
    //                     break;
    //                 }
    //             }
    //         }
    //         if (md==null) {
    //             continue;
    //         } else {
    //             mdCache[currRow.rootId]=md
    //             var mdObj = this.findMdObj(md, currRow.uuid);
    //             if (mdObj){
    //                 n = currRow.prop;
    //                 try{
    //                     text = '1';
    //                     if (n =="Форма"){
    //                         mdObj.openModule(n.toString());
    //                     } else {
    //                         text = mdObj.getModuleText(n.toString());
    //                         mdObj.editProperty(n.toString());
    //                     }
    //                     if (currRow.curLine && text.length>0) {
    //                         //попробуем обойтись без таймера... 
    //                         twnd = new TextWindow;
    //                         if (twnd.IsActive()) {
    //                             twnd.SetCaretPos(currRow.curLine, 1);
    //                             //Запишем установленную позицию курсора. 
    //                             var activeView = windows.getActiveView();
    //                             if(!this.wndlist.find.hasOwnProperty(activeView.id))
    //                                 {
                                        
    //                                     if (activeView.mdObj && activeView.mdProp){
    //                                         var item = new WndListItem(activeView);
    //                                         item.addCurPosition(currRow.curLine);
    //                                         this.wndlist.list.push(item);
    //                                         this.wndlist.find[activeView.id] = item;
    //                                     }
    //                                 }
    //                         }
    //                     }    

    //                 } catch(e){
    //                     Message("Не удалось восстановить окно "+currRow.name+" prop:"+currRow.prop+" error:"+e.description);
    //                 }

    //             }
    //         }
    //     }
    //     //Попробуем рецепт от Орефкова, по максимизации окон. 
    //     var activeView = windows.getActiveView();
    //     if (!activeView){
    //         return
    //     }
    //     try {
    //         activeView.sendCommand("{c9d3c390-1eb4-11d5-bf52-0050bae2bc79}", 7);
    //     } catch (e) {}
        
    // },
    // findMdObj: function(md, uuid){
    //     if(uuid == md.rootObject.id)
    //         return md.rootObject
    //     return md.findByUUID(uuid);
    // },
    // saveSession:function(sessionName, views, table){
    //     var dateStr = new Date().toLocaleString();
    //     var sessionRow = undefined;
    //     if (table==undefined) table = 'SessionsHistory';
    //     var sessionsHistory = this.sessions[table];
    //     //debugger;
    //     if (sessionName==undefined) sessionName = ""
    //     if (sessionName.length>0){
    //         for (var i = 0; i<sessionsHistory.Rows.Count(); i++){
    //             session  = sessionsHistory.Rows.Get(i);
    //             if (session.Name == sessionName){
    //                 //sessionRow = session;
    //                 sessionsHistory.Rows.Delete(session)
    //                 break;
    //             }
    //         }
    //     } else {
    //         sessionName = "Session "+dateStr;
    //     }

    //     //if (sessionRow == undefined){
    //         sessionRow = sessionsHistory.Rows.Add();
    //         sessionRow.Name = sessionName;
    //     //}
    //     if (views == undefined){
    //         //var dictViews = this.walkViews();
    //         var views = this.wndlist.find;
    //     } else {
    //         find = {};
    //         var wndlist = this.wndlist.find;
    //         for (var idx in views){
    //             view = views[idx];
    //             var id = view.view.id;
    //             if (wndlist.hasOwnProperty(id)){
    //                 find[id]=wndlist[id];
    //             }
    //         }
    //         var views = find;

    //     }
    //     for (var key in views){
            
    //         var item=views[key]
    //         newRow = sessionRow.Rows.Add();
    //         newRow.rootId = item.rootId;
    //         newRow.path = item.path;
    //         newRow.uuid = item.uuid;
    //         newRow.prop = item.prop;
    //         newRow.name = item.name;
    //         newRow.curLine = item.curLine;
            
    //     }

    //     // Не позволяем истории расти более заданной глубины.
    //     if (table=="SessionsHistory"){
    //         while (this.SessionTree.Rows.Count() > this.form.HistoryDepth){
    //             currRow = this.SessionTree.Rows.Get(0);
    //             this.SessionTree.Rows.Delete(currRow);
    //         }    
    //     }
    //     if (!sessionRow.Rows.Count()){
    //         sessionsHistory.Rows.Delete(sessionRow);
    //     }
        
    //     //this.form.SessionsHistory = ValueToStringInternal(this.SessionTree);

    // },
    // saveSettings:function(){
    //     this.form.SessionsHistory = ValueToStringInternal(this.SessionTree);
    //     this.form.SessionSaved = ValueToStringInternal(this.constantSessionTree);
    //     this._super();
    // },
    // beforeExitApp:function(){
        
    //     this.watcher.onTimer(1);
    //     this.watcher.stopWatch();

    //     if (this.form.AutoSave){
    //         this.saveSession();    
    //     }

    //     this.saveSettings();
    // },

    // expandTree : function (collapse) {
    //     var tree = this.form.Controls.SessionsList;
    //     for (var i=0; i < this.form.SessionsList.Rows.Count(); i++)
    //     {
    //         var docRow = this.form.SessionsList.Rows.Get(i);
    //         collapse ? tree.Collapse(docRow) : tree.Expand(docRow, true);            
    //         //tree.Expand(docRow, true);
    //     }
    // },

    // showSessionsTree: function(table){
        
    //     for (var i = 0; i<this.sessions[table].Rows.Count(); i++){
    //         var currRow = this.sessions[table].Rows.Get(i);
    //         var newRow = this.sessionsList.Rows.Add();
    //         newRow.name = currRow.name;
    //         newRow.RowType = table;
    //         newRow._object = currRow;
    //         if (currRow.Rows.Count()>0){
    //             for (var y = 0; y < currRow.Rows.Count(); y++) {
    //                 listRow =  currRow.Rows.Get(y);
    //                 newListRow = newRow.Rows.Add();
    //                 newListRow.name = listRow.name;
    //                 newListRow.rootId = listRow.rootId;
    //                 newListRow.path = listRow.path;
    //                 newListRow.uuid = listRow.uuid;
    //                 newListRow.prop = listRow.prop; 
    //                 newListRow.curLine = listRow.curLine; 
    //             };

    //         };

    //     }
    //     this.expandTree(true);
        
    // },

    // Form_OnOpen : function () {
    //     this.sessionsList.Rows.Clear();
    //     this.showSessionsTree("SessionsHistory");
    //     this.showSessionsTree("SessionSaved");

    // },

    // Form_OnClose : function () {
    //     this.saveSettings();
    // },

    // SessionsList_Selection:function(control, selectedRow, selectedCol, defaultHandler){
    //     defaultHandler.val = false;
    //     currRow = selectedRow.val;

    //     if (currRow.Строки.Count()>0){
    //         this.restoreSession(currRow.Name, currRow.RowType);
    //     }
    // }, 
    // CmdBar_Restore:function(Button){

    //     for(var rows = new Enumerator(this.form.Controls.SessionsList.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext()){
    //         var item = rows.item();
    //         var currRow = item._object;
    //         if (!currRow){
    //             continue;
    //         }
    //         if (!currRow.Rows.Count())
    //             continue;
            
    //         this.restoreSession(currRow.Name, item.RowType);

    //     }
    // }, 

    // CmdBar_Delete:function(Button){
        
    //     for(var rows = new Enumerator(this.form.Controls.SessionsList.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext()){
    //         var item = rows.item();
    //         var currRow = item._object;
    //         if (!currRow){
    //             continue;
    //         }
    //         this.sessions[item.RowType].Rows.Delete(currRow);
    //     }
    //     this.sessionsList.Rows.Clear();
    //     this.showSessionsTree("SessionsHistory");
    //     this.showSessionsTree("SessionSaved");
        

    // },
    // CmdBar_SaveToFile:function(Button){
    //     Message("Еще не реализованно!");
    // },

    // CmdBar_RestoreFromFile:function(Button){
    //     Message("Еще не реализованно!");
    // },

    // CmdBar_ChangeRowType:function(Button){
    //     var values = v8New('СписокЗначений');
    //     values.Add("SessionSaved", 'Постоянное хранение');
    //     values.Add("SessionsHistory", 'Автоочищаемое хранение');
    //     var dlg = new SelectValueDialog("Выберите сессию", values);
    //     if (!dlg.selectValue()) {
    //         return;
    //     }
    
    //     var table = dlg.selectedValue;
    //     for(var rows = new Enumerator(this.form.Controls.SessionsList.ВыделенныеСтроки); !rows.atEnd(); rows.moveNext()){
    //         var item = rows.item();
    //         var currRow = item._object;
    //         if (!currRow)
    //             continue;
    //         if (item.RowType!=table){
    //             var newRow = this.sessions[table].Rows.Add();
    //             newRow.Name = item.Name;
    //             if (item.Rows.Count()>0){
    //                 for (var y = 0; y < item.Rows.Count(); y++) {
    //                     listRow =  item.Rows.Get(y);
    //                     newListRow = newRow.Rows.Add();
    //                     newListRow.name = listRow.name;
    //                     newListRow.rootId = listRow.rootId;
    //                     newListRow.path = listRow.path;
    //                     newListRow.uuid = listRow.uuid;
    //                     newListRow.prop = listRow.prop; 
    //                     newListRow.curLine = listRow.curLine; 
    //                 };
    //             };
    //             this.sessions[item.RowType].Rows.Delete(currRow);
    //             item._object = newRow;
    //         }

    //     }
    // },

    // CmdBar_Rename:function(Button){
    //     var Rows = this.form.Controls.SessionsList.ВыделенныеСтроки;
    //     if (!Rows.Count() || Rows.Count()>1) {
    //         Message("Необходимо выбрать одну строку верхнего уровня");
    //         return;
    //     }
    //     var item = Rows.Get(0);
    //     var currRow = item._object;
    //     if (!currRow){
    //         return;
    //     }
    //     var vbs = addins.byUniqueName("vbs").object
    //     vbs.var0 = currRow.Name; vbs.var1 = "Введите наименование "; vbs.var2 = 0, vbs.var3 = false;
    //     if (vbs.DoEval("InputString(var0, var1, var2, var3)")) {
    //         var message  = vbs.var0;
    //         if (message!=currRow.Name){
    //             currRow.Name = message;
    //             item.Name = message;
    //         }
    //     }
    // },

    // CmdBar_ExpandAll : function (Button) {
    //     this.expandTree(false);
    // },
    
    // CmdBar_CollapseAll : function (Button) {
    //     this.expandTree(true);
    // },

    // SessionsList_OnRowOutput : function (Control, RowAppearance, RowData) {
    //     var RowType = RowData.val.RowType;
    //     if (RowType=="SessionSaved"){
    //         RowAppearance.val.Cells.Name.ЦветФона = this.form.ColorSaved;
    //     }
    // },
    

    // sessionTreeClear:function(){
    //     this.SessionTree.Rows.Clear();
    // }, 

    // reloadSettings:function(){
        
    //     this.loadSettings();
    // },

    // choiceSessionName:function(){

    //     var values = v8New('СписокЗначений');
    //     for (var i=0; i<this.sessions['SessionSaved'].Rows.Count(); i++){
    //         var currRow=this.sessions['SessionSaved'].Rows.Get(i);
    //         values.Add(i, ''+currRow.Name);
    //     }

    //     values.Add("add", 'Добавить и ввести новое имя сессии');

    //     var dlg = new SelectValueDialog("Выберите сессию", values);
    //     if (dlg.selectValue()) {
    //         if (dlg.selectedValue=="add"){
    //             var vbs = addins.byUniqueName("vbs").object
    //             vbs.var0 = ""; vbs.var1 = "Введите наименование "; vbs.var2 = 0, vbs.var3 = false;
    //             if (vbs.DoEval("InputString(var0, var1, var2, var3)")) {
    //                 var message  = vbs.var0;
    //                 var name = message;
    //             }
    //         } else {
    //             var currRow = this.sessions['SessionSaved'].Rows.Get(dlg.selectedValue);
    //             var name = currRow.Name;
    //         }
    //         return (name.length>0)?name:null
    //     }
    //     return null;
    // }


})

////////////////////////////////////////////////////////////////////////////////////////
////{ SessionManagerSettings - Настройки менеджера сессий. 
////
// DebugTracerSettings = ScriptForm.extend({

//     settingsRootPath : SelfScript.uniqueName,

//     settings : {
//         "pflBase" : {
//             'SessionsHistory' : "", //Таблица значений 
//             'SessionSaved'    : "",
//             'AutoSave'        : false, // Автосохранение сессии.
//             'HistoryDepth'    : 15, // Количество элементов истории сессий.
//             'AutoRestore'     : true,
//             'MarksSave'       : true,
//             'MarksRestore'    : true,
//             'ColorSaved'      : v8New("Цвет", 229, 229, 229)

//         }
//     },

//     construct : function () {

//         this._super("scripts\\SessionManager.settings.ssf");

//         this.loadSettings();

//         SessionManagerSettings._instance = this;

//     },
//     loadSettings:function(){
//         this._super();
//         try{
//             this.SessionTree = ValueFromStringInternal(this.form.SessionsHistory);
//         } catch(e){
//             this.SessionTree = v8New("ValueTree");
//             this.SessionTree.Columns.Add("Name");
//             this.SessionTree.Columns.Add("path");
//             this.SessionTree.Columns.Add("uuid");
//             this.SessionTree.Columns.Add("prop");
//             this.SessionTree.Columns.Add("rootId");
//             this.SessionTree.Columns.Add("sortkey");
//             this.SessionTree.Columns.Add("curLine");
//         }
        
//         try{

//             this.SessionTree.Columns.Add("curLine");
//         } catch(e){  }

//     },

//     saveSettings:function(){
//         this.form.SessionsHistory = ValueToStringInternal(this.SessionTree);
//         this._super();
//     },

//     Ok_Click:function(Button){
//         this.saveSettings();
//         this.form.Close();
//     }, 

//     Close_Click:function(Button){
//         this.form.Close();
//     }

// })



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
        this.oldActiveViewId = 0;
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
        var activeView = windows.getActiveView();
        if (!activeView){
            return
        }
        if (activeView.id == this.oldActiveViewId){
            return;
        }
        this.oldActiveViewId = activeView.id;

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

////////////////////////////////////////////////////////////////////////////////////////
////{ TimerExpressionUpdater - переодически обновляем значения переменных
////

TimerExpressionUpdater = stdlib.Class.extend({

    construct : function(obj) {
        this.timerId = 0;
        this.obj = obj;
        //this.startWatch();
    },

    updateTimer: function(){
        this.stopWatch();
        this.startWatch()
    },

    startWatch : function () {
        if (this.timerId)
            this.stopWatch();
        this.timerId = createTimer(200, this, 'onTimer');
    },

    stopWatch : function () {
        if (!this.timerId)
            return;
        killTimer(this.timerId);
        this.timerId = 0;
    },

    onTimer : function (timerId) {
        //if(!this.obj.isDebugEvalEnabled()){
            //Message('stop');
        //    this.stopWatch();
        //    return;
        //}
        //Message('on timer');
        stdcommands.CDebug.StepIn.send();
        
        this.stopWatch();
    }
    
}); // end of TimerExpressionUpdater class

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
            //this.list.sort(function(i1, i2){return i1.sortkey.localeCompare(i2.sortkey)})
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
function GetDebugTracer() {
    if (!DebugTracer._instance)
        new DebugTracer();

    return DebugTracer._instance;
}


// FirstRunSession = stdlib.Class.extend({
//     construct: function()
//     {
//         this.isModal = false;
//         this.timerCount = 0;
//         this.timerId = 0;
//         this.isFirstMessage = true;
//         this.startWatch();
//     }, 

//     onDoModal: function(dlgInfo){
//         if(dlgInfo.stage == beforeDoModal){
//             this.isModal = true;
//         }
//         else if (dlgInfo.stage == afterDoModal) {
//             this.isModal = false;
//             if (!this.timerId){
//                 //Подождем 2 секунды пока проинициализируется SciColorer. 
//                 this.timerId = createTimer(2000, this, 'onTimer');        
//             }
//         } 
//     }, 

//     disconnectOnModal: function() {
//         try {
//             events.disconnect(windows, "onDoModal", this);
//         } catch (e) { }
//     }, 

//     onTimer:function (Id) {

//         se = GetSessionManager();
//         if (this.isModal) {
//             if (windows.modalMode == msNone)
//                 this.isModal = false;
//         }
//         if (!this.isModal){
//             se.autoRestoreSession();    
//             this.disconnectOnModal();
//         } 
//         else if (this.isFirstMessage) {
//             //Сообщим полезную информацию. 
//             try {
//                 var notify = stdlib.require("NotifySend.js").GetNotifySend();
//                 notify.Info("Менеджер сессий ждет...", "Открыто модальное окошко,\n как закроешь, запусти вручную восстановление сессии! \n \(если само не восстановиться \)", 5);
//                 notify = null;        
//             } catch(e){}
//             this.isFirstMessage = false;
            
//         }
//         if (!this.timerId)
//             return;
//         killTimer(this.timerId);
//         this.timerId = 0;
//         this.timerCount++;
//         if (this.timerCount>3){
//             this.disconnectOnModal();
//         }
//     },

//     startWatch:function(){
//         // Подцепляемся к событию показа модальных окон. Если со временем появится событие подключения к хранилищу,
//         // то надо будет делать это в том событии, и после отключаться от перехвата модальных окон.
//         events.connect(windows, "onDoModal", this);
//         //Подождем 2 секунды пока проинициализируется SciColorer. 
//         this.timerId = createTimer(2000, this, 'onTimer');

//     }
// })

// var first = new FirstRunSession();

// events.connect(Designer, "beforeExitApp", GetSessionManager());
////}

function hookBpList(dlgInfo)
{
    if(dlgInfo.stage == openModalWnd)
    {
        var bp = dlgInfo.form.getControl("BpGrid").value
        for(var rows = new Enumerator(bp); !rows.atEnd(); rows.moveNext())
        {
            Message("breakpoint:")
            var row = rows.item();
            for(var cols = new Enumerator(bp.Columns), i = 0; !cols.atEnd(); cols.moveNext())
            {
                var col = cols.item();
                Message("  " + col.Name + ": " + row.Get(i))
                i++
            }
        }
        dlgInfo.cancel = true;
        dlgInfo.result = mbaCancel;
    }
}

function macrosВывестиСписокТочекОстанова()
{
    events.connect(windows, "onDoModal", SelfScript.self, "hookBpList")
    stdcommands.CDebug.BrkptList.send()
    events.disconnect(windows, "onDoModal", SelfScript.self, "hookBpList")
}
