$engine JScript
$uname testExceptionsApp

var lib = addins.byUniqueName("testExceptionsLib");

lib.object.SetErrorHandler(ErrorHandler);

function ErrorHandler(except)
{
    throw except;
}

function macrosИсключениеПриВызовеФункции()
{
    try
    {
        lib.object.throwErrorFunction();
    }
    catch (e)
    {
        Message("Gotcha: " + e.message);
    }
}

function macrosИсключениеПриПрограммномВызовеМакроса()
{
    try
    {
        lib.invokeMacros("ThrowErrorMacros");
    }
    catch (e)
    {
        Message("Gotcha: " + e.text);
    }
}

function macrosИсключениеПриВызовеФункцииWorkaround()
{
    try
    {
        lib.object.throwErrorFunctionWorkaround();
    }
    catch (e)
    {
        Message("Gotcha: " + e);
    }
}

