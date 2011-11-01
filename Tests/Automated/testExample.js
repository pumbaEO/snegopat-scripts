$engine JScript
$uname testExampleTestCase
$dname Пример тест-кейса
$addin stdlib

var u = stdlib.require('jsUnitCore.js').object.GetInstance();
 
function setUp()
{
    // Вызывается перед выполнением теста.
}
    
function tearDown()
{
    // Вызывается после выполнения теста.
}
    
// Пример успешного теста.
function macrosTestSuccessfulTest()
{
    u.assert("Пример проверки 1", true);
}

function macrosTestFailedTest()
{
    u.assert("Пример проверки 2", false);
}    

