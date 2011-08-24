$engine JScript
$uname scriptdev
$dname Разработка скриптов
                 
/* 
 * Автор: 
 *
 *      Александр Кунташов, kuntashov@compaud.ru
 *
 * Дата создания:
 *
 *      18.08.2011
 * 
 * Описание: 
 *
 *      - Добавляет в контекстное меню окна Снегопата пункт "Редактировать скрипт",
 *      при выборе которого исходный код скрипта открывается в установленном в настройках
 *      текстовом редакторе.
 *
 *      - Отслеживает изменения в открытом на редактирование файле скрипта и автоматически 
 *      перезагружает его, таким образом, изменения, внесенные в скрипт вступают сразу без
 *      необходимости перезагрузки скрипта.
 */

/* **********************************************************
 *  Настройки скрипта.
 * ********************************************************* */

// Интервал проверки редактируемых файлов.
var checkInterval = 2; 

// Список редактируемых файлов скриптов.
var devFiles = new Array();

// Команда для запуска редактора скрипта.
var runEditorCmd = '"D:\\Проекты\\Dropbox\\Apps\\Notepad++Portable\\Notepad++Portable.exe" "%1"';//'notepad.exe "%1"';

/* **********************************************************
 *  Макросы.
 * ********************************************************* */

 function macrosОткрыть()
 {
    Message("Тест");
 }

/* **********************************************************
 *  Реализация функционала скрипта.
 * ********************************************************* */

// Время последней проверки
var lastCheckTime = new Date().getTime() / 1000;

// Подключаем глобальные контексты.
addins.byUniqueName("global").object.connectGlobals(SelfScript);

function Designer::onIdle()
{
    var curTime = new Date().getTime() / 1000;
    if (curTime - lastCheckTime > checkInterval) 
    {
        CheckFiles();
    }
}

function CheckFiles() 
{
    for(var i=0; i<devFiles.length; i++) 
    {
        if (devFiles[i].CheckIfModified())
            devFiles[i].Reload();
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
    if(0 != addinObject.fullPath.indexOf("script:"))
    {
        MessageBox("Это не скрипт");
        return
    }
    var fullPath = GetAddinFilePath(addinObject);
    var command = runEditorCmd.replace(/%1/, fullPath);
    
    devFiles.push(new AddinInfo(addinObject));
    
    ЗапуститьПриложение(command);
}

function InitScriptAndRun()
{
    /* Пока заглушка, настроенная на мое окружение. */
    //runEditorCmd = '"D:\Dropbox\Apps\Notepad++Portable\Notepad++Portable.exe" "%1"';
    //devFiles.push(new AddinInfo("D:\\kuntashov\\Dropbox\\Apps\\Snegopat\\SnegopatRepo\\scripts\\hello.js"));  
    
    var snegopatWnd = addins.byUniqueName("snegopatwnd").object.getSnegopatWnd();
    snegopatWnd.AddContextMenuItem("Редактировать скрипт...", OnSnegopatWndEditScriptMenuItem, "Редактировать файл скрипта в заданном редакторе, с авто-перезагрузкой");
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
    var uniqueName = this.object.uniqueName;
    var displayName = this.object.displayName;
    var loadString = this.object.fullPath;
    var addinGroup = this.object.group;

    try
    {
        addins.unloadAddin(this.object);
    }
    catch(e)
    {
        Message("Ошибка при выгрузке аддина " + displayName + ": " + e.description);
    }
    
    if(!this.object.uniqueName.length)  // аддин реально выгрузился
    {
        try
        {
            addins.loadAddin(loadString, addinGroup);
        }
        catch(e)
        {
            Message("Ошибка при загрузке: " + e.description);
        }
    }
    
    delete this.object;

    // Надо найти новый объект аддина по его имени и запомнить:
    this.object = addins.byUniqueName(uniqueName);
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
 *  Инициализация скрипта.
 * ********************************************************* */

 InitScriptAndRun();
