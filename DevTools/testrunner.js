$engine JScript
$uname TestRunner
$dname Менеджер юнит-тестов скриптов
$addin SnegopatMainScript
$addin global
$addin stdlib

global.connectGlobals(SelfScript)

var jsUnitCore = stdlib.require("jsUnitCore.js");

/* Анонимный обработчик, который мы передаем, позволяет обойти проблему 
с отловом исключений, брошенных в контексте скрипта-библиотеки. */
jsUnitCore.SetErrorHandler(function (exception) { throw exception; });

OpenTestRunner();

////////////////////////////////////////////////////////////////////////////////////////
//// TestRunner
////

function TestRunner()
{
    TestRunner._instance = this;
    
    this.form = loadScriptForm("scripts\\DevTools\\testrunner.ssf", this)
    this.form.Открыть();
    
    this.rootPath = "";
    
    this.allTests = this.form.ЭлементыФормы.тпДеревоТестов.Значение;                     
    this.allTests.Колонки.Добавить("object");
                     
    this.loadedTestAddins = [];
                     
    // Варианты состояний выполнения тестов
    this.STATE_NOT_RUN = 0;
    this.STATE_SUCCESS = 1;
    this.STATE_IGNORE  = 2;    
    this.STATE_FAILURE = 3;
            
    // Иконки состояний.
    this.StateIcons = {  
        Gray : this.form.ЭлементыФормы.ПолеКартинкиСерый.Картинка,
        Green: this.form.ЭлементыФормы.ПолеКартинкиЗеленый.Картинка,
        Yellow: this.form.ЭлементыФормы.ПолеКартинкиЖелтый.Картинка,
        Red: this.form.ЭлементыФормы.ПолеКартинкиКрасный.Картинка
    }                  
}

TestRunner.prototype.unloadAllTests = function ()
{
    this.allTests.Строки.Очистить();

    for (var i=0; i<this.loadedTestAddins.length; i++)
    {
        if (this.loadedTestAddins[i].uniqueName)
            addins.unloadAddin(this.loadedTestAddins[i]);
    }
    
    this.loadedTestAddins = [];
}

TestRunner.prototype.loadTests = function(path)
{
    this.rootPath = path;
    
    this.unloadAllTests();

    this.walkFilesAndLoad(path, this.allTests);
    
    if (this.allTests.Строки.Количество() == 0)
    {
        Message("В каталоге " + path + " тест-кейсов не найдено!");
        return;
    }
        
    // Развернем все уровни дерева.
    for(var i=0; i<this.allTests.Строки.Количество(); i++)
        this.form.ЭлементыФормы.тпДеревоТестов.Развернуть(this.allTests.Строки.Получить(i), true);
}

TestRunner.prototype.isTestAddinFile = function(file)
{
    // Имя тестового скрипта должно начинаться с префикса "test"
    if (!file.Name.match(/^test/i))
        return false;
    
    // Поддерживаются пока только скрипты.
    if (!file.Extension.match(/js|vbs/i))
        return false;

    return true;
}

TestRunner.prototype.walkFilesAndLoad = function(path, parentNode)
{
    var f = v8New("File", path);

    var files = f.IsFile() ? [ f ] : FindFiles(path, "*", false);
    
    for (var i=0; i<files.length; i++)
    {
        var Файл = files[i];
        
        if (Файл.ЭтоКаталог())
        {
            var newNode = this.addTestGroup(parentNode, Файл);
            this.walkFilesAndLoad(Файл.ПолноеИмя, newNode);
            
            // Пустые каталоги не показываем в дереве тестов.
            if (newNode.Rows.Count() == 0)
                parentNode.Rows.Delete(newNode);
        }
        else if (this.isTestAddinFile(Файл))
        {
            try
            {
                var testAddin = this.loadTestAddin(Файл.ПолноеИмя);
                
                if (testAddin)
                {
                    var newNode = this.addTestCase(parentNode, testAddin);
                                                                                
                    if (newNode.Rows.Count() == 0)
                    {
                        jsUnitCore.warn("Скрипт не содержит макросов и не будет загружен: " + testAddin.fullPath);
                        parentNode.Rows.Delete(newNode);
                            
                        addins.unloadAddin(testAddin);
                            
                        if(!testAddin.uniqueName.length) 
                            delete testAddin;                            
                    }
                    else 
                    {
                        this.loadedTestAddins.push(testAddin);
                    }
                }
            }
            catch (e)
            {
                jsUnitCore.warn("Ошибка загрузки скрипта: " + Файл.ПолноеИмя);
                // TODO: выводить информацию об ошибке подробнее.
            }
        }            
    }        
}

