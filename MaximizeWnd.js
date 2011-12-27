$engine JScript
$uname MaximizeWindow
$dname Максимизирует окно текстового документа при открытии

events.connect(Designer, "createTextWindow", SelfScript.Self);

function createTextWindow(textWnd) {

    // Проверим, не открывается ли это какое-либо дочернее окно из конструктора запросов.
    if (textWnd.extName == "Язык запросов")
        return;
    
    try 
    {
        var wsh = new ActiveXObject("WScript.Shell");
        wsh.SendKeys("%-{DOWN}{DOWN}{DOWN}{DOWN}{DOWN}{ENTER}");
        // Из-за того, что пункт меню "Развернуть" у уже максимизированного окна не доступен,
        // Enter не закроет это меню, и приходится посылать Esc, который в случае не развернутого
        // окна безобиден и не вызовет никаких действий.
        wsh.SendKeys("{ESC}");
    }
    catch (e) 
    {
        // do nothing
    }    
}