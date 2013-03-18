$engine JScript
$dname Выбор типа в подсказке о параметрах
$addin stdlib
$addin global

global.connectGlobals(SelfScript)


stdlib.require("SelectValueDialog.js", SelfScript);

/* (c) Александр Орефков
 * Скрипт содержит макрос, позволяющий при наличии в подсказке о параметрах нескольких методов
 * быстро выбрать нужный по типу, к которому относится метод.
 * Естественно, раз быстрый выбор, то требует для работы svcsvc.dll
 */

function macrosВыбратьТипПараметра()
{
    var paramPos = snegopat.paramsPosition()
    if(paramPos)    // Подсказка видна
    {
        var types = new VBArray(snegopat.paramsTypes()).toArray()
        if(types.length > 1)
        {
            var useSvcsvc = true;
            try{
            var sel = new ActiveXObject('Svcsvc.Service')
            }catch(e)
            {
                //Message("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll")
                useSvcsvc=false;
            }
            if(useSvcsvc){
                var choice = sel.FilterValue(types.join("\r\n"), 1 | 8, '', paramPos.beginCol + 10, paramPos.beginRow + 20, paramPos.endCol - paramPos.beginCol - 20);    
            } else {
                var dlg = new SelectValueDialog("Выбор типа в подсказке о параметрах", types);
                dlg.form.GreedySearch = true; 
                sel = dlg.selectValue();
                var choice = '';
                if (sel){
                    choice = dlg.selectedValue;
                }
                
            }
            
            if(choice.length)
            {
                for(var k in types)
                {
                    if(types[k] == choice)
                        break
                }
                return snegopat.setParamType(k)
            }
        }
    }
    return false;
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(3)
    predef.add("ВыбратьТипПараметра", "Ctrl + 2")
}

//////////////////////////////////////////////////////////////////////////
// Работа по изменению списка подсказки
events.connect(snegopat, "onShowParams", SelfScript.self)
function onShowParams(p)
{
    // Если текст перед методом заканчивается точкой, обработаем методы объектов
    // иначе глобальные методы
    (p.src.match(/\.\s*$/) ? processObjectMethod : processGlobalMethod)(p, snegopat.activeTextWindow());
    //debugger
    /*
    Message("Запрос подсказки для метода " + p.name)
    Message("Текст перед методом: " + p.src)
    Message("Снегопат нашел подсказок: " + p.typesCount)
    // Перебор подсказок
    for(var i = 0; i < p.typesCount; i++)
        Message("Подсказка № " + i + "  Тип: " + p.typeName(i) + (p.typeIsModule(i) ? " Это метод из модуля" : ""))
    // Удаление подсказки. Например удалим последнюю
    if(p.typesCount > 1)
        p.remove(p.typesCount - 1)
    // Перемещение подсказки. Например, переставим последнюю в начало
    if(p.typesCount > 1)
        p.move(p.typesCount - 1, 0)
    // Добавим свою подсказку
    p.insert(0, p.name, "ИмяТипаИзКоторогоМетод", "Тут описание метода", "ВозвращаемыйТип", false)
    // Добавим описания параметров к этой подсказке
    p.addParamDescr(0, "Парам1", "Описание параметра 1")
    p.addParamDescr(0, "Парам2", "Описание параметра 2")
    */
}

// Класс для получения названий типов объекта матаданных, т.к. штатный объект ОписаниеТипов в
// режиме Конфигуратора не выдает типы, основанные на метаданных.
function TypeFinder(mdContainer)
{
    var types = new VBArray(mdContainer.typeList('', 1)).toArray()
    for(var i in types)
        this[types[i].clsid] = types[i].name
}

TypeFinder.prototype.getTypeString = function(mdObj)
{
    var text = []
    var types = new VBArray(mdObj.types()).toArray()
    for(var i in types)
        text.push(this[types[i]]);
    return text.join(", ")
}

var clsid2typestr = new TypeFinder(metadata.current);

function processGlobalMethod(p, wnd)
{
    if(p.typesCount > 1)
    {
        // Подсказок больше 1, надо попробовать удалить лишние
        // Составим список типов, которые можно вызывать как глобальные в этом модуле
        var reStr = "^ГлобальныйКонтекст$|^ВстроенныеФункцииЯзыка$"
        if(wnd.mdObj)
        {
            var propName = wnd.mdProp.name(1)
            if(propName == "Форма")   // В обычной форме можно напрямую обращаться к основному реквизиту формы
            {
                var typesOfMainAttr
                if(tov8value(wnd.mdObj.property("ТипФормы")).presentation() == 'Обычная')
                {
                    reStr += '|^Форма$'
                    typesOfMainAttr = findFatFormMainAttr(wnd.extObject)
                    if(typesOfMainAttr)
                    {
                        // Получили массив с guid'ами типов основного реквизита
                        for(var k in typesOfMainAttr)
                        {
                            var tf = clsid2typestr
                            if(wnd.mdObj.container != metadata.current)
                                tf = new TypeFinder(wnd.mdObj.container)
                            var typeName = tf[typesOfMainAttr[k]]
                            if(typeName)
                                reStr += '|^' + typeName.replace(/\..+/, "\\.<.*") + "$"
                        }
                    }
                }
                else
                    reStr += '|^УправляемаяФорма$'
            }
            else if(propName == "МодульОбъекта")
            {
                // Здесь можно напрямую обращаться к соответствующим типам метаданных
                reStr += "|^" + wnd.mdObj.mdclass.name(1) + "Объект\\.<.*$"
            }
            else if(propName == "МодульМенеджера")
                reStr += "|^" + wnd.mdObj.mdclass.name(1) + "Менеджер\\.<.*$"
        }
        // Теперь обработаем список подсказок
        // Проход 1 - ищем, попадает ли что-то под наш список
        //Message(reStr)
        var re = new RegExp(reStr, 'i')
        for(var i = 0, c = p.typesCount; i < c; i++)
        {
            if(!p.typeIsModule(i) && re.test(p.typeName(i)))
                break
        }
        // Если ничего не попало, оставляем, как есть, иначе удаляем все, что не попадает в наш список типов
        if(i < c)   // что-то совпало
        {
            for(i = 0; i < c; )
            {
                if(!p.typeIsModule(i) && !re.test(p.typeName(i)) ) // Если тип не подходит под регэксп, удалим его
                {
                    p.remove(i)
                    c--
                }
                else
                    i++
            }
        }
    }
}