TestRunner.prototype.loadTestAddin = function(path)
{
    var fullLoadString = "script:" + path;
    
    var testAddin = addins.byFullPath(fullLoadString);
    
    if (!testAddin)
    {
        // Тест-аддины будем подгружать в группу "Подгружаемые библиотеки".        
        libGroup = SnegopatMainScript.AddinsTreeGroups.LoadedLibs;
            
        // Загружаем тестовый аддин.
        try 
        {
           testAddin = addins.loadAddin(fullLoadString, libGroup);
        }
        catch(e)
        {
            jsUnitCore("TestRunner::loadTestAddin: Тестовый скрипт не загружен: " + path);
            return null;
        }
    }
    
    return testAddin;
}

TestRunner.prototype.addTestGroup = function(parentNode, Файл)
{
    var newNode = parentNode.Строки.Добавить();
    newNode.НазваниеТеста = Файл.Имя;
    newNode.ВремяВыполнения = 0;
    newNode.ПолныйПуть = Файл.ПолноеИмя;
    newNode.Состояние = this.STATE_NOT_RUN;
    newNode.object = null;
    return newNode;
}

TestRunner.prototype.addTestCase = function(parentNode, testAddin)
{
    var newNode = parentNode.Rows.Add();
    newNode.НазваниеТеста = testAddin.uniqueName;
    newNode.ВремяВыполнения = 0;
    newNode.ПолныйПуть = testAddin.fullPath;
    newNode.Состояние = this.STATE_NOT_RUN;
    newNode.object = testAddin;

    /* Добавим тест-методы.
     * Тест-метод - это макросы с именами вида macrosTestИмяТеста.
     */
    var macroses = new VBArray(testAddin.macroses()).toArray();
    for(var m in macroses)
        if (macroses[m].match(/^Test/))
            this.addTest(newNode, macroses[m], testAddin);
        
    return newNode;
}

TestRunner.prototype.addTest = function(parentNode, testName, testAddin)
{
    var newNode = parentNode.Строки.Добавить();
    newNode.НазваниеТеста = testName;
    newNode.ВремяВыполнения = 0;
    newNode.ПолныйПуть = testAddin.fullPath;
    newNode.Состояние = this.STATE_NOT_RUN;
    newNode.object = new Test(testAddin, testName);    
    return newNode;
}

TestRunner.prototype.runAllTests = function()
{
    for (var i = 0; i < this.allTests.Строки.Количество(); i++)
    {
        var ТекущаяСтрока = this.allTests.Строки.Получить(i);

        var beginTime = new Date();        
        
        ТекущаяСтрока.Состояние = this.runTest(ТекущаяСтрока);
        
        ТекущаяСтрока.ВремяВыполнения = (new Date() - beginTime) / 1000;        
    }    
}

