$engine JScript
$uname SciColorerV8Manager
$dname SciColorerV8 Manager

ReadScintillaMessageDefs()

function macros_ПриКликеПоГиперссылке(){ //предопределенная, вызывается при Ctrl+Click на любом идентификаторе в тексте модуля
    addins.byUniqueName("SnegopatMainScript").invokeMacros("ПерейтиКОпределению")
}

function macros_ПриКонтекстномМенюНаНомерахСтрок(){ //предопределенная, вызывается при правом клике на номерах строк
    //addins.byUniqueName("SciColorerV8").invokeMacros("_РазвернутьВсе"); // например
    addins.byUniqueName("SciColorerV8").invokeMacros("_ПоказатьМеню");
}

function macrosОтключитьАвтосравнениеДляТекущегоОкнаОтладка(){
    addins.byUniqueName("SciColorerV8").invokeMacros("_ОтключитьАвтосравнениеДляТекущегоОкна")
}

SelfScript.self['macrosСвернуть или развернуть текущий блок'] = function() {
    addins.byUniqueName("SciColorerV8").invokeMacros("_СвернутьРазвернутьТекущийБлок")
}

SelfScript.self['macrosСвернуть все'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_СвернутьВсе")
}

SelfScript.self['macrosРазвернуть все'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_РазвернутьВсе")
}

SelfScript.self['macrosПрокрутка строки вверх'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_ПрокруткаСтрокиВверх")
}

SelfScript.self['macrosПрокрутка строки вниз'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_ПрокруткаСтрокиВниз")
}

SelfScript.self['macrosСброс модифицированности строк'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_СбросМодифицированныхСтрок")
}

function macrosНастройки(){
    addins.byUniqueName("SciColorerV8").invokeMacros("_Настройки")
}

SelfScript.self['macrosСкрыть\\Показать Scintilla'] = function(){
    addins.byUniqueName("SciColorerV8").invokeMacros("Скрыть")
}

//подробное описание по работе с компонентой Scintilla находится здесь http://www.scintilla.org/ScintillaDoc.html
SelfScript.self['macrosКлонировать текущий блок'] = function()
{
    var hwnd = addins.byUniqueName("SciColorerV8").invokeMacros("_GetActiveScintillaHandle")
    if (hwnd){
        var objColorer = addins.byUniqueName("SciColorerV8").invokeMacros("_GetObject")
        
        var curPos = objColorer.SendSciMessage(hwnd,SCI_GETCURRENTPOS,0,0);
        var curLine = objColorer.SendSciMessage(hwnd,SCI_LINEFROMPOSITION,curPos,0);
        var startLine = curLine;
        if (!(objColorer.SendSciMessage(hwnd,SCI_GETFOLDLEVEL,curLine,0) & SC_FOLDLEVELHEADERFLAG))
            startLine = objColorer.SendSciMessage(hwnd,SCI_GETFOLDPARENT,curLine,0);
        var endLine = objColorer.SendSciMessage(hwnd,SCI_GETLASTCHILD,startLine,-1);
        
        var startPos = objColorer.SendSciMessage(hwnd,SCI_POSITIONFROMLINE,startLine,0);
        var endPos = objColorer.SendSciMessage(hwnd,SCI_GETLINEENDPOSITION,endLine,0);
        
        objColorer.SendSciMessage(hwnd,SCI_SETSEL,startPos,endPos);
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

function ReadScintillaMessageDefs()
{
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
        SelfScript.self[arr[0]] = arr[1]
    }
}