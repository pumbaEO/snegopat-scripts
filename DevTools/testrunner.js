﻿$engine JScript
$uname TestRunner
$dname Менеджер юнит-тестов скриптов
$addin global
$addin stdlib

global.connectGlobals(SelfScript)

var jsUnit = stdlib.require("jsUnitCore.js").object.GetInstance();
//var jsUnit = (new ActiveXObject("Snegopat.jsUnitCore")).GetInstance(Designer);

(new TestRunner());

function Test(addin, testName)
{
    this.addin = addin;
    this.fullTestName = addin.uniqueName + "::" + testName;
    this.testName = testName;
    this.exeption = null;
    this.message = "";
}

function TestRunner()
{
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
        var fullPath = this.loadedTestAddins[i].fullPath;
        
        try
        {
            addins.unloadAddin(this.loadedTestAddins[i]);
        }
        catch (e)
        {
            jsUnit.warn("Ошибка выгрузки тест-кейса " + fullPath);
        }
    }
    
   // delete this.loadedTestAddins;
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

TestRunner.prototype.isAddinFile = function(Файл)
{
    // TODO: проверять, аддин ли это по расширению.
    return true;
}

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

TestRunner.prototype.walkFilesAndLoad = function(path, parentNode)
{
    var files = FindFiles(path, "*", false);
    
    for (var i=0; i<files.length; i++)
    {
        var Файл = files[i];
        
        if (Файл.ЭтоКаталог())
        {
            var newNode = this.addTestGroup(parentNode, Файл);
            this.walkFilesAndLoad(Файл.ПолноеИмя, newNode);
        }
        else if (this.isAddinFile(Файл))
        {
            try
            {
                var testAddin = stdlib.require(Файл.ПолноеИмя);
                this.addTestCase(parentNode, testAddin);
            }
            catch (e)
            {
                jsUnit.warn("Ошибка загрузки скрипта: " + Файл.ПолноеИмя);
                // TODO: выводить информацию об ошибке подробнее.
            }
        }
            
    }        
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
    var newNode = parentNode.Строки.Добавить();
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
    
    if (jsUnit._trueTypeOf(СтрокаТестов.object) == 'Test')
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
            message += ' провалился';
        }
        else 
        {
            //this.failureCount++;
            test.status = this.STATE_FAILURE;
            //test.testPage.failureCount++;
            message += ' остановлен по ошибке';
        }
    }

    test.message = message;
    
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
        if (testAddin.setUp !== jsUnit.JSUNIT_UNDEFINED_VALUE)
            testAddin.setUp();
            
       testAddin.invokeMacros(theTest.testName);
        //eval("testAddin.object." + testFunctionName + "()");        
    }
    catch (e1) 
    {
        exception = e1;
    }
    finally 
    {
        try 
        {
            if (testAddin.tearDown !== jsUnit.JSUNIT_UNDEFINED_VALUE)
                testAddin.tearDown();
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
        return f.Каталог;
    
    return mainFolder;
}

TestRunner.prototype.КнопкаЗагрузитьТестыНажатие = function(Элемент)
{

debugger;

    var ВыборКаталога = v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.ВыборКаталога)
    ВыборКаталога.ПолноеИмяФайла = ""
    ВыборКаталога.Заголовок = "Выберите каталог c тестами"
    ВыборКаталога.Каталог = this.getDefaultTestsDir();
        
    if (ВыборКаталога.Выбрать())
    {
        this.loadTests(ВыборКаталога.Каталог);
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





