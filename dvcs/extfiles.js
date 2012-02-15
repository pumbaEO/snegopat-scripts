$engine JScript
$uname extfiles
$dname Внешние файлы
$addin global
$addin stdcommands
$addin stdlib

/* Скрипт для открытия внешних файлов для Снегопата
* Автор		: Пушин Владимир, vladnet@gmail.com
* Дата создания: 24.08.2011
* Описание		: Добавляет окно из которого можно открывать внешние файлы
*/
var мВерсияСкрипта = 1.36

/* Версия 1.35
* 1. Добавлена возможность обновлять не все каталоги, а только текущий
* 2. Косметические изменения форм
* 3. Добавлены горячие кнопки для кнопок обновления каталогов
* 4. Теперь при обновлении каталога позиция курсора сохраняется
*/

// Зададим путь в профайле
var pflExtFilesOpenOnStart	= "ExtFiles/OpenOnStart"
var pflExtShowExtInName		= "ExtFiles/ShowExtInName"
var pflExtFilesPath			= "ExtFiles/Path"
var pflExtFilesPathBase		= "ExtFiles/PathBase"
var pflVersionControl		= "ExtFiles/VersionControl"
var pfColorModiefed			= "ExtFiles/ColorModiefed"
var pfColorDeleted			= "ExtFiles/ColorDeleted"
var pfColorNotVersioned		= "ExtFiles/ColorNotVersioned"


// Восстановим настройки
profileRoot.createValue(pflExtFilesOpenOnStart, false, pflSnegopat)
profileRoot.createValue(pflExtShowExtInName, true, pflSnegopat)
profileRoot.createValue(pflExtFilesPath, false, pflSnegopat)
profileRoot.createValue(pflExtFilesPathBase, false, pflBase)
profileRoot.createValue(pflVersionControl, false, pflSnegopat)
//FIXME: добавить соответствие цветов, как соотетствие, а не n переменных. 
profileRoot.createValue(pfColorModiefed, false, pflSnegopat)
profileRoot.createValue(pfColorDeleted, false, pflSnegopat)
profileRoot.createValue(pfColorNotVersioned, false, pflSnegopat)



var мОткрыватьПриСтарте = profileRoot.getValue(pflExtFilesOpenOnStart)
var мОтображатьРасширениеФайлаВПредставлении = profileRoot.getValue(pflExtShowExtInName)
var мТзКаталогиОбщие = profileRoot.getValue(pflExtFilesPath)
var мТзКаталогиБазы = profileRoot.getValue(pflExtFilesPathBase)
//FIXME: Добавить варианты использования версионного контроля. Не fossil единым. 
//	1. В ТЧ с каталогами выбирать вариант
//	2. Сделать вызов разных обработок в зависимости от варинат, добавить вариант авторегистрации...
// если народу понравиться, можно будет добавить кнопки, показ только измененных?
// var мИспользоватьВерисонирование = profileRoot.getValue(pflVersionControl)
var мЦветФонаИзмененные = profileRoot.getValue(pfColorModiefed)
var мЦветФонаНеВерсионный = profileRoot.getValue(pfColorNotVersioned)
var мЦветФонаУдаленный = profileRoot.getValue(pfColorDeleted)

var Path1 = null
var Path2 = null
var DvcsBackends = v8New("Structure");
var DiffBackends = v8New("Structure");

global.connectGlobals(SelfScript)

function registerDiffBackend(description, caller) {
	// тут расширение файла будет использоваться для определения инструмента. 
	DiffBackends.insert(description, caller)
}

function ТзКаталоговИнициализировать(пТзКаталоги)
{
    try{
        пТзКаталоги = ValueFromStringInternal(пТзКаталоги)
    }
    catch(e){
        пТзКаталоги = v8New("ТаблицаЗначений")
    }
    try{ /*тут проверяем не старые ли настройки, раньше хранились в массиве, конвертируем, в будущем удалить*/
        var лТест=пТзКаталоги.ВГраница()
        лТзКаталоги = v8New("ТаблицаЗначений")
        лТзКаталоги.Колонки.Добавить("ИмяКаталога");
        лТзКаталоги.Колонки.Добавить("Развернуть");
        
        for (var лИнд=0; лИнд<пТзКаталоги.Количество(); лИнд++)
        {
            лСтрокаТз=лТзКаталоги.Добавить()
            лСтрокаТз.ИмяКаталога=пТзКаталоги.Получить(лИнд)
            лСтрокаТз.Развернуть=true
        }
        return лТзКаталоги
    }
    catch(e){
    }
    return пТзКаталоги
}