TestRunner.prototype.runTest = function (СтрокаТестов)
{   
    var Состояние = this.STATE_SUCCESS;
    
    if (СтрокаТестов.object && jsUnitCore.JsUnit._trueTypeOf(СтрокаТестов.object) == 'Test')
    {
        Состояние = this.executeTestFunction(СтрокаТестов);
    }
    else
    {   
        if (СтрокаТестов.Строки.Количество() == 0)
            return this.STATE_IGNORE;
    
        for (var i = 0; i < СтрокаТестов.Строки.Количество(); i++)
        {
            var ТекущаяСтрока = СтрокаТестов.Строки.Получить(i);

            var beginTime = new Date();        
            
            ТекущаяСтрока.Состояние = this.runTest(ТекущаяСтрока);
            
            ТекущаяСтрока.ВремяВыполнения = (new Date() - beginTime) / 1000;        
            
            if (ТекущаяСтрока.Состояние != this.STATE_SUCCESS)
                Состояние = this.STATE_FAILURE;                             
            
        }    
        
    }
    
    return Состояние;
}

TestRunner.prototype.setStatus = function(status)
{
}

TestRunner.prototype.setTestStatus = function(test, excep)
{
    var message = 'Тест ' + test.fullTestName + ' ';

    if (excep == null) 
    {
        test.status = this.STATE_SUCCESS;
        //test.testPage.successCount++;
        message += 'выполнен успешно';
    } 
    else 
    {
        test.exception = excep;

        if (!excep.isJsUnitFailure) 
        {
            //this.errorCount++;
            test.status = this.STATE_FAILURE;
            //test.testPage.errorCount++;
            message += ' остановлен из-за ошибки в нем (exception or error)';
        }
        else 
        {
            //debugger;
            //this.failureCount++;
            test.status = this.STATE_FAILURE;
            //test.testPage.failureCount++;
            message += " провалился (assertion failed)" 
                + (excep.comment ? "\n\t" + excep.comment : "") 
                + (excep.jsUnitMessage ? "\n\t" + excep.jsUnitMessage : "");
        }
    }

    test.message = message;
    
    Message(message);    
    
    return test.status;
}

TestRunner.prototype.executeTestFunction = function(СтрокаТеста)
{
    var theTest = СтрокаТеста.object;
    var testAddin = theTest.addin;
    var testFunctionName = 'macros' + theTest.testName;
     
//debugger;
     
    this.setStatus('Выполняется тест "' + testFunctionName + '"');
    
    var exception = null;
    var timeBefore = new Date();
    
    try 
    {
       if (testAddin.object.setUp !== jsUnitCore.JSUNIT_UNDEFINED_VALUE)
            testAddin.object.setUp();
            
       testAddin.object[testFunctionName].call(null);
    }
    catch (e1) 
    {
        exception = e1;
    }
    finally 
    {
        try 
        {
            if (testAddin.object.tearDown !== jsUnitCore.JSUNIT_UNDEFINED_VALUE)
                testAddin.object.tearDown();
        }
        catch (e2) 
        {
            //Unlike JUnit, only assign a tearDown exception to excep if there is not already an exception from the test body
            if (exception == null)
                exception = e2;
        }
    }
    
    СтрокаТеста.ВремяВыполнения = (new Date() - timeBefore) / 1000;

    return this.setTestStatus(theTest, exception);
}

TestRunner.prototype.getDefaultTestsDir = function()
{
    var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
    var f = v8New("Файл", mainFolder + "scripts\\Tests");
    if (f.Существует() && f.ЭтоКаталог())
        return f.ПолноеИмя;
    
    return mainFolder;
}

TestRunner.prototype.КнопкаЗагрузитьТестыНажатие = function(Элемент)
{
    var ВыборКаталога = v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.ВыборКаталога);
    ВыборКаталога.ПолноеИмяФайла = "";
    ВыборКаталога.Заголовок = "Выберите каталог c тестами";
    ВыборКаталога.Каталог = this.getDefaultTestsDir();
        
    if (ВыборКаталога.Выбрать())
    {
        this.loadTests(ВыборКаталога.Каталог);
    }
}

