$engine JScript
$uname debugHelpers
$dname Отладчик:Вспомогательные команды
$addin stdcommands
$addin stdlib
$addin global

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Отладчик: вспомогательные команды" (debugHelpers.js) для проекта "Снегопат"
////
//// Описание: Добавляет возможность вызова консоли запросов для отладки запроса и 
//// некоторые другие макросы, повышающие удобство использования штатного отладчика.
////
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}

stdlib.require('SettingsManagement.js', SelfScript);

global.connectGlobals(SelfScript);

var settings; // Хранит настройки скрипта (экземпляр SettingsManager'а).

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

/* Открыть запрос в переменной под курсором в консоли запросов из отладчика. */
SelfScript.Self['macrosОтладить запрос модально'] = function () {
    openQueryConsole(true);
}

/* Открыть запрос в переменной под курсором в консоли запросов из отладчика. */
SelfScript.Self['macrosОтладить запрос не модально'] = function () {
    openQueryConsole(false);
}

/* Позволяет включать/выключать режим остановки по ошибке в отладчике по горячей клавише. */
SelfScript.Self['macrosВключить/выключить остановку по ошибке'] = function () {
    SelfScript.Self['StopOnErrorOpenedByMacros'] = true;
    stdcommands.CDebug.BreakOnError.send();
}

/* Установить точку останова, предварительно удалив все другие. */
SelfScript.Self['macrosУстановить точку останова и удалить все другие'] =  function () {
    stdcommands.CDebug.BrkptDel.send();
    stdcommands.CDebug.Brkpt.send();
}

SelfScript.Self['macrosНастройка'] = function () {
    var dsForm = new DebugHelperSettingsForm(settings);
    dsForm.ShowDialog();
}

function getDefaultMacros() {
    return "Настройка";
}

////} Макросы

// Обработчик показа модальных окон.
function onDoModal(dlgInfo) {

    if (dlgInfo.caption == "Остановка по ошибке" && dlgInfo.stage == openModalWnd) 
    {       
        if (SelfScript.Self['StopOnErrorOpenedByMacros']) 
        {
            dlgInfo.form.getControl("CheckBox_StopOnError").Value = !dlgInfo.form.getControl("CheckBox_StopOnError").Value;
            dlgInfo.result = 1; // Нажимаем "Ок".
            dlgInfo.cancel = true; // Окно показывать не надо.
        
            SelfScript.Self['StopOnErrorOpenedByMacros'] = undefined;
        }
    }    
    else if (dlgInfo.caption == "Выражение" && dlgInfo.stage == openModalWnd) 
    {
        if (SelfScript.Self['RunQueryConsoleCommand']) 
        {
            var params = SelfScript.Self['RunQueryConsoleCommand'];         
            delete SelfScript.Self['RunQueryConsoleCommand'];
            
            var exprCtrl = dlgInfo.form.getControl('Expression');
            if (!exprCtrl.value.match(/^\s*$/)) 
            {            
                exprCtrl.value = 'ВнешниеОбработки.Создать("' + params.path + '").Отладить(' + exprCtrl.value + ', ' + (params.doModal ? 'Истина' :  'Ложь') + ')';

                var wsh = new ActiveXObject("WScript.Shell");
                
                // Посылаем нажатие Enter, чтобы отработало событие "ПриИзменении" поля ввода выражения.
                setTimeout(function () { 
                    wsh.SendKeys("{END} {ENTER}");
                    if (!params.doModal)
                        wsh.SendKeys("%{F4}{F5}");
                        
                }, 1000);
                                    
            }
                                
        }        
    }
}

function setTimeout(func, delay) {

    function DelayedFunc(func) {
        this.timerId = 0;
        this.func = func;
        this.callDelayed = function () {
            killTimer(this.timerId);
            this.func.call(null);
        }
    }

    var df = new DelayedFunc(func);
    df.timerId = createTimer(delay, df, 'callDelayed');
    
}

function fileExists(path) {

    if (path) 
    {
        var f = v8New('File', path);
        return f.IsFile() && f.Exist();
    }
    
    return false;
}

function getAbsolutePath(path) {

    // Путь относительный?
    if (path.match(/^\.{1,2}[\/\\]/))
    {
        // Относительные пути должны задаваться относительно главного каталога Снегопата.
        var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
        return mainFolder + path;
    }
    
    return path;
}

function openQueryConsole(doModal) {

    var path = getAbsolutePath(settings.current.QueryConsolePath);
        
    if (!fileExists(path))
    {
        DoMessageBox('Путь к обработке КонсольЗапросов не задан. Укажите путь в диалоге настроек скрипта.');
        
        var dsForm = new DebugHelperSettingsForm(settings);
        if (!dsForm.ShowDialog())
        {
            Message('Консоль не будет открыта, т.к. путь к консоли не задан, либо файла по указанному пути не существует!');
            return;
        }
    }
    
    SelfScript.Self['RunQueryConsoleCommand'] = { 'path': path, 'doModal': doModal };
    stdcommands.CDebug.EvalExpr.send();
}

////////////////////////////////////////////////////////////////////////////////////////
////{ Форма настройки скрипта - DebugHelperSettingsForm
////

function DebugHelperSettingsForm(settings) {
    this.settings = settings;
    this.form = loadScriptForm("scripts\\debugHelpers.settings.ssf", this);
}

DebugHelperSettingsForm.prototype.ShowDialog = function () {
    return this.form.DoModal();
}

DebugHelperSettingsForm.prototype.saveSettings = function () {

    var path = getAbsolutePath(this.form.QueryConsolePath);
    Message("path: " + path);
    if (!fileExists(path))
    {
        DoMessageBox('Указанный файл не существует! Настройки не могут быть сохранены.');
        return;
    }
    
    this.settings.ReadFromForm(this.form);
    this.settings.SaveSettings();
}

DebugHelperSettingsForm.prototype.QueryConsolePathStartChoice = function (Элемент, СтандартнаяОбработка) {
	// Вставить содержимое обработчика.
}

DebugHelperSettingsForm.prototype.CmdBarOK = function (Кнопка) {
    if (this.saveSettings())
        this.form.Close(true);
}

DebugHelperSettingsForm.prototype.CmdBarSave = function (Кнопка) {
	this.saveSettings();
}

DebugHelperSettingsForm.prototype.OnOpen = function () {
	this.settings.ApplyToForm(this.form);
}

DebugHelperSettingsForm.prototype.BeforeClose = function (Cancel, DefaultHandler) {
    
    if (this.form.Modified)
    {
        var answer = DoQueryBox("Настройки были изменены! Сохранить настройки?", QuestionDialogMode.YesNoCancel);
        switch (answer)
        {
        case DialogReturnCode.Yes:
            DefaultHandler.val = false;
            if (this.saveSettings())
                this.form.Close(true);
            break;
            
        case DialogReturnCode.No:
            DefaultHandler.val = false;
            this.form.Close(false);
            break;
            
        case DialogReturnCode.Cancel:
            Cancel.val = true;
            break;
        }
    }
}

////
////} Форма настройки скрипта - DebugHelperSettingsForm
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
////{ Start up
////

settings = SettingsManagement.CreateManager('debugHelpers', { 'QueryConsolePath': '' })
settings.LoadSettings();

events.connect(windows, "onDoModal", SelfScript.Self)

////
////} Start up
////////////////////////////////////////////////////////////////////////////////////////
