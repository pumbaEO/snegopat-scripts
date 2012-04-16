$engine JScript
$uname choiceHelpTopic
$dname Выбрать главу справки
$addin stdlib

// (c) Александр Орефков
// Скрипт позволяет быстрее выбрать нужную главу справки, когда одному слову
// соответствует несколько разделов

try{
var api = stdlib.require("winapi.js")
var sel = new ActiveXObject('Svcsvc.Service')
events.connect(windows, "onDoModal", SelfScript.self)
}catch(e)
{
    Message("choiceHelpTopic.js: ошибка при инициализации. " + e.description)
    //addins.unloadAddin(addins.byUniqueName(SelfScript.uniqueName))
}

function onDoModal(dlgInfo)
{
    if(dlgInfo.caption == "Выбор главы")
    {
        if(dlgInfo.stage == openModalWnd)
        {
            var vt = dlgInfo.form.getControl("tblTopics").value
            if(vt.Count() > 3)
            {
                var choices = []
                for(var rows = new Enumerator(vt); !rows.atEnd(); rows.moveNext())
                    choices.push(rows.item().Get(0))
                //debugger
                var rect = api.GetWindowRect(dlgInfo.form.getControl(-1).hwnd)
                var choice = sel.FilterValue(choices.join("\r\n"), 1 | 8 | 32, 'Выберите главу', rect.left - 10, rect.top - 20, rect.width() + 20, rect.height() + 40)
                if(choice.length)
                {
                    var sk = ""
                    for(var k in choices)
                    {
                        if(choices[k] == choice)
                            break
                        sk += "{DOWN}"
                    }
                    new ActiveXObject("WScript.Shell").SendKeys(sk + "~")
                }
            }
        }
    }
}