TestRunner.prototype.КнопкаЗагрузитьТестыЗагрузитьТестКейс = function (Элемент)
{
    var ВыборФайла = v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.Открытие);
    ВыборФайла.Заголовок = "Выберите тестовый скрипт";
    ВыборФайла.Каталог = this.getDefaultTestsDir();
        
    if (ВыборФайла.Выбрать())
    {
        this.loadTests(ВыборФайла.ПолноеИмяФайла);
    }
}

TestRunner.prototype.КнопкаВыполнитьВсеТестыНажатие = function (Элемент)
{
    this.runAllTests();
}

TestRunner.prototype.КнопкаВыполнитьВыделенный = function (Элемент)
{
    Message("Не реализовано");
}

TestRunner.prototype.тпДеревоТестовПриВыводеСтроки = function(Элемент, ОформлениеСтроки, ДанныеСтроки)
{
    var Ячейки = ОформлениеСтроки.val.Ячейки;
        
    // Устанавливаем иконку состояния выполнения.
    var Состояние = ДанныеСтроки.val.Состояние;
    
    if (Состояние == this.STATE_SUCCESS)
        Ячейки.НазваниеТеста.УстановитьКартинку(this.StateIcons.Green)        
        
    else if (Состояние == this.STATE_IGNORE)
        Ячейки.НазваниеТеста.УстановитьКартинку(this.StateIcons.Yellow)
        
    else if (Состояние == this.STATE_FAILURE)
        Ячейки.НазваниеТеста.УстановитьКартинку(this.StateIcons.Red)
        
    else
        Ячейки.НазваниеТеста.УстановитьКартинку(this.StateIcons.Gray)
        
}

TestRunner.prototype.ПриЗакрытии = function ()
{
    this.unloadAllTests();    
}
////////////////////////////////////////////////////////////////////////////////////////
//// ВСПОМОГАТЕЛЬНЫЕ ОБЪЕКТЫ И ФУНКЦИИ.
////

function FindFiles(path, mask)
{
    // Из snegopat.js.
    // TODO: Перенести в библиотеку Utils.
	// На NT-системах порядок выдачи файлов в FindFirstFile/FindNextFile неопределен, те они НЕОБЯЗАТЕЛЬНО
	// выдаются отсортированными по именам, поэтому на разных машинах могут выдаваться в разном порядке.
	// Кроме того, каталоги и файлы могут выдаваться вперемешку.
	// Также в документации к НайтиФайлы нет никакого упоминания о порядке выдачи файлов.
	// В случае зависимости одного стандартного скрипта от другого (например, snegopatwnd.js при
	// загрузке сразу обращается к global_context.js) это может привести к проблемам.
	// Поэтом примем такой порядок загрузки:
	// Сначала загружаются все подкатологи, отсортированные по имени.
	// Затем загржаются все файлы, отсортированные по имени.
    
    var allFiles = new Array();
    var files = new Array();
   
    var filesArray = new Enumerator(globalContext("{22A21030-E1D6-46A0-9465-F0A5427BE011}").НайтиФайлы(path.replace(/\\/g, '/'), "*", false));   
    for ( ; !filesArray.atEnd(); filesArray.moveNext())
    {
        var file = filesArray.item();
        (file.ЭтоКаталог() ? allFiles : files).push(file);
    }

    var sortByNames = function (i1, i2) { 
        return i1.Имя.toLowerCase().localeCompare(i2.Имя.toLowerCase()) 
    };

    allFiles.sort(sortByNames);
    files.sort(sortByNames);

    for (var i=0; i<files.length; i++)
        allFiles.push(files[i]);
        
    return allFiles;
}

function Test(addin, testName)
{
    this.addin = addin;
    this.fullTestName = addin.uniqueName + "::" + testName;
    this.testName = testName;
    this.exeption = null;
    this.message = "";
}

function OpenTestRunner()
{
    if (!TestRunner._instance)
        new TestRunner();
    
    return TestRunner._instance;
}




