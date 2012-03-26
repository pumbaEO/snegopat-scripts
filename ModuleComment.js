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
////}
////////////////////////////////////////////////////////////////////////////////////////
var doOK = false;
////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosМаркер "Вставить"'] = function() {
    form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self);
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

	var synonym = Метаданные.Синоним;
 	w.SetCaretPos(1, 1);
	w.InsertLine(1, ""+
			"//*******************************************\n"+
			"// Описание программы от " +
			dtNow +"  /{"+
			"\n// ___" +					Settings['ТипПрограммы'] +
			"___\n// предназначено для [" +	Settings['Назначение'] +
			"]\n" + 						Settings['Описание'].replace(/(^.*)/mg, "//>>  $1") +
			"\n//                " + 		Settings['Автор'] +
			"\n// Создан в " + 				synonym +
			"\n"    +	"//***************************************//}\n");

}
function parseTpl() {
    var a = [];    
    for (var i=0; i<arguments.length;  i++)
        a.push(arguments[i]);        
    return snegopat.parseTemplateString('<?"", ' + a.join(',') + '>');
}

function getSettings() {

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
 	ЗаполнитьЗначенияСвойств(form, Settings);
	form['Описание'] = "";
}

function КнопкаОкНажатие (Элемент) {
    ЗаполнитьЗначенияСвойств(Settings, form);
    profileRoot.setValue(pflSuhAuthorJs, Settings);
	doOK = true;
    form.Close();
}

function КнопкаОтменаНажатие (Элемент) {
	doOK = false;
    form.Close();
}

//} Обработчики элементов управления формы

//{ Горячие клавиши по умолчанию.
function getPredefinedHotkeys(predef) {
    predef.setVersion(1.6);
    predef.add('Маркер "Вставить"', "Alt + Z");
}
//} Горячие клавиши по умолчанию.

var Settings = getSettings();