мТзКаталогиОбщие = ТзКаталоговИнициализировать(мТзКаталогиОбщие)
мТзКаталогиБазы = ТзКаталоговИнициализировать(мТзКаталогиБазы)

мФормаСкрипта=null
мФормаНастройки=null


var fso = new ActiveXObject("Scripting.FileSystemObject");
var ValueTablesFiles = v8New("ТаблицаЗначений");
ValueTablesFiles.Columns.Add("FullFileName");
ValueTablesFiles.Columns.Add("Status");
ValueTablesFiles.Columns.Add("Catalog");

//TempDir = WshShell.ExpandEnvironmentStrings("%temp%") + "\\";
//cmdFName = TempDir +"fossilScriptRun.cmd";


if(мОткрыватьПриСтарте==true)
    macrosОткрытьОкноВнешнихФайлов()

// Макрос для вызова окна
function macrosОткрытьОкноВнешнихФайлов()
{
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    if(!мФормаСкрипта){
        мФормаСкрипта = loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
        мФормаСкрипта.Заголовок="Внешние файлы" //+мВерсияСкрипта
    }
    мФормаСкрипта.Открыть()
}

function КпШапкаНастройки(Элемент)
{
    var pathToForm=SelfScript.fullPath.replace(/.js$/, 'param.ssf')
    мФормаНастройки=loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
    мФормаНастройки.ЭлементыФормы.НадписьВерсия.Заголовок="Версия скрипта:"+мВерсияСкрипта
    мФормаНастройки.ОткрытьМодально()
}

function мЗаписатьНастройки()
{
    мТзКаталогиОбщие		= мФормаНастройки.КаталогиОбщие
    мТзКаталогиБазы			= мФормаНастройки.КаталогиБазы
    мОткрыватьПриСтарте		= мФормаНастройки.ОткрыватьФормуПриЗагрузке
    мЦветФонаИзмененные		= мФормаНастройки.ЦветФонаИзмененные
    мЦветФонаУдаленный		= мФормаНастройки.ЦветФонаУдаленный
    мЦветФонаНеВерсионный	= мФормаНастройки.ЦветФонаНеВерсионный
    
    profileRoot.setValue(pflExtFilesOpenOnStart, мОткрыватьПриСтарте)
    profileRoot.setValue(pflExtShowExtInName, мОтображатьРасширениеФайлаВПредставлении)
    profileRoot.setValue(pflExtFilesOpenOnStart, мОткрыватьПриСтарте)
    profileRoot.setValue(pflExtFilesPath, ValueToStringInternal(мТзКаталогиОбщие))
    profileRoot.setValue(pflExtFilesPathBase, ValueToStringInternal(мТзКаталогиБазы))
    profileRoot.setValue(pfColorModiefed, мЦветФонаИзмененные)
    profileRoot.setValue(pfColorDeleted, мЦветФонаУдаленный)
    profileRoot.setValue(pfColorNotVersioned, мЦветФонаНеВерсионный)
    
    мОбновитьФайлы()
}

function мЗагрузитьНастройку(пТзКаталоги, пТаблицаКаталогов)
{
    for (var лИнд=0; лИнд<пТзКаталоги.Количество(); лИнд++)
    {
        лСтрокаТз=пТаблицаКаталогов.Добавить()
        лСтрокаТз.ИмяКаталога=пТзКаталоги.Получить(лИнд).ИмяКаталога
        лСтрокаТз.Развернуть=пТзКаталоги.Получить(лИнд).Развернуть
    }
}

function НастройкиПриОткрытии()
{
    мФормаНастройки.ОткрыватьФормуПриЗагрузке=мОткрыватьПриСтарте
    мФормаНастройки.ОтображатьРасширениеФайлаВПредставлении=мОтображатьРасширениеФайлаВПредставлении
    мФормаНастройки.ЦветФонаИзмененные = мЦветФонаИзмененные
    мФормаНастройки.ЦветФонаУдаленный = мЦветФонаУдаленный
    мФормаНастройки.ЦветФонаНеВерсионный = мЦветФонаНеВерсионный
    мЗагрузитьНастройку(мТзКаталогиОбщие, мФормаНастройки.КаталогиОбщие);
    мЗагрузитьНастройку(мТзКаталогиБазы, мФормаНастройки.КаталогиБазы);
}

function КпШапкаЗаписатьИЗакрыть(Кнопка)
{
    мЗаписатьНастройки()
    мФормаНастройки.Закрыть()
}

function КпШапкаЗаписать(Кнопка)
{
    мЗаписатьНастройки()
}