function processObjectMethod(p, wnd)
{
    // Пока тут мало что умеем, но хотя бы удалим методы глобального контекста
    // и встроенные методы. По крайней мере для .Сообщить будет правильно показывать
    if(p.typesCount > 1)
    {
        // Подсказок больше 1, надо попробовать удалить лишние
        // Составим список типов, которые можно вызывать как глобальные в этом модуле
        var reStr = "^ГлобальныйКонтекст$|^ВстроенныеФункцииЯзыка$"

        var re = new RegExp(reStr, 'i')
        for(var i = 0, c = p.typesCount; i < c; )
        {
            if(re.test(p.typeName(i)))
            {
                p.remove(i)
                c--
            }
            else
                i++
        }
    }
}

function replaceXMLsymbols(text)
{
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
}

// Функция преобразует стандартный 1Совский список (который с {,}) в xml
// Ибо в xml потом ковырятся с XPath гораздо проще
function list1CtoXml(text)
{
    var res = []
    var re = /\{|\}|,|(?:"[^"]*")+|#[^\,\}]*|[^\{\}\,\n"]+/g
    while(re.exec(text))
    {
        switch(RegExp.lastMatch) {
        case '{':   // Начинаем список
            res.push('<l>')
        	break;
        case '}':   // Закрываем список
            res.push('</l>')
        	break;
        case ',':   // Просто разделитель списка, пропускаем, не нужен
            break
        default:    // Значения
            if(RegExp.lastMatch.length)
                res.push('<e>' + replaceXMLsymbols(RegExp.lastMatch) + '</e>')
            else
                res.push('<e/>')
        }
    }
    //return res.join('')
    return res.join('\n')
}

function createDOM(xml)
{
    var readxml = v8New('ЧтениеXML');
    readxml.УстановитьСтроку(xml);
    var domBuilder = v8New('ПостроительDOM');
    return domBuilder.Прочитать(readxml)
}

function fatFormToXML(form)
{
    var text = ЗначениеВСтрокуВнутр(form), xml = list1CtoXml(text)
    return {text: text, xml: xml, dom: createDOM(xml)}
}

function extractTypesFromMainAttr(dom, xpathBuild)
{
    var result = []
    try{
    var nsResolver = v8New('РазыменовательПространствИменDOM', dom);
    // Получим выражение xpath
    var xpath = xpathBuild(dom, nsResolver)
    var defAttrTypesIt = dom.ВычислитьВыражениеXPath(xpath, dom, nsResolver, ТипРезультатаDOMXPath.УпорядоченныйИтераторУзлов)
    // переберем полученные узлы
    for(;;) {
        var node = defAttrTypesIt.ПолучитьСледующий()
        if(!node)
            break
        if(node.ИмяУзла == 'e' && node.ТекстовоеСодержимое != '"#"')
            result.push('{' + node.ТекстовоеСодержимое.toUpperCase() + '}') // Добавим guid типа в список
    }
    }catch(e){}
    return result
}

function findFatFormMainAttr(form)
{
    //debugger
    // Преобразуем форму из 1Сго списка в xml, ибо его анализировать проще
    var form = fatFormToXML(form)
    //Message(form.xml)
    return extractTypesFromMainAttr(form.dom, function(dom, ns) {
        var defAttrID = dom.ВычислитьВыражениеXPath("/l[1]/l[1]/l[2]/l[1]/e[1]", dom, ns,
            ТипРезультатаDOMXPath.ПервыйУпорядоченныйУзел).ОдиночныйУзелЗначение.ТекстовоеСодержимое
        return '/l[1]/l[1]/l[2]/l[2]/l[l[1]/e[1][.="' + defAttrID + '"]]/l[2]/l[1]/*'
    })
}

// Это извлечение типов основного реквизита управляемой формы. Пока не используется,
// но на будущее возможно пригодится.
function managedFormToXML(mdObj, mdProp)
{
    var file = mdObj.getExtProp(mdProp.id).saveToFile()
    file.seek(3, fsBegin)   // Первые три байта - BOM
    var text = file.getString(dsUtf8), xml = list1CtoXml(text)
    return {text: text, xml: xml, dom: createDOM(xml)}
}

function findMangedFormMainAttr(wnd)
{
    var form = managedFormToXML(wnd.mdObj, wnd.mdProp)
    return extractTypesFromMainAttr(form.dom, function(){return '/l/l[2]/l[*[18][.="1"]]/*[9]/l[1]/*'})
}
