$engine JScript
$uname ModuleComment
$dname Описание модуля
$addin global
$addin stdlib

stdlib.require("TextWindow.js", SelfScript);
global.connectGlobals(SelfScript);

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Заголовок общего модуля" (ModuleComment.js) для проекта "Снегопат"
////
//// Описание: Выводит заголовок модуля с его описанием и сведениями об авторе 
////
//// Автор: Сухих В.Ю. по мотивам скрипта author.js Александра Кунташова
////                                      <kuntashov@gmail.com>, http://compaud.ru/blog
//// 29.03.2012 Список отображаемых в форме конфигураций настраивается в Списке значений дляКонфигурации
////              для включения возможности удалите комментарии "//ft"
////}
////////////////////////////////////////////////////////////////////////////////////////
var doOK = false;
//ft var дляКонфигурации = v8New("СписокЗначений");
//ft    дляКонфигурации.Add(             "АСБНУ 1.3"            );
//ft    дляКонфигурации.Add(             "ЗУП 2.5.48"           );
//ft    дляКонфигурации.Add(             "УПП 1.2 (рзп)"        );
//ft    дляКонфигурации.Add(             "УАТ"                  );
//ft    дляКонфигурации.Add(             "Для всех конфигураций");

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosМаркер "Вставить"'] = function() {
    form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self);
//ft    form.ЭлементыФормы.Назначение.СписокВыбора = дляКонфигурации;
    form.DoModal();
     
   form = null;
    if (doOK) addMarker(MarkerTypes.INSERT);
}


/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Маркер "Вставить"';
}

////} Макросы

var MarkerTypes = {
    INSERT:"Вставить"
};

var MarkerFormatStringParameters = {};
var pflSuhAuthorJs = 'Заголовок общего модуля 1';

function addMarker(markerType) {

    var _d = new Date();
    var dtNow = _d.getDate()+"."+(_d.getMonth()+1)+"."+_d.getFullYear()+" "+_d.getHours()+":"+_d.getMinutes()+"";
    var w = snegopat.activeTextWindow();
    if (!w) return;

    bFreeW = (w.mdProp == null);

    if (!bFreeW) 
    {
        if (w.mdProp.name(1) == "Форма") 
        { 
            var md = w.mdObj.parent;
            try
            {
                md.editProperty("МодульОбъекта");
            }catch(e){}
        }
    }
    var w = GetTextWindow();
    if (!w) return;

    
    var intLastStrCommentAlready = CheckForDescription(w);

    if (intLastStrCommentAlready != 1) 
    {
        w.textWindow.SetSelection(1, 1, intLastStrCommentAlready, 90);
        w.textWindow.SelectedText = "";
    }
    var synonym = Метаданные.Синоним;
     w.SetCaretPos(1, 1);
    w.InsertLine(1, ""+
            "//****************************************//_\\\\\n"+
            "// Описание программы от " +
            dtNow +"  /{"+
            "\n// ___" +                    strct1C_Description.ТипПрограммы +
            "___\n// предназначено для [" +    strct1C_Description.Назначение +
            "]\n" +                         strct1C_Description.Описание.replace(/(^.*)/mg, "//>>  $1") +
            "\n//                " +         strct1C_Description.Автор +
            "\n// Создан в " +                 synonym +
            "\n"    +    "//***************************************//}}\n");

}
function parseTpl() {
    var a = [];    
    for (var i=0; i<arguments.length;  i++)
        a.push(arguments[i]);        
    return snegopat.parseTemplateString('<?"", ' + a.join(',') + '>');
}

function getSettingsStructure() {

    var s = v8New("Структура");
    
    s.Вставить("Автор", "");
    s.Вставить("Назначение", "");
    s.Вставить("ТипПрограммы", "");
    s.Вставить("Описание", "");
     
    profileRoot.createValue(pflSuhAuthorJs, s, pflSnegopat)    
    s = profileRoot.getValue(pflSuhAuthorJs);
   
    return s;
}



//{ Обработчики элементов управления формы
function ПриОткрытии () {
     ЗаполнитьЗначенияСвойств(form, strct1C_Description);
    form['Описание'] = "";
}

function КнопкаОкНажатие (Элемент) {
    ЗаполнитьЗначенияСвойств(strct1C_Description, form);
    profileRoot.setValue(pflSuhAuthorJs, strct1C_Description);
    doOK = true;
    form.Close();
}

function КнопкаОтменаНажатие (Элемент) {
    doOK = false;
    form.Close();
}

//} Обработчики элементов управления формы

//{ Вернем последнюю строку описания модуля, если есть иначе 0
function CheckForDescription(wnd) {
    var txtText = wnd.ПолучитьТекст();
    if(wnd.LinesCount == 0) return 0;
    var arrLines = wnd.GetLines();
    if (arrLines[0].search(/\*\/\/\_\\\\/) == -1) return 0;
    
    for (var ln in arrLines)
    {
        if (arrLines[ln].search(/\/\/\}\}/) > 0) return (parseInt(ln) + 1);
        if (arrLines[ln].search(/^\s*\/\//) == -1) return 0;
    }
    return 0;
}
//} CheckForDescription

//{ Горячие клавиши по умолчанию.
function getPredefinedHotkeys(predef) {
    predef.setVersion(2.2);
    predef.add('Маркер "Вставить"', "Alt + Z");
}
//} Горячие клавиши по умолчанию.

var strct1C_Description = getSettingsStructure();