function мВыбратьКаталог()
{
    ДиалогОткрытияФайла=v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.ВыборКаталога)
    ДиалогОткрытияФайла.ПолноеИмяФайла = ""
    ДиалогОткрытияФайла.Заголовок = "Выберите каталог"
    if(ДиалогОткрытияФайла.Выбрать()==false) return ""
    return ДиалогОткрытияФайла.Каталог
}

function КаталогиОбщиеИмяКаталогаНачалоВыбора(Элемент, СтандартнаяОбработка)
{
    лКаталог=мВыбратьКаталог()
    if(лКаталог=="") return
    Элемент.val.Значение=лКаталог
}

function КаталогиБазыИмяКаталогаНачалоВыбора(Элемент, СтандартнаяОбработка)
{
    лКаталог=мВыбратьКаталог()
    if(лКаталог=="") return
    Элемент.val.Значение=лКаталог
}

function registerDVCSBackend(description, caller) {
    DvcsBackends.insert(description, caller);
	мОбновитьФайлы();
	//Message("Зарегистр "+description)
}


function мДобавитьФайлы(пПуть, пУзел)
{
    var лФайлы=FindFiles(пПуть, '*.*', false)
    for (var лИнд=0; лИнд<лФайлы.Количество(); лИнд++)
    {
        лФайл=лФайлы.Получить(лИнд)
        
        if((лФайл.ЭтоКаталог() == false) && (мФормаСкрипта.Фильтр != ''))
            if(лФайл.ИмяБезРасширения.toLowerCase().search(мФормаСкрипта.Фильтр.toLowerCase()) == -1) continue
        
        лСтрокаДереваФайлов=пУзел.Строки.Добавить()
        лСтрокаДереваФайлов.ЭтоКаталог=лФайл.ЭтоКаталог()
        лСтрокаДереваФайлов.ИмяФайла=лФайл.ПолноеИмя
        лСтрокаДереваФайлов.ДатаИзменения=лФайл.ПолучитьВремяИзменения();
        //debugger;
        var StructureToFind = v8New("Structure");
        StructureToFind.Insert("FullFileName", лСтрокаДереваФайлов.ИмяФайла);
        var Rows = ValueTablesFiles.FindRows(StructureToFind);
        if (Rows.Count() > 0 )
        {
            //FIXME: сначало делал, как доп картинку, наверное лучше как статутс и можно вывести читаемо в дерево.
            if (Rows.Get(0).Status == 'EDITED')
                лСтрокаДереваФайлов.КартинкаСтатус = 1;
            else if (Rows.Get(0).Status == 'DELETED') {
                лСтрокаДереваФайлов.КартинкаСтатус = 2;
            };
            else if (Rows.Get(0).Status == 'NOTVERSIONED') {
                лСтрокаДереваФайлов.КартинкаСтатус = 3;
            };
        }
        
        if(мОтображатьРасширениеФайлаВПредставлении == true)
            лСтрокаДереваФайлов.Имя=лФайл.Имя
        else
            лСтрокаДереваФайлов.Имя=лФайл.ИмяБезРасширения
        
        if(лСтрокаДереваФайлов.ЭтоКаталог == true)
        {
            if(ValueIsFilled(лФайл.Расширение)) лСтрокаДереваФайлов.Имя+=лФайл.Расширение
            мДобавитьФайлы(лФайл.ПолноеИмя, лСтрокаДереваФайлов)
        }
        else
            лСтрокаДереваФайлов.Тип=лФайл.Расширение.substr(1)
    }
}

function ДобавитьКаталоги(пТзКаталоги)
{
    for (var лИнд=0; лИнд<пТзКаталоги.Количество(); лИнд++)
    {
        var лКаталог=пТзКаталоги.Получить(лИнд).ИмяКаталога;
        лСтрокаДереваФайлов=мФормаСкрипта.ДеревоФайлов.Строки.Добавить()
        лСтрокаДереваФайлов.Имя=лКаталог
        лСтрокаДереваФайлов.ИмяФайла=лКаталог
        лСтрокаДереваФайлов.Развернуть=пТзКаталоги.Получить(лИнд).Развернуть
        //проверим каталог с fossil
        var лТекущаяСтрока = лСтрокаДереваФайлов;
        //Теперь определим что у нас изменилось в этом каталоге и потом когда будем файлы добавлять проверять в этом массиве. 
        if (fso.FileExists(fso.BuildPath(лКаталог, '_FOSSIL_')))
        {
			
			if (DvcsBackends.Property('fossil')) {
				var caller = DvcsBackends['fossil'];
				var result = caller("STATUS", лКаталог, ValueTablesFiles)
			}
    }
        мДобавитьФайлы(лКаталог, лСтрокаДереваФайлов)

        лСтрокаДереваФайлов.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true)
    }
    мФормаСкрипта.ДеревоФайлов.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true)
}

