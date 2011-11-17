$engine JScript
$uname testStdlibRequire_App
$dname Тест-кейс для метода stdlib::require()
$addin stdlib

var u = stdlib.require('jsUnitCore.js');

function setUp()
{
    // Никакой предварительной подготовки не требуется.
}

function tearDown()
{
    // Подчищаем за собой.
    var libAddin = addins.byUniqueName('testStdlibRequire_Lib');    
    if (libAddin.uniqueName.length)
        addins.unloadAddin(libAddin);
}

function macrosTestRequireWithSelfScript()
{
    var file = v8New('File', SelfScript.fullPath);    
    stdlib.require(file.Path + 'lib.js', SelfScript);

    // Проверяем, загрузилась ли библиотека вообще.
    var libAddin = addins.byUniqueName('testStdlibRequire_Lib');    
    
    if (!libAddin || !libAddin.uniqueName.length)
        u.fail('Библиотека testStdlibRequire_Lib не была загружена!');
            
    // Проверяем, состоялся ли импорт методов библиотеки в глобальное пространство имен.
    u.assert('publicMethod не обнаружен в области видимости вызывающего скрипта', 
        !!SelfScript.self.publicMethod);

    u.assert('exportedMethod вернул некорректное значение', 
        publicMethod() !== "Hello, I'm publicMethod method!");
    
}
