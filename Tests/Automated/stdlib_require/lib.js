$engine JScript
$uname testStdlibRequire_Lib
$dname Скрипт-библиотека для тестирования метода stdlib::require()

var publicObject = {
    'myProperty' : "Hello, I am public object!"
}

function publicMethod()
{
    return "Hello, I'm public method!";
}

function _privateMethod()
{
    return "Hello, I'm private method!";
}