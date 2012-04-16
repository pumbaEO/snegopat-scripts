$engine JScript
$uname choiceHelpTopic
$dname Выбрать главу справки

// (c) Александр Орефков
// Скрипт позволяет быстрее выбрать нужную главу справки, когда одному слову
// соответствует несколько разделов

try{

var wrap = new ActiveXObject("DynamicWrapperX")
wrap.Register("USER32.DLL", "GetWindowRect", "i=lp", "r=l")
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
                if(wrap)
                {
                    var Rect = wrap.Space(16)
                    var pStr = wrap.StrPtr(Rect)
                    wrap.GetWindowRect(dlgInfo.form.getControl(-1).hwnd, Rect)
                    var left = wrap.NumGet(pStr, 0, "l")
                    var top = wrap.NumGet(pStr, 4, "l")
                    var right = wrap.NumGet(pStr, 8, "l")
                    var bottom = wrap.NumGet(pStr, 12, "l")
                }
                else
                {
                    var left = 100
                    var top = 300;
                    var right = 900;
                    var bottom = 700;
                }
                var choice = sel.FilterValue(choices.join("\r\n"), 1 | 8 | 32, 'Выберите главу', left - 10, top - 20, right - left + 20, bottom - top + 40)
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

