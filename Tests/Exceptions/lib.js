$engine JScript
$uname testExceptionsLib

var ErrorHandler = null;

function SetErrorHandler(errorHandler)
{
    ErrorHandler = errorHandler;
}

function throwError(e)
{
    if (ErrorHandler)
    {
        ErrorHandler.call(null, e);   
        //ErrorHandler(e);   
        return e;
    }

    throw e;
}

function throwErrorFunction()
{
    throw "Excepiton from testExceptionsLib.throwErrorFunction()";
}

function macrosThrowErrorMacros()
{
    throw "Excepiton from testExceptionsLib.throwErrorMacros()";
}

function throwErrorFunctionWorkaround()
{
    throwError("Excepiton from testExceptionsLib.throwErrorFunction()");
}

