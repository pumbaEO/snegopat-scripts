$engine JScript
$uname HintSetter
$dname Установка подсказок
$addin global
$addin stdcommands
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Установка подсказок" (HintSetter.js) для проекта "Снегопат"
////
//// Описание: устанавливает подсказки в объектах метаданных следующим образом:
////           если подсказка не заполнена, то она устанавливается по словарю по имени объекта метаданных, если в словаре нет такой записи, то устанавливается синоним.
////           Начинает работать с текущей строки в дереве метаданных и вниз по дереву (для всех подчиненных объектов).
////           Работает по текущему состоянию дерева метаданных (с учетом фильтра по подсистемам).
////
////           Формат словаря:
////           <имя объекта метаданных>: <текст подсказки>
////
//// TODO list:
////            - Форма настройки скрипта (расположение и имя словаря, устанавливать по синониму, или только по словарю, настройка языка)
////            - Предупреждения и диагностические сообщения (если установить не удалось (например объект не редактируется или не захвачен))
////            - Обработка остальных типов объектов метаданных
////            - Обработка всей конфигурации
////            - Более полная поддержка локализации (в текущей реализации подсказка читается только для русского языка, а при установке убирает все остальные языки кроме русского)
////
//// Автор: Дмитрий Ощепков <dmitro-75@mail.ru>
////}
////////////////////////////////////////////////////////////////////////////////////////

global.connectGlobals(SelfScript);

function getPredefinedHotkeys(predef){
    predef.setVersion(1);
    predef.add("Установить подсказки", "Ctrl + Alt + H");
}

function getHint(mdObj)
{
    var hint = mdObj.property("Подсказка");
    var re = /"ru","([\s\S]+)"/;
    var ar = re.exec(ValueToStringInternal(hint));
    if (ar == null)
        return "";
    return ar[1];
}

function setHint(mdObj, hint)
{
    var text = "{\"#\",87024738-fc2a-4436-ada1-df79d395c424,{1,\"ru\",\""+hint+"\"}}";
    var res = mdObj.setProperty("Подсказка", ValueFromStringInternal(text));
    if (!res)
        Message("Ошибка : не удалось установить подсказку у объекта " + mdObj.name)
}

function UpdateHint(mdObj)
{
    var hint = getHint(mdObj);
    if (hint == "")
    {
        var hint = CommonHints.Get(mdObj.name);
        if (hint == undefined)
            hint = mdObj.synonym("ru");
        setHint(mdObj, hint);
    }
}

function UpdateHintFor(mdObj, coll)
{
    var count = mdObj.childObjectsCount(coll);
    for (i = 0; i < count; i++)
        UpdateHint(mdObj.childObject(coll, i));
}

function UpdateHintForFor(mdObj, coll1, coll2)
{
    var count = mdObj.childObjectsCount(coll1);
    for (i = 0; i < count; i++)
        UpdateHintFor(mdObj.childObject(coll1, i), coll2);
}

function GetMDObjectAddress()
{
    view = windows.getActiveView();
    if (view.mdObj != metadata.current.rootObject)
        return null;
    var ar = new Array();
    GetMDName(view.getInternalForm().activeControl.extInterface.currentRow, ar);
    ar.reverse();
    return ar;
}

function GetMDName(row, ar)
{
    if (row.parent == null)
        return;
    var name = row.getCellAppearance(0).text;
    ar.push(name);
    GetMDName(row.parent, ar);
}

function UpdateChildren(ar, mdObj)
{
    if (ar[2] == "Реквизиты" || ar[2] == "Команды" || ar[2] == "Измерения" || ar[2] == "Ресурсы")
    {
        if (ar.length > 3)
            UpdateHint(mdObj.childObject(ar[2], ar[3]));
        else
            UpdateHintFor(mdObj, ar[2]);
    }
    else if (ar[2] == "Табличные части")
    {
        if (ar.length > 3)
        {
            var mdObj = mdObj.childObject("ТабличныеЧасти", ar[3]);
            if (ar.length > 4)
                UpdateHint(mdObj.childObject("Реквизиты", ar[4]));
            else
                UpdateHintFor(mdObj, "Реквизиты");
        }
        else
            UpdateHintForFor(mdObj, "ТабличныеЧасти", "Реквизиты");
    }
    else
        MessageBox("Для этой группы объектов установка подсказок не предусмотрена.");
}

