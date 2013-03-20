$engine JScript
$uname SciColorerV8Manager
$dname SciColorerV8 Manager

var addinSciColorerV8 = 0;
var objectSciColorerV8 = 0;
InitAddin()

function macros_ПриКликеПоГиперссылке(){ //предопределенная, вызывается при Ctrl+Click на любом идентификаторе в тексте модуля
    addins.byUniqueName("SnegopatMainScript").invokeMacros("ПерейтиКОпределению")
}

function macros_ПриКонтекстномМенюНаНомерахСтрок(){ //предопределенная, вызывается при правом клике на номерах строк
    addinSciColorerV8.invokeMacros("_ПоказатьМеню");
}

function macrosОтключитьАвтосравнениеДляТекущегоОкнаОтладка(){
    addinSciColorerV8.invokeMacros("_ОтключитьАвтосравнениеДляТекущегоОкна")
}

SelfScript.self['macrosСвернуть или развернуть текущий блок'] = function() {
    addinSciColorerV8.invokeMacros("_СвернутьРазвернутьТекущийБлок")
}

SelfScript.self['macrosСвернуть все'] = function()
{
    addinSciColorerV8.invokeMacros("_СвернутьВсе")
}

SelfScript.self['macrosРазвернуть все'] = function()
{
    addinSciColorerV8.invokeMacros("_РазвернутьВсе")
}

SelfScript.self['macrosПрокрутка строки вверх'] = function()
{
    addinSciColorerV8.invokeMacros("_ПрокруткаСтрокиВверх")
}

SelfScript.self['macrosПрокрутка строки вниз'] = function()
{
    addinSciColorerV8.invokeMacros("_ПрокруткаСтрокиВниз")
}

SelfScript.self['macrosСброс модифицированности строк'] = function()
{
    addinSciColorerV8.invokeMacros("_СбросМодифицированныхСтрок")
}

function macrosНастройки(){
    addinSciColorerV8.invokeMacros("_Настройки")
}

SelfScript.self['macrosСкрыть\\Показать Scintilla'] = function(){
    addinSciColorerV8.invokeMacros("_Скрыть")
}

//подробное описание по работе с компонентой Scintilla находится здесь http://www.scintilla.org/ScintillaDoc.html
SelfScript.self['macrosКлонировать текущий блок'] = function()
{
    var hwnd = getActiveScintillaHandle()
    if (hwnd){
        var curPos = SendSciMessage(hwnd,SCI_GETCURRENTPOS);
        var curLine = SendSciMessage(hwnd,SCI_LINEFROMPOSITION,curPos);
        var startLine = curLine;
        if (!(SendSciMessage(hwnd,SCI_GETFOLDLEVEL,curLine) & SC_FOLDLEVELHEADERFLAG))
            startLine = SendSciMessage(hwnd,SCI_GETFOLDPARENT,curLine);
        var endLine = SendSciMessage(hwnd,SCI_GETLASTCHILD,startLine,-1);
        var startPos = SendSciMessage(hwnd,SCI_POSITIONFROMLINE,startLine);
        var endPos = SendSciMessage(hwnd,SCI_GETLINEENDPOSITION,endLine);
        SendSciMessage(hwnd,SCI_SETSEL,startPos,endPos);
        addins.byUniqueName("textEditorExt").invokeMacros("КлонироватьТекст")
    }
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(3)
    predef.add("Свернуть или развернуть текущий блок", "Ctrl + NumAdd")
    predef.add("Свернуть или развернуть текущий блок", "Ctrl + Num-")
    predef.add("Развернуть все", "Ctrl + Shift + NumAdd")
    predef.add("Свернуть все", "Ctrl + Shift + Num-")
    predef.add("Прокрутка строки вверх", "Ctrl + Up")
    predef.add("Прокрутка строки вниз", "Ctrl + Down")
}

function InitAddin()
{
    addinSciColorerV8 = addins.byUniqueName("SciColorerV8");
    if (!addinSciColorerV8) {
        MessageBox("SciColorerV8Manager: Ошибка инициализации, не найден загруженный аддин SciColorerV8!");
        return;
    }
    objectSciColorerV8 = addinSciColorerV8.invokeMacros("_GetObject");
    var msgFile = v8New("ТекстовыйДокумент")
    var path = SelfScript.fullPath.replace(/^script:/i,'').replace(/SciColorerV8Manager.js$/i,'SciMessages.inl')
    try{
        msgFile.Прочитать(path)
    }catch(e){
        MessageBox("SciColorerV8: Ошибка чтения файла определений " + path + "\n" + e.description)
        return
    }
    for(i=1;i<=msgFile.КоличествоСтрок();i++){
        var curLine = msgFile.ПолучитьСтроку(i);
        var arr = curLine.split(" ")
        SelfScript.self[arr[0]] = parseInt(arr[1])
    }
}

function getActiveScintillaHandle(){
    return addinSciColorerV8.invokeMacros("_GetActiveScintillaHandle");
}

function SendSciMessage(hwnd,msg){
    var wparam = (arguments.length > 2) ? arguments[2] : 0;
    var lparam = (arguments.length > 3) ? arguments[3] : 0;
    return objectSciColorerV8.SendSciMessage(hwnd,msg,wparam,lparam);
}

events.connect(snegopat, "onProcessTemplate", SelfScript.self)

// Функции для фикса положения каретки после вставки шаблона
// При вставке шаблона вычисляем, куда будет вставллена каретка,
// подписываемся на onIdle и там устанавливаем ее куда надо
var fix
function onProcessTemplate(param)
{
    var caretPos = param.text.indexOf("<?>")
    if(-1 == caretPos)
        caretPos = param.text.length
    var tw = Snegopat.activeTextWindow()
    if(tw)
    {
        fix =  {line: 0, col: 0}    // Вычисляем смещение позиции вставки каретки в строках и колонках
        for(var i = 0; i < caretPos; i++)
        {
            if('\n' == param.text.charAt(i))
            {
                fix.line++;
                fix.col = 1
            }
            else
                fix.col++
        }
        events.connect(Designer, "onIdle", SelfScript.self)
    }
}
function onIdle()
{
    var tw = Snegopat.activeTextWindow()
    if(tw && fix)
    {
        // Ставим каретку куда надо
        var sel = tw.getSelection()
        tw.setCaretPos(sel.beginRow + fix.line, fix.line ? fix.col : sel.beginCol + fix.col)
    }
    // Отписываемся от события
    events.disconnect(Designer, "onIdle", SelfScript.self)
}
