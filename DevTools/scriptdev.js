$engine JScript
$uname scriptdev
$dname Разработка скриптов
$addin global
$addin stdlib
$addin stdcommands
$addin snegopatwnd

/* Скрипт-помощник для разработчиков скриптов для Снегопата.
 * Автор        : Александр Кунташов, kuntashov@compaud.ru
 * Дата создания: 18.08.2011
 * Описание: 
 *      - Добавляет в контекстное меню окна Снегопата пункт "Редактировать скрипт",
 *      при выборе которого исходный код скрипта открывается в установленном в настройках
 *      текстовом редакторе.
 *
 *      - Отслеживает изменения в открытом на редактирование файле скрипта и автоматически 
 *      перезагружает его, таким образом, изменения, внесенные в скрипт вступают сразу без
 *      необходимости перезагрузки скрипта.
 */

stdlib.require("jshint.js", SelfScript);
stdlib.require("TextWindow.js", SelfScript);
stdlib.require("SelectValueDialog.js", SelfScript);

/* **********************************************************
 *  Настройки скрипта по умолчанию.
 * ********************************************************* */
 
// Интервал проверки редактируемых файлов.
var checkInterval = 2; 

// Спрашивать перед перезагрузкой.
var askBeforeReload = true;

// Команда для запуска редактора скрипта.
var runEditorCmd = "notepad.exe \"%1\"";

/* **********************************************************
 *  Макросы.
 * ********************************************************* */

function macrosНастройка()
{
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    // Обработку событий формы привяжем к самому скрипту
    form = loadScriptForm(pathToForm, SelfScript.self);
    form.checkInterval = checkInterval;
    form.askBeforeReload = askBeforeReload;
    form.runEditorCmd = runEditorCmd;
    form.ОткрытьМодально();
    form = null;
}

function macrosСформироватьКодОбработчиковФормыНаJavaScript() {

    var w = stdlib.require('TextWindow.js').GetTextWindow();
    if (!w) return;
    
    // Если есть выделение - используем его, иначе конвертируем весь модуль.
    var codeToConvert = w.GetSelectedText();
    
    if (codeToConvert == "")
        codeToConvert = w.GetText();
        
    var className = snegopat.parseTemplateString('<?"Укажите имя класса (если не задано - создаются функции скрипта)">');
        
    var jsCode = codeToConvert;
    
    var rep = className ? className + ".prototype.$1 = function ($2) {" : "function $1 ($2) {";
    
    jsCode = jsCode.replace(/Процедура\s+([\wА-я\d_]+)\s*\((.*?)\)/ig, rep);
    jsCode = jsCode.replace(/КонецПроцедуры/ig, "}");
    
    stdcommands.Frntend.ClearMessageWindow.send(); // Очистить окно сообщений.
    Message(jsCode);
    
    return true;
}
 