function мОбновитьФайлы()
{
    лТекСтрока=мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    
    // Запомним текущую строку
    лИмяФайлаТекСтроки=""
    if(лТекСтрока!=undefined) лИмяФайлаТекСтроки=лТекСтрока.ИмяФайла
    
    мФормаСкрипта.ДеревоФайлов.Строки.Очистить()
    
    ДобавитьКаталоги(мТзКаталогиОбщие)
    ДобавитьКаталоги(мТзКаталогиБазы)
    for (var лИнд=0; лИнд<мФормаСкрипта.ДеревоФайлов.Строки.Количество(); лИнд++)
    {
        if(мФормаСкрипта.ДеревоФайлов.Строки.Получить(лИнд).Развернуть == false) continue
        var Str1=мФормаСкрипта.ДеревоФайлов.Строки.Получить(лИнд)
        мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.Развернуть(Str1, мФормаСкрипта.Фильтр != '');
    }
    
    // Восстановим текущую строку
    if(лИмяФайлаТекСтроки != ""){
        лСтрокаНайденная=мФормаСкрипта.ДеревоФайлов.Строки.Найти(лИмяФайлаТекСтроки, "ИмяФайла", true)
        if(лСтрокаНайденная != undefined)
            мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока=лСтрокаНайденная
    }
}

function мОбновитьФайлыТекущейВетки()
{
    лТекСтрока=мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    if(лТекСтрока==undefined) return
    
    // Запомним текущую строку
    лИмяФайлаТекСтроки=лТекСтрока.ИмяФайла
    
    while(лТекСтрока.Родитель != undefined) лТекСтрока=лТекСтрока.Родитель
    лТекСтрока.Строки.Очистить()
    мДобавитьФайлы(лТекСтрока.Имя, лТекСтрока)
    лТекСтрока.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true)
    
    // Восстановим текущую строку
    лСтрокаНайденная=мФормаСкрипта.ДеревоФайлов.Строки.Найти(лИмяФайлаТекСтроки, "ИмяФайла", true)
    if(лСтрокаНайденная != undefined)
        мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока=лСтрокаНайденная
}

function КпШапкаОбновить(Элемент)
{
    мОбновитьФайлы()
}

function КпШапкаОбновитьТекущуюВетку(Элемент)
{
    мОбновитьФайлыТекущейВетки()
}

function ФильтрПриИзменении(Элемент)
{
    мОбновитьФайлы()
}

function ПриОткрытии()
{
    мОбновитьФайлы()
}

function КпШапкаЗакрыть(Элемент)
{
    мФормаСкрипта.Закрыть()
}

function КнШапкаСравнитьСПоследнейВерсией(Элемент)
{
    лТекСтрока=мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока
    if(лТекСтрока==undefined) return
	var caller = DvcsBackends["fossil"]
	var structParam = v8New("Structure");
	structParam.insert("ValueTablesFiles", ValueTablesFiles)
	structParam.insert("Row", лТекСтрока);
	var pathsToFiles = v8New("Structure");
	if (!caller("DIFF", structParam, pathsToFiles))
		return
    
	Path1 = pathsToFiles["path1"];
	Path2 = pathsToFiles["path2"];
    macrosЗапуститьСравнениеФайлов();
    Path1 = null;
    Path2 = null;
}

function мАктивноДеревоВнешнихФайлов()
{
    if(мФормаСкрипта==null) return false
    if(мФормаСкрипта.ВводДоступен()!=true) return false
    return мФормаСкрипта.ТекущийЭлемент==мФормаСкрипта.ЭлементыФормы.ДеревоФайлов
}

function macrosСвернутьДеревоВнешнихФайлов()
{
    if(мАктивноДеревоВнешнихФайлов()==false) return false
    
    if(мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.Развернут(мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока)==false)
    {
        if(мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока.Родитель != undefined)
            мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока=мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока.Родитель
    }
    else
        мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.Свернуть(мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока)
}

function macrosРазвернутьДеревоВнешнихФайлов()
{
    if(мАктивноДеревоВнешнихФайлов()==false) return false
    мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.Развернуть(мФормаСкрипта.ЭлементыФормы.ДеревоФайлов.ТекущаяСтрока)
}

function КпШапкаРазвернуть(Элемент)
{
    macrosРазвернутьДеревоВнешнихФайлов();
}

