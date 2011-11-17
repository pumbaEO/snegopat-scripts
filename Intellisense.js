$engine JScript
$uname Intellisence
$dname Умная подсказка после точки
$addin global
$addin stdlib

var _DEBUG_MODE = true;

function _debug(message)
{
    if (_DEBUG_MODE)
        Message(message);
}

////////////////////////////////////////////////////////////////////////////////////////
//// IntsManager
////


/** Класс отвечающий за загрузку информации о типах методов из Ints-файлов и кэширование этих данных.
 Параметр - каталог, в котором искать Ints-файлы. Подгрузка данных "ленивая", т.е. осуществляется по 
первому запросу информации о типе. О формате ints-файлов см. в описании метода loadTypeFromFile(). */
function IntsManager(intsFolder)
{
    this.allTypesInfo = {};

    if (intsFolder) 
    {
        this._intsFolder = intsFolder;
    }    
    else
    {
        /* Если каталог не задан, используем каталог по умолчанию.
        Сознательно не помещаю его на один уровень со скриптами, чтобы ints-файлы 
        не попадали в репозиторий: файлов будет много, и это избыточная информация, 
        которую всегда при отсутствии можно восстановить по файлу 
        <MainFolder>\core\types\v8types.txt */
        var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
        this._intsFolder = mainFolder + 'ints';        
    }
}

/** Возвращает объект - информацию о методе. В качестве параметров передается 
имя типа и имя метода, информацию о котором надо получить. */
IntsManager.prototype.getMethodInfo = function (typeName, methodName)
{
    var typeInfo = this._getTypeInfo(typeName);               
    return typeInfo.m[methodName];
}

/** Возвращает строку - имя типа возвращаемого методом methodName объекта типа typeName значения.*/
IntsManager.prototype.getMethodReturnType = function (typeName, methodName)
{
    var methodInfo = this.getMethodInfo(typeName, methodName);
    
    if (!methodInfo)
    {
        _debug('У объекта типа"' + typeName + '" нет методов с именем "' + methodName + '"!');
        return null;
    }
    
    return methodInfo.r;
}

/** Возвращает информацию о свойстве propName объекта с именем typeName. */
IntsManager.prototype.getPropertyInfo = function (typeName, propName)
{
    var typeInfo = this._getTypeInfo(typeName);           
    return typeInfo.p[propName];
}

/** Возвращает информацию о типе с именем typeName. Если тип не найден в кеше, подгружает его из ints-файла. */
IntsManager.prototype._getTypeInfo = function(typeName)
{
    var typeInfo = this.getTypeInfo(typeName);
    
    if (!typeInfo)
        typeInfo = this.loadTypeInfoFromFile(typeName);
    
    if (!typeInfo)
    {
        _debug('Информация о типе "' + typeName + '" не найдена!');
        return null;
    }
    
    return typeInfo;
}

IntsManager.prototype.getIntsFolder = function ()
{    
    return this._intsFolder; 
}

IntsManager.prototype.getFullIntsFilePath = function (typeName)
{
    var intsFolder = this.getIntsFolder();
    return intsFolder + '\\' + typeName + '.ints';
}

/** Загружает информацию о типе из ints-файла. 
Формат ints-файла.
Имя файла: <ИмяТипа>.ints
Содержимое файла:
meth(<ИмяТипа>, <ИмяМетода>, <ИмяТипаВозвращаемогоЗначения>,<РежимДоступности>);
prop(<ИмяТипа>, <ИмяСвойства>, <ИмяТипаСвойства>,<РежимДоступности>);
*/
IntsManager.prototype.loadTypeInfoFromFile = function(typeName)
{
    var file = v8New('File', this.getFullIntsFilePath(typeName));
    
    if (!file.Exist())
    {
        _debug('Ints-файл ' + file.FullName + ' не существует!');
        return null;
    }
    
    var textDoc = v8New('TextDocument');
    textDoc.Read(file.FullName);
    
    try
    {
        this.addTypeInfoFromString(textDoc.GetText());    
    }
    catch (e)
    {
        Message('При чтении ints-файла ' + file.FullName + " произошла ошибка.");
        _debug(e.message);
        
        /* TODO: в не-дебаг режиме запоминать неудачные чтения, чтобы не 
        производить во время обычной работы повторные попытки чтения. */
    }
}

IntsManager.prototype.addTypeInfoFromString = function(codeText)
{
    var _intsManager = this;
    
    var meth = function (typeName, methodName, returnType, accessability)
    {
        var typeInfo = _intsManager.getTypeInfo(typeName, true);
        
        typeInfo.m[methodName.toLowerCase()] = {
            n: methodName,
            r: returnType,
            a: accessability
        };
    };

    var prop = function(typeName, propName, propTypeName, accessability)
    {
        var typeInfo = _intsManager.getTypeInfo(typeName, true);
        
        typeInfo.p[propName.toLowerCase()] = {
            n: propName,
            t: propTypeName,
            a: accessability
        };
    };
    
    eval(codeText);
}

IntsManager.prototype.getTypeInfo = function(typeName, createIfNotFound)
{
    var typeInfo = this.allTypesInfo[typeName.toLowerCase()];
    
    if (!typeInfo && createIfNotFound)
    {
        typeInfo = { n: typeName, m:{}, p:{}};
        this.allTypesInfo[typeName.toLowerCase()] = typeInfo;
    }
    
    return typeInfo;
}
