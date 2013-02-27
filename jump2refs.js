$engine JScript
$uname jump2refs
$dname Переход к ссылкам метаданных
$addin global
$addin stdlib
$addin stdcommands

global.connectGlobals(SelfScript);
stdlib.require("SelectValueDialog.js", SelfScript);

var refs, lastObjects = [];

SelfScript.self['macrosПерейти к ссылке ИЗ'] = function ()
{
    return doJump(stdcommands.Frntend.FindRefsFrom);
}

SelfScript.self['macrosПерейти к ссылке НА'] = function ()
{
    return doJump(stdcommands.Frntend.MDSearchRefs);
}

SelfScript.self['macrosПерейти обратно'] = function ()
{
    if(!lastObjects.length)
        return false
    lastObjects.pop().activateInTree()
    return true
}

function onMessage(params)
{
    refs.push(params.text)
    params.cancel = true
}

function onDoModal(dlgInfo)
{
    dlgInfo.cancel = true
    dlgInfo.result = mbaOK
}

function findObject(root, name)
{
    //Message(name)
    var names = name.split(".")
    for(var idx = 0; idx < names.length; idx += 2)
    {
        var mdc = root.mdclass
        for(var i = 0, c = mdc.childsClassesCount; i < c; i++)
        {
            var cc = mdc.childClassAt(i)
            if(cc.name(1, false) == names[idx]){
                root = root.childObject(i, names[idx + 1])
                break
            }
        }
    }
    return root
}

function doJump(command)
{
    // Для начала проверим, что мы в окне метаданных
    var view = windows.getActiveView()
    var state = command.getState(view)
    if(!state || !state.enabled)
        return false
    refs = []
    // Ставим перехват на вывод в окно сообщений
    events.connect(Designer, "onMessage", SelfScript.self)
    // Подавляем показ диалога
    events.connect(windows, "onDoModal", SelfScript.self)
    command.sendToView(view)
    events.disconnect(Designer, "onMessage", SelfScript.self)
    events.disconnect(windows, "onDoModal", SelfScript.self)
    //Message(refs[0]);
    var choice
    if(refs.length < 2)
    {
        MessageBox("Ссылок нет")
        return false
    }
    var rootObject = view.mdObj.container.rootObject
    lastObjects.push(findObject(rootObject, refs[0].match(/"(.+)"/)[1]))
    
    if(refs.length == 2)
        choice = refs[1]
    else
    {
        refs.splice(0, 1)
        var dlg = new SelectValueDialog("Выберите объект для перехода!", refs);
        if (dlg.selectValue())
            choice = dlg.selectedValue;
        else
            return false
    }
    var mdObj = findObject(rootObject, choice)
    mdObj.activateInTree()
    return true
}

//{ Горячие клавиши по умолчанию.
function getPredefinedHotkeys(predef) {
    predef.setVersion(1);
    predef.add('Перейти к ссылке ИЗ', "Ctrl + Enter");
    predef.add('Перейти обратно', "Ctrl + Shift + Enter");
}
//} Горячие клавиши по умолчанию.