function КпШапкаСправка(Кнопка)
{
    RunApp('http://snegopat.ru/scripts/wiki?name=extfiles.js');
}

function КпШапкаСвернуть(Элемент)
{
    macrosСвернутьДеревоВнешнихФайлов()
}

function ДеревоФайловПередНачаломИзменения(пЭлемент, пОтказ)
{
    пОтказ.val = true
    лТекСтрока=пЭлемент.val.ТекущаяСтрока
    if(лТекСтрока.ЭтоКаталог) return
    stdlib.openFileIn1C(лТекСтрока.ИмяФайла)
}

function ДеревоФайловПриВыводеСтроки(пЭлемент, пОформлениеСтроки, пДанныеСтроки)
{
    
    лЯчейкаИмя=пОформлениеСтроки.val.Ячейки.Имя
    лЯчейкаИмя.ОтображатьКартинку=true
    if (пДанныеСтроки.val.КартинкаСтатус == 1) {
        пОформлениеСтроки.val.Ячейки.Имя.ЦветФона = мЦветФонаИзмененные 
    }
    if (пДанныеСтроки.val.КартинкаСтатус == 2) {
        пОформлениеСтроки.val.Ячейки.Имя.ЦветФона = мЦветФонаУдаленный
    };
    if (пДанныеСтроки.val.КартинкаСтатус == 3) {
        пОформлениеСтроки.val.Ячейки.Имя.ЦветФона = мЦветФонаНеВерсионный
    };
    
    
    if(ValueIsFilled(пДанныеСтроки.val.Родитель)==false)
        лЯчейкаИмя.Картинка=БиблиотекаКартинок.СоздатьГруппу
    else if(пДанныеСтроки.val.ЭтоКаталог==true)
        лЯчейкаИмя.Картинка=БиблиотекаКартинок.ОткрытьФайл
    else
        лЯчейкаИмя.Картинка=БиблиотекаКартинок.Форма
}
function hookCompareFiles(dlgInfo)
{
    if (Path1 == null) return
    if (Path2 == null) return
    if(dlgInfo.stage == openModalWnd && dlgInfo.caption == "Сравнить файлы")
    {
        /* Пример перебора контролов на форме
        for(var c = 0; c < dlgInfo.form.controlsCount; c++)
        {
        var ctr = dlgInfo.form.getControl(c)
        Message(ctr.name + "   " + ctr.value)
        }*/
        events.disconnect(windows, "onDoModal", SelfScript.self, "hookCompareFiles")
        dlgInfo.form.getControl("FirstFile").value = Path1
        dlgInfo.form.getControl("SecondFile").value = Path2
        var wsh = new ActiveXObject("WScript.Shell")
        wsh.SendKeys('^~')
    }
}

function macrosЗапуститьСравнениеФайлов()
{
	var ext = Path1.substr(Path1.length-3)
	if (!DiffBackends.Property(ext)){
		events.connect(windows, "onDoModal", SelfScript.self, "hookCompareFiles")
		stdcommands.Frame.CompareFiles.send()
	} else {
		var caller = DiffBackends[ext]
		caller(Path1, Path2)
	}
	
}

/* 
Пока не забыл, как нам вытащить вариант старый файла...
1. fossil finfo -b test.txt
Вывод команды 
[CODE]
7704d33278 2012-02-07 Sosna 'blal'
[/CODE]
2. 7704d33278 - это важно...
3. fossil artifact 7704d33278 
Вывод команды 
[CODE]
C 'blal'
D 2012-02-07T16:43:05.990
F new/test2.txt da39a3ee5e6b4b0d3255bfef95601890afd80709
F null da39a3ee5e6b4b0d3255bfef95601890afd80709
F test.txt 577ceb90a97e84bb5083e5027f5ae90abb59d5e1
F ЭкспортНалоговыхНакладных.epf 3d31ccac62731f672a4d52f5ea398d5fd4a85c96
P 77c433f86d69037ea9d4082cfa044d4b7f0d5336
R 75b5f18b20c32b629db78d4868515a9c
U Sosna
Z efeb6f455893cacba3131bb79ea0c9fe
[/CODE]
4. F test.txt 577ceb90a97e84bb5083e5027f5ae90abb59d5e1 - это важно. 
5. 577ceb90a97e84bb5083e5027f5ae90abb59d5e1 - это id в базе.
6. fossil test-content-rawget 577ceb90a97e84bb5083e5027f5ae90abb59d5e1 filename.bla 
В результате мы получаем filename.bla с это ревизией.  */