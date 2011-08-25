$engine JScript
$uname extfiles
$dname Внешние файлы
$addin global

/* Скрипт для открытия внешних файлов для Снегопата, версия 1.0
 * Автор		: Пушин Владимир, vladnet@gmail.com
 * Дата создания: 24.08.2011
 * Описание		: Добавляет окно из которого можно открывать внешние файлы
 */

// Восстановим настройки
var pflExtFilesPath = "ExtFiles/Path"		// Зададим путь в профайле

profileRoot.createValue(pflExtFilesPath, false, pflSnegopat)
var Path = profileRoot.getValue(pflExtFilesPath)

// Подключим скрипт с стандартными командами
SelfScript.addNamedItem("stdcommands", addins.byUniqueName('stdcommands').object)

global.connectGlobals(SelfScript)

// Макрос для вызова окна
function macrosОткрытьОкноВнешнихФайлов()
{
	var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
	form = loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
	form.Открыть()
}

function мДобавитьФайлы(пПуть, пУзел)
{
	var лФайлы=FindFiles(пПуть, '*.*', false)
	var лКоличество=лФайлы.Количество()
	
	for (var лИнд=0; лИнд<лКоличество; лИнд++)
	{
		лФайл=лФайлы.Получить(лИнд)
		лСтрокаДереваФайлов=пУзел.Строки.Добавить()
		лСтрокаДереваФайлов.Имя=лФайл.ИмяБезРасширения
		лСтрокаДереваФайлов.Тип=лФайл.Расширение.substr(1)
		лСтрокаДереваФайлов.ИмяФайла=лФайл.ПолноеИмя
		лСтрокаДереваФайлов.ЭтоКаталог=лФайл.ЭтоКаталог()
		if(лСтрокаДереваФайлов.ЭтоКаталог == true)
			мДобавитьФайлы(лФайл.ПолноеИмя, лСтрокаДереваФайлов)
	}
}

function ОбновитьФайлы()
{
	form.ДеревоФайлов.Строки.Очистить()
	if(Path==false) return
	мДобавитьФайлы(Path, form.ДеревоФайлов)
	form.ДеревоФайлов.Строки.Сортировать("ЭтоКаталог Убыв, Имя", true);
}

function КпШапкаОбновить(Элемент)
{
	ОбновитьФайлы()
}

function ПриОткрытии()
{
	ОбновитьФайлы()
}

function КпШапкаЗакрыть(Элемент)
{
	form.Закрыть()
}

function openfile(ИмяФайлаПолное)
{
    if (ИмяФайлаПолное.match(/ssf$/)) 
    {
        designScriptForm(ИмяФайлаПолное);
        return;
    }

	// Подготовим наше значение для MRU - списка
	var pathToFile = ИмяФайлаПолное
	var docKind = '00000000-0000-0000-0000-000000000000'
	var mruItem = ЗначениеИзСтрокиВнутр('{"#",36973550-6bbb-11d5-bf72-0050bae2bc79,\n' +
	'{1,\n' +
	'{"file://' + pathToFile + '",0},' + docKind + '}\n' +
	'}')

	// Получим текущий список MRU из настроек
	var mru = profileRoot.getValue("App/MRUFileList")
	// Если там уже есть наше значение, удалим его
	var hasInMru = mru.НайтиПоЗначению(mruItem)
	if(hasInMru)
	   mru.Удалить(hasInMru)
	// Если список полон, удалим последний элемент
	if(mru.Количество() == 8)
	   mru.Удалить(7)
	// Вставим значение для нашего файла в начало списка
	mru.Вставить(0, mruItem)
	// Сохраним MRU-список обратно в настройки
	profileRoot.setValue("App/MRUFileList", mru)
	// И зашлем команду
	var cmd = addins.byUniqueName("stdcommands").object
	cmd.Frame.RecentFile.getState()
	cmd.Frame.RecentFile.send(0)
}

function ДеревоФайловПередНачаломИзменения(пЭлемент, пОтказ)
{
	пОтказ.val = true
	лТекСтрока=пЭлемент.val.ТекущаяСтрока
	if(лТекСтрока.ЭтоКаталог) return
	openfile(лТекСтрока.ИмяФайла)
}

function ДеревоФайловПриВыводеСтроки(пЭлемент, пОформлениеСтроки, пДанныеСтроки)
{
	лЯчейкаИмя=пОформлениеСтроки.val.Ячейки.Имя
	лЯчейкаИмя.ОтображатьКартинку=true
	if(пДанныеСтроки.val.ЭтоКаталог==true)
		лЯчейкаИмя.Картинка=БиблиотекаКартинок.ОткрытьФайл
	else
		лЯчейкаИмя.Картинка=БиблиотекаКартинок.Форма
}

function КпШапкаВыбратьКаталог(пЭлемент)
{
	ДиалогОткрытияФайла=v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.ВыборКаталога)
	ДиалогОткрытияФайла.ПолноеИмяФайла = Path
	ДиалогОткрытияФайла.Заголовок = "Выберите каталог"
	if(ДиалогОткрытияФайла.Выбрать()==false) return
	//Path = 'W:\\Projects\\CurrentProjects\\Comps\\WorkProfV82Web\\Extforms\\'
	Path = ДиалогОткрытияФайла.Каталог
	profileRoot.setValue(pflExtFilesPath, Path)
	ОбновитьФайлы()
}