function UpdateCommonObject(ar, className)
{
    var mdObj = metadata.current.rootObject.childObject(className, ar[1]);
    if (ar.length > 2)
        UpdateChildren(ar, mdObj);
    else
    {
        UpdateHintFor(mdObj, "Реквизиты");
        UpdateHintForFor(mdObj, "ТабличныеЧасти", "Реквизиты");
        UpdateHintFor(mdObj, "Команды");
    }
}

function UpdateRegisterObject(ar, className)
{
    var mdObj = metadata.current.rootObject.childObject(className, ar[1]);
    if (ar.length > 2)
        UpdateChildren(ar, mdObj);
    else
    {
        UpdateHintFor(mdObj, "Измерения");
        UpdateHintFor(mdObj, "Ресурсы");
        UpdateHintFor(mdObj, "Реквизиты");
        UpdateHintFor(mdObj, "Команды");
    }
}

function UpdateByAddress(ar, MDClassName)
{
    if (MDClassName == "РегистрыСведений" || MDClassName == "РегистрыНакопления")
        UpdateRegisterObject(ar, MDClassName);
    else
        UpdateCommonObject(ar, MDClassName);
}

function GetMDClassName(ar)
{
    if (ar[0] == "Справочники" || ar[0] == "Обработки" || ar[0] == "Отчеты")
        return ar[0];
    else if (ar[0] == "Документы")
    {
        if (ar.length > 1)
        {
            if (ar[2] == "Нумераторы" || ar[1] == "Последовательности")
                return null;
        }
        return "Документы";
    }
    else if (ar[0] == "Планы видов характеристик")
        return "ПланыВидовХарактеристик";
    else if (ar[0] == "Регистры сведений")
        return "РегистрыСведений";
    else if (ar[0] == "Регистры накопления")
        return "РегистрыНакопления";
    else
        return null;
}

var filePath = "c:\\000\\CommonHints.txt";
var CommonHints = null;
var CommonHintsDate = null;

function LoadCommonHints()
{
    
    var fileInfo = v8New("File", filePath);
    var isExist = fileInfo.Exist();
    if (CommonHints != null)
        if (isExist && fileInfo.GetModificationTime() != CommonHintsDate)
            return;
        
    //debugger;
    CommonHints = v8New("Map");
    CommonHintsDate = null;
    
    if (!isExist)
        return;
    
    var file = v8New("TextReader", filePath);
    CommonHintsDate = fileInfo.GetModificationTime();
    
    for (var str = file.ReadLine(); str != undefined; str = file.ReadLine())
    {
        var index = str.indexOf(":");
        var name, hint;
        if (index == -1)
            continue;
        
        var name = str.substr(0, index).replace(/^\s+/, '').replace(/\s+$/, '');
        var hint = str.substr(index + 1).replace(/^\s+/, '').replace(/\s+$/, '');
        CommonHints.Insert(name, hint);
    };
    file.Close();
}

SelfScript.self['macrosУстановить подсказки'] = function() {

    try
    {
        LoadCommonHints();
        
        var ar = GetMDObjectAddress();
        if (ar.length == 0)
        {
            MessageBox("Для всей конфигурации установка подсказки не реализована.");
            return true;
        }
        
        var MDClassName = GetMDClassName(ar);
        if (MDClassName == null)
        {
            MessageBox("Для этого объекта установка подсказок не предусмотрена.");
            return true;
        }
        
        if (ar.length > 1)
            UpdateByAddress(ar, MDClassName);
        else
        {
            for (var row = view.getInternalForm().activeControl.extInterface.currentRow.firstChild; row != null; row = row.next)
            {
                var Name = row.getCellAppearance(0).text;
                if (MDClassName == "Документы" && (Name == "Нумераторы" || Name == "Последовательности"))
                    continue;
                
                ar[1] = Name;
                UpdateByAddress(ar, MDClassName);
            }
        }
    }
    catch(e)
    {
        Message("Ошибка : " + e.description)
    }

    return true;
}