function macrosПерезагрузитьТекущийСкрипт() {
    
    var w = stdlib.require('TextWindow.js').GetTextWindow();
    if (!w) return;
    
    var view = w.GetView();
    if (!view) return;
    
    var doc = view.getDocument();
    if (doc.isModified || doc.path.match(/^\s*$/)) {
    	var answer = (new QueryDialogEx("Скрипт был изменен и перед [пере]загрузкой будет записан. Продолжить?")).Show();
    	if (answer == QueryDialogEx.ReturnCodes.No) {
    		return;
    	}
    	stdcommands.Frame.FileSave.send();
    }
    
    var fullpath = 'script:' + doc.path.replace(/^file:\/\//i, '').replace(/\//g, '\\');
    
    var addinGroup = addins.byUniqueName('SnegopatMainScript').object.AddinsTreeGroups.UserAddins;
    
    var scriptAddin	= addins.byFullPath(fullpath);
    if (scriptAddin) {    	
    	addinGroup = scriptAddin.group;
    	addins.unloadAddin(scriptAddin);
    }
    addins.loadAddin(fullpath, addinGroup);
    Message("Скрипт " + fullpath + " перезагружен!");
}

function macrosСохранитьСкриптЗаменивПробелыНаТабуляцию() {
    var w = stdlib.require('TextWindow.js').GetTextWindow();
    if (!w) return;
    var sel = w.GetCaretPos();
    var teExt = stdlib.require(stdlib.getSnegopatMainFolder() + 'scripts\\textEditorExt.js');
    stdcommands.Frame.SelectAll.send();
    teExt.replaceTabsToSpacesInSelectedText(true);
    stdcommands.Frame.FileSave.send();
    w.SetCaretPos(sel.beginRow - 15, sel.beginCol);
    w.SetCaretPos(sel.beginRow, sel.beginCol);
}

function macrosСохранитьСкриптЗаменитьТабуляциюПерезагрузить() {
    macrosСохранитьСкриптЗаменивПробелыНаТабуляцию();
    macrosПерезагрузитьТекущийСкрипт();
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

 
/* **********************************************************
 *  Реализация функционала скрипта.
 * ********************************************************* */

// Пути хранения настроек скрипта в профайле.
var pflPaths = {
    checkInterval : 'scriptdev/checkInterval',
    runEditorCmd: 'scriptdev/runCmdEditor',
    askBeforeReload: 'scriptdev/askBeforeReload'
};
  
// Список редактируемых файлов скриптов.
var devFiles = v8New("Структура");

// Время последней проверки
var lastCheckTime = new Date().getTime() / 1000;

// Подключаем глобальные контексты.
//global.connectGlobals(SelfScript);
addins.byUniqueName("global").object.connectGlobals(SelfScript);

events.connect(Designer, "onIdle", SelfScript.self)
function onIdle()
{
    var curTime = new Date().getTime() / 1000;
    if (curTime - lastCheckTime > checkInterval) 
    {
        CheckFiles();
    }
}

function QueryDialogEx(question, needYesNoToAll) 
{ 
    this.question = question;
    this.needYesNoToAll = needYesNoToAll;
}
  
QueryDialogEx.ReturnCodes = {
    'Yes'       : 'Да',
    'YesToAll'  : 'Да для всех',
    'No'        : 'Нет',
    'NoToAll'   : 'Нет для всех'
}

QueryDialogEx.prototype.Show = function()
{
    // Кнопки диалога Вопрос.
    var buttons = v8New("СписокЗначений");
    
    buttons.Добавить(QueryDialogEx.ReturnCodes.Yes);
    buttons.Добавить(QueryDialogEx.ReturnCodes.No);
    
    if (this.needYesNoToAll)
    {
        buttons.Вставить(2, QueryDialogEx.ReturnCodes.YesToAll);
        buttons.Добавить(QueryDialogEx.ReturnCodes.NoToAll);                
    }
    
    return Вопрос(this.question, buttons);      
}

function CheckFiles() 
{
    var scriptsToReload = new Array();
    
    for(var addins=new Enumerator(devFiles); !addins.atEnd(); addins.moveNext()) 
    {
        var aInfo = addins.item().Значение;
        if (aInfo.CheckIfModified())
            scriptsToReload.push(aInfo);
    }
    
    var needToAsk = askBeforeReload;
    var doReload = !askBeforeReload;
    var needYesNoToAll = (scriptsToReload.length > 1);
    
    for(var i=0; i<scriptsToReload.length; i++)
    {
        var s = scriptsToReload[i];
        
        if (needToAsk)
        {
            var msg = "Скрипт \"" + s.object.displayName 
                    + "\" (" + s.object.uniqueName + ") был изменен.\n"
                    + "Перезагрузить скрипт?";
                    
            var answer = (new QueryDialogEx(msg, needYesNoToAll)).Show();
            
            doReload = (answer == QueryDialogEx.ReturnCodes.Yes || answer == QueryDialogEx.ReturnCodes.YesToAll);
            needToAsk = (answer == QueryDialogEx.ReturnCodes.Yes || answer == QueryDialogEx.ReturnCodes.No);
        }
        
        if (doReload)
            s.Reload();
    }
}

function getModificationStamp(f) 
{
    if (f.Существует())
    {
        return new Date(f.ПолучитьВремяИзменения()).getTime(); 
    }

    return null;
}

function OnSnegopatWndEditScriptMenuItem(currentRow)
{
    var isAddin = currentRow.Picture != 0;
    
    if (!isAddin) 
        return;
    
    var addinObject = currentRow.object;
    if (0 != addinObject.fullPath.indexOf("script:"))
    {
        MessageBox("Это не скрипт");
        return;
    }
    
    if (addinObject.uniqueName == SelfScript.uniqueName) 
    {
        MessageBox("Скрипт \"Разработка скриптов\" нельзя использовать для отладки самого себя!");
        return;
    }
    
    var fullPath = GetAddinFilePath(addinObject);
    var command = runEditorCmd.replace(/%1/, fullPath);
        
    if (!devFiles.Свойство(addinObject.uniqueName))
        devFiles.Вставить(addinObject.uniqueName, new AddinInfo(addinObject));
    
    ЗапуститьПриложение(command);
}

function InitScriptAndRun()
{    
    // Проинициализируем настройки скрипта...
    profileRoot.createValue(pflPaths.checkInterval, checkInterval, pflSnegopat)
    profileRoot.createValue(pflPaths.runEditorCmd, runEditorCmd, pflSnegopat)    
    profileRoot.createValue(pflPaths.askBeforeReload, askBeforeReload, pflSnegopat)    
    
    // ...и прочитаем их:
    checkInterval = profileRoot.getValue(pflPaths.checkInterval);
    runEditorCmd = profileRoot.getValue(pflPaths.runEditorCmd);
    askBeforeReload = profileRoot.getValue(pflPaths.askBeforeReload);
    
    // Внедряемся в контекстное меню окна Снегопата.
    with (snegopatwnd.getSnegopatWnd())
        AddContextMenuItem("Редактировать скрипт...", OnSnegopatWndEditScriptMenuItem, 
            "Редактировать файл скрипта в заданном редакторе, с авто-перезагрузкой");
}

function GetAddinFilePath(addinObject)
{
    return addinObject.fullPath.replace(/^\w+:/,'');
}

/* **********************************************************
 *  Класс AddinInfo. Хранит информацию о редактируемом аддине.
 * ********************************************************* */
function AddinInfo(addinObject) 
{
    this.object = addinObject;
    this.file = v8New("Файл", GetAddinFilePath(addinObject));
    
    this.lastModified = getModificationStamp(this.file);
}

AddinInfo.prototype.Reload = function()
{
    var oldInstance = this.object;
    
    var uniqueName = oldInstance.uniqueName;
    var displayName = oldInstance.displayName;
    var loadString = oldInstance.fullPath;
    var addinGroup = oldInstance.group;

    try
    {
        addins.unloadAddin(oldInstance);
    }
    catch(e)
    {
        Message("Ошибка при выгрузке аддина " + displayName + ": " + e.description);
    }
    
    if(!oldInstance.uniqueName.length)  // аддин реально выгрузился
    {
        try
        {
            this.object = addins.loadAddin(loadString, addinGroup);
        }
        catch(e)
        {
            Message("Ошибка при загрузке: " + e.description);
        }
    }
    
    delete oldInstance;

    // Надо найти новый объект аддина по его имени и запомнить:
    //this.object = addins.byUniqueName(uniqueName);
}

AddinInfo.prototype.CheckIfModified = function()
{
    var curStamp = getModificationStamp(this.file);
    if (curStamp != this.lastModified) 
    {
        this.lastModified = curStamp;
        return true;
    }

    return false;
}

/* **********************************************************
 *  Обработчики событий ЭУ формы настройки скрипта.
 * ********************************************************* */

function ОКНажатие(Элемент)
 {
    if (checkInterval != form.checkInterval)
    {
        checkInterval = form.checkIterval;
        profileRoot.setValue(pflPaths.checkIterval, checkInterval);           
    }
    
    if (runEditorCmd != form.runEditorCmd)
    {
        runEditorCmd = form.runEditorCmd;
        profileRoot.setValue(pflPaths.runEditorCmd, runEditorCmd);           
    }

    if (askBeforeReload != form.askBeforeReload)
    {
        askBeforeReload = form.askBeforeReload;
        profileRoot.setValue(pflPaths.askBeforeReload, askBeforeReload);           
    }
    

    form.Закрыть();
 }
 
function runEditorCmdНачалоВыбора(Элемент, СтандартнаяОбработка)
{
    СтандартнаяОбработка.val = false;
    
    var selDlg = v8New("ДиалогВыбораФайла", v8New("ПеречислениеРежимДиалогаВыбораФайла").Открытие);
    selDlg.Заголовок = "Выберите исполняемый файл редактора/IDE";
    selDlg.ПолноеИмяФайла = "";
    selDlg.ПредварительныйПросмотр = false;
    selDlg.Фильтр = "Исполняемые файлы (*.exe)|*.exe|Все файлы|*";

    if (selDlg.Выбрать())
    {
        form.runEditorCmd = selDlg.ПолноеИмяФайла;
        if (form.runEditorCmd.match(/exe$/)) 
            form.runEditorCmd += ' "%1"';
    }    
}

function lbScriptAboutНажатие()
{
    ЗапуститьПриложение("http://snegopat.ru/scripts/wiki?name=DevTools/scriptdev.js");
}

////////////////////////////////////////////////////////////////////////////////////////
//// Поддержка проверки синтаксиса скриптов (JSHint)
//// 

function macrosПроверитьСкрипт() {

    var errCount = 0,
        scr = new ScriptWindow();

    if (!scr.IsScript()) {
    	stdcommands.Frntend.SyntaxCheck.send();
        return;
    }

    if (!JSHINT(scr.GetCodeLines())) {
        if (JSHINT.errors.length) {
            var offset = scr.GetCodeStartLine();
            for (var i=0; i<JSHINT.errors.length; i++) {
                if (JSHINT.errors[i]) {
                    errCount++;
                    showError(scr, JSHINT.errors[i], offset);
                }
            }
        }        
    }	
    
    if (errCount === 0) {
        Message("Синтаксических ошибок не обнаружено!");
    }         
    
    return true;   
}

function macrosПоказатьСписокМетодовСкрипта() {

   var errCount = 0,
        scr = new ScriptWindow(),
        data = null,
        vlFuncs = v8New('ValueList');

    if (!scr.IsScript()) {
    	snegopat.showMethodsList();
        return;
    }

    JSHINT(scr.GetCodeLines());
    
	JSHINT.data().functions.forEach(function(func) {
		vlFuncs.Add(func, func.name.replace(/^\"(.+?)\"$/, "$1"));
	});
	
	var dlg = new SelectValueDialog("Выберите метод", vlFuncs);
	if (dlg.selectValue()) {
		scr.SetCaretPos(dlg.selectedValue.line + scr.GetCodeStartLine(), 1);
	}
	
	return true;
}

ScriptWindow = TextWindow.extend({

    construct: function() {
        this._super();		
    },
    
    IsScript: function() {
    	if (this.IsActive()) {
    		var view = this.GetView();
 			if (view) {
 				var doc = view.getDocument();
 				if (doc) {
 					if (doc.path.match(/\.(js|vbs)$/i)) {
 						return true;
 					}
 				}
 			}
	        var lines = this.GetLines();
	        return lines.length && lines[0].match(/^\$/);
    	}
    	return false;
    },
    
    GetCodeStartLine: function() {	
        var start = 0,
            lines = this.GetLines();
            
        while (start < lines.length) {
            if (!lines[start].match(/^\$/) && 
                !lines[start].match(/^\s*$/)) {
                break;
            }
            start++;
        }			
        return start;
    },
    
    GetCodeLines : function() {
        return this.GetLines().slice(this.GetCodeStartLine());
    }
    
});

function showError(tw, e, offset) {	
    
    var evidence = '';
    
    /* Формат вывода ошибки как в 1С:
            {Где}: Что
            часть строки с ошибкой<<?>>	
        <<?>> - маркер позиции, в котором произошла ошибка.	
    */
    
    if (e.evidence) { 
        evidence = "\n" + e.evidence;
    }
    Message("{" + e.line + "} " + e.reason + evidence, mExc2, 
    	function (o) {o.w.SetCaretPos(o.r, o.c);}, 
    	{w:tw, r:e.line + offset, c:e.character}
    );
}

//// 
//// Поддержка проверки синтаксиса скриптов (JSHint)
////////////////////////////////////////////////////////////////////////////////////////

/* **********************************************************
 *  Инициализация скрипта.
 * ********************************************************* */

 InitScriptAndRun();

function macrostestThrow()
{
    throw "exception"
}
