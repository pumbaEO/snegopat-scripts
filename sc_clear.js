$engine JScript
$uname syntax_check_clear
$dname Очистка перед проверкой
$addin stdcommands

// Александр Орефков
// Это небольшой скрипт для очистки окна сообщений перед синтакс-проверкой модуля.
// Достаточно просто подключить его в addins.ini, и окно сообщений будет автоматически
// очищаться перед синтакс-проверкой.

function onSyntaxCheck(cmd)
{
    if(cmd.isBefore)    // Обработчик вызван перед выполнением команды
    {
        // Есть два способа:
        // либо подключить глобальные контексты и вызвать ОчиститьОкноСообщений:
        // либо просто послать команду очистки окна
        stdcommands.Frntend.ClearMessageWindow.send()
    }
}
// Добавим обработчик команды синтакс-проверки
stdcommands.Frntend.SyntaxCheck.addHandler(SelfScript.self, "onSyntaxCheck")

