$engine JScript
$uname logview
$dname Просмотр истории изменений
$addin global
$addin extfiles
$addin stdcommands
$addin stdlib


// (c) Сосна Евгений shenja at sosna.zp.ua
// Скрипт - просмотр истории. 

global.connectGlobals(SelfScript)

var мФормаЖурнала=null
var Backend = null
var RootPath = null
var RootFile = null

function ПередОткрытием (Отказ, СтандартнаяОбработка) {
	// Вставить содержимое обработчика.
}

function ПриОткрытии () {
	//if ((Backend!=null) && (Backend!=undefined)) Backend("GETLOG", RootPath, мФормаСкрипта.ЭлементыФормы.timeline.ТекущиеДанные)
	//мОбновитьДанные();
}

function timelineПриАктивизацииСтроки (Элемент) {
	// Вставить содержимое обработчика.
	if ((Backend!=null) && (Backend!=undefined)) {
		var result = Backend("GETINFO", RootPath, мФормаСкрипта.ЭлементыФормы.timeline.ТекущаяСтрока.val.Версия)
		
	}
}

function СписокИзминенийФайловПередНачаломИзменения (Элемент, Отказ) {
	// Вставить содержимое обработчика.
	Отказ = false;
}

function СписокИзминенийФайловПриАктивизацииСтроки (Элемент) {
	//Будем устанавливать доступность элементов на форме. 
}

function СписокИзминенийФайловПередНачаломДобавления (Элемент, Отказ, Копирование) {
	// Вставить содержимое обработчика.
	Отказ = false;
}

function КПСравненияКПСравнить (Кнопка) {
	
	
}

function КПСравненияКПДобавитьКСравнению (Кнопка) {
	// Вставить содержимое обработчика.
}

function КПСравненияКПСохранитьВерсию (Кнопка) {
	// Диалог сохранения, и указать путь.
}

function macrosЖурнал(){
    var pathToForm=SelfScript.fullPath.replace(/js$/, 'ssf')
    мФормаЖурнала=loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
    мФормаЖурнала.Открыть();
}

function мОбновитьДанные(caller, мПуть) {
	if (мФормаЖурнала == null) {
		var pathToForm=SelfScript.fullPath.replace(/js$/, 'ssf')
		мФормаЖурнала=loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
		мФормаЖурнала.Открыть();
	}
	var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
	var pathToLog = mainFolder + "\\scripts\\dvcs\\dvcs_fossil.js";
	//Backend = stdlib.require(pathToLog).GetBackend();
	var Backend = caller;
	var RootFile = мПуть;
	мФормаЖурнала.timeline.Очистить();
	if ((Backend == undefined) && (Backend == null)) return 
	result = Backend("GETLOG", RootFile);
	for (var i=0; i<result.length; i++) {
		НоваяСтрока = мФормаЖурнала.timeline.Добавить();
		//Message(" " + i + " "+result[i]+" "+result[i][])
		НоваяСтрока.Версия = result[i]['version']
		НоваяСтрока.Коментарий = result[i]['comment']
	}
	мФормаЖурнала.Активизировать();
	
}

function getDefaultMacros() {
	return 'Журнал'
} //getDefaultMacros

