$engine JScript
$uname std-templates
$dname Авто-подключение шаблонов
$addin global
$addin stdcommands


/* (c) Александр Орефков
 * Скрипт предназначен для людей "в поле", часто работающих за чужим компом.
 * При запуске автоматически подключает файлы шаблонов, расположенные в каталоге скрипта,
 * а также в КаталогСнегопата\templates\
 * Разделение по двум каталогам из-за того, что в этом каталоге лежат "общие", публичные
 * шаблоны, под версионным контролем общего репозитария скриптов, а в КаталогСнегопата\templates\
 * можно разместить свои личные шаблоны.
 */

global.connectGlobals(SelfScript)
var profilePath = "TxtEdt/AutoPlacementFilesRU1"

function updateTemplates()
{
    var templates = getCurrentTemplates()
    processTemplateFolder(templates, profileRoot.getValue("Snegopat/MainFolder") + "templates\\")
    processTemplateFolder(templates, SelfScript.fullPath.replace(/\\[^\\]+$/, '\\'))
    if(templates.needUpdate)
    {
        // Сформируем строку для записи в настройки
        var str = '{' + templates.files.length + ',\n'
        for(var k in templates.files)
            str += '{"' + templates.files[k] + '",0}' + (k == templates.files.length - 1 ? '' : ',') + '\n'
        str += '}'
        profileRoot.setValue(profilePath, str)
        // Теперь надо сделать, чтобы настройки применились.
        // Для этого надо открыть настройки шаблонов (при этом диалог считает новое значение из настроек)
        // и нажать в нем Ок после открытия.
        var v = findTemplatesView()
        events.connect(windows, "onDoModal", SelfScript.self)
        stdcommands.TextEdit.ConfigTemplateFiles.sendToView(v.view)
        if(v.wasOpened)
            v.view.close()
        events.disconnect(windows, "onDoModal", SelfScript.self)
        Message("Подключены шаблоны", mInfo)
        if(v.prevView)
            v.prevView.activate()
    }
}

function getCurrentTemplates()
{
    var result = {files: [], keys: {}, needUpdate: false}
    // Прочитаем список файлов из настроек
    var currentTemplatesInProfile = profileRoot.getValue(profilePath)
    var re = /\{"(.*)",0\}/g
    while(re.exec(currentTemplatesInProfile))
    {
        result.files.push(RegExp.$1)
        result.keys[RegExp.$1.toLowerCase()] = 1
    }
    return result
}

function processTemplateFolder(templates, path)
{
	for(var filesArray = new Enumerator(НайтиФайлы(path, "*.st", true)); !filesArray.atEnd(); filesArray.moveNext())
	{
		var file = filesArray.item();
		var fn = "file://" + file.ПолноеИмя.toLowerCase().replace(/\\/g, '/')
		if(!file.ЭтоКаталог() && !templates.keys.hasOwnProperty(fn))
		{
		    templates.files.push(fn)
		    templates.keys[fn] = 1
		    templates.needUpdate = true
		}
	}
}

function findTemplatesView()
{
    var result = {view: null, wasOpened: false, prevView: windows.getActiveView()}
    function forall(view)
    {
        //if(view.title == "Шаблоны текста")
        if(stdcommands.TextEdit.ConfigTemplateFiles.getState(view))
            return view
        var childs = view.enumChilds()
        for(var i = 0; i < childs.count; i++)
        {
            var found = forall(childs.item(i))
            if(found)
                return found
        }
        return null
    }
    result.view = forall(windows.mainView)
    if(!result.view)
    {
        stdcommands.TextEdit.Templates.send()
        result.view = windows.getFocusedView()
        result.wasOpened = true
    }
    return result
}

function onDoModal(dlgInfo)
{
    if(dlgInfo.stage == openModalWnd && dlgInfo.caption == "Настройка шаблонов")
        new ActiveXObject("WScript.Shell").SendKeys('~')
}

function macrosОбновитьСписокШаблонов()
{
    updateTemplates()
}

updateTemplates()
