$engine JScript
$uname testExample2TestCase
$dname Пример 2 тест-кейса
$addin global
$addin stdlib

var u = stdlib.require('jsUnitCore.js');
 
function setUp()
{
    // Вызывается перед выполнением теста.
    u.debug("setUp()");
}
    
function tearDown()
{
    // Вызывается после выполнения теста.
    u.debug("tearDown()");
}
    
// Пример успешного теста.
function macrosTestSuccessfulTest()
{
    u.assert("Пример проверки 1", true);
}

function macrosTestSuccessfulTest2()
{
    u.assert("Пример проверки 2", true);
}    

