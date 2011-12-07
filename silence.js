$engine JScript
$uname silence
$dname Тишина в отсеках

// (с) Александр Орефков orefkov at gmail.com
// Это небольшой скрипт для подавления некоторых сообщений Конфигуратора, бессмысленных и беспощадных.
// Пока реализовано "в-лоб", в дальнейшем надо сделать список из "регэксп + результат",
// и гуи по настройке, какие подавлять, какие нет.

// Подпишемся на событие при выводе предупреждения/вопроса
events.connect(windows, "onMessageBox", SelfScript.self)

// Функция - обработчик
function onMessageBox(param)
{
	// Message(param.caption + " | " + param.text + " | " + param.type + " | " + param.timeout)
	// При отработке события перехват с MessageBox'а снимается, и в обработчике
	// можно смело его вызывать, не боясь зацикливания. Например мы сами хотим узнать ответ
	// пользователя и в зависимости от него выполнить какие-то действия
	// param.result = MessageBox(param.text, param.type, param.caption, param.timeout)
	// param.cancel = true

	if(param.text == "Внимание!!! Месторасположение информационной базы изменилось.\nПродолжить?")
	{
	    //Message("Месторасположение информационной базы изменилось.", mInfo)
	    param.result = mbaYes
	    param.cancel = true
        return;
	}
    
    // artbear сообщения типа "Объект Роль.Менеджер заблокирован."
    reRoleBlock = /Объект\s*Роль\.[\d\wzа-яё]+\s*заблокирован\./ig
    if(reRoleBlock.test(param.text)){
	    param.result = mbaYes
	    param.cancel = true
        return;
    }
}
