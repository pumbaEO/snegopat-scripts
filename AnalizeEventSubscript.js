$engine JScript
$uname AnalizeEventSubscript
$dname Анализ подписок на события
$addin vbs
$addin global
$addin stdlib

// (c) Александр Орефков
// Небольшой скрипт, показывающий отчет по подпискам на события объектов метаданных.
// Идея и схема компоновки данных взята из разработки Данилин Владислава "Анализ подписок на события"
// http://infostart.ru/public/123745/

global.connectGlobals(SelfScript)

var form, schema

(function()
{
    form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), SelfScript.self)
    // Получим текст схемы
    var readXml = v8New("ЧтениеXML")
    readXml.OpenFile(SelfScript.fullPath.replace(/\js$/, 'xml'))
    schema = СериализаторXDTO.ReadXML(readXml)
})()

function ТаблицаПодписок()
{
	vt	= v8New("ТаблицаЗначений")
	vt.Колонки.Добавить("Имя");
	vt.Колонки.Добавить("Событие");
	vt.Колонки.Добавить("Обработчик");	
	vt.Колонки.Добавить("Объект");
	vt.Колонки.Добавить("Метаданные");
	
	choice = v8New("СписокЗначений")
	for(var i = 0, c = metadata.openedCount; i < c; i++)
	{
	    var container = metadata.getContainer(i)
	    try{
	        if(container.rootObject.childObjectsCount("ПодпискиНаСобытия") > 0)
	            choice.Add(container, container.identifier)
	    }catch(e){}
	}
	choice = choice.ChooseItem("Выберите конфигурацию для отчета")
	if(!choice)
	    return null
	var container = choice.Value
	var mdObj = container.rootObject
	//debugger
	for(var i = 0, c = mdObj.childObjectsCount("ПодпискиНаСобытия"); i < c; i++)
	{
	    var event = mdObj.childObject("ПодпискиНаСобытия", i)
	    var typeString = ЗначениеВСтрокуВнутр(event.property("Источник"))
	    var typesUUIDs = ЗначениеВСтрокуВнутр(event.property("Источник")).replace(/\n/g, "").replace(/\{"#",f5c65050-3bbb-11d5-b988-0050bae0a95d,\{"Pattern",|\}\}|"#",/g, '').split(',')
	    for(var idx in typesUUIDs)
	    {
    	    var obj = container.findByTypeUUID(typesUUIDs[idx])
    	    if(obj)
    	    {
    	        var row = vt.Add()
	            row.Имя = event.name
	            row.Событие = toV8Value(event.property("Событие")).presentation()
	            row.Обработчик = toV8Value(event.property("Обработчик")).presentation()
	            row.Объект = obj.name
	            row.Метаданные = obj.mdclass.name(1)
    	    }
    	}
	}
	form.ЭлементыФормы.Конфигурация.Заголовок = container.identifier
	return vt
}

function makeReport()
{
    var source = ТаблицаПодписок()
    if(!source)
        return
    //Помещаем в переменную данные о расшифровке данных
    ДанныеРасшифровки = v8New("ДанныеРасшифровкиКомпоновкиДанных")
    //Формируем макет, с помощью компоновщика макета
    КомпоновщикМакета = v8New("КомпоновщикМакетаКомпоновкиДанных")
    //Передаем в макет компоновки схему, настройки и данные расшифровки
    МакетКомпоновки = КомпоновщикМакета.Выполнить(schema, schema.НастройкиПоУмолчанию, ДанныеРасшифровки)
    //Выполним компоновку с помощью процессора компоновки
    ПроцессорКомпоновкиДанных = v8New("ПроцессорКомпоновкиДанных")
	ВнешниеНаборыДанных = v8New("Структура")
	ВнешниеНаборыДанных.Вставить("ТаблицаДанных", source)
    
    ПроцессорКомпоновкиДанных.Инициализировать(МакетКомпоновки, ВнешниеНаборыДанных, ДанныеРасшифровки)

    //Очищаем поле табличного документа
    Результат = form.ЭлементыФормы.Результат;
    Результат.Очистить();
    //Выводим результат в табличный документ
    ПроцессорВывода = v8New("ПроцессорВыводаРезультатаКомпоновкиДанныхВТабличныйДокумент")
    ПроцессорВывода.УстановитьДокумент(Результат);
    ПроцессорВывода.Вывести(ПроцессорКомпоновкиДанных);
}

function macrosОткрытьОтчет()
{
    form.Открыть()
}

function CmdPanelСформировать(Кнопка)
{
    makeReport()
}
