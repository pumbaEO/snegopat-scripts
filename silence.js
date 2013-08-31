$engine JScript
$uname silence
$dname Тишина в отсеках
$addin stdlib
$addin stdcommands

// (с) Александр Орефков orefkov at gmail.com
// Это небольшой скрипт для подавления некоторых сообщений Конфигуратора, бессмысленных и беспощадных.
// Пока реализовано "в-лоб", в дальнейшем надо сделать список из "регэксп + результат",
// и гуи по настройке, какие подавлять, какие нет.

// Подключение библиотеки log4js, для удобвного логгирования различных событий. 
stdlib.require('log4js.js', SelfScript);

var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
// Определяем формат вывода сообщений. 
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
logger.addAppender(appender);
logger.setLevel(Log4js.Level.ERROR);

// # Подпишемся на событие при выводе предупреждения/вопроса
// ## подписки на события показа окон: 
// __onMessageBox__ - для модальных блокирующих окошек типа Предупреждение. 
// __onDoModal__ - для модальных окошек типа "Вопрос" , в частности для включенной "провекри синтасиса при записи"" подключаемся на событие модального окна. 
//
events.connect(windows, "onMessageBox", SelfScript.self)
if (profileRoot.getValue("ModuleTextEditor/CheckAutomatically")){
    events.connect(windows, "onDoModal", SelfScript.self);  
}
var notify = true;
// # onMessageBox
//  Функция - обработчик
// ## Параметры
// __param__ - словарь содержащий все параметры Предупреждения
// ``` 1c
// Message(param.caption + " | " + param.text + " | " + param.type + " | " + param.timeout)
//```
function onMessageBox(param)
{

    // При отработке события перехват с MessageBox'а снимается, и в обработчике
    // можно смело его вызывать, не боясь зацикливания. Например мы сами хотим узнать ответ
    // пользователя и в зависимости от него выполнить какие-то действия
    // param.result = MessageBox(param.text, param.type, param.caption, param.timeout)
    // param.cancel = true

    if(param.text == "Внимание!!! Месторасположение информационной базы изменилось.\nПродолжить?")
    {
        param.result = mbaYes
        param.cancel = true
        return;
    }
    
    // сообщения типа "Объект Роль.Менеджер заблокирован." или "Объект Справочник.СохраненныеНастройки заблокирован."
    reRoleBlock = /Объект\s*[\d\wzа-яё]+\.[\d\wzа-яё\.]+\s*заблокирован\./ig
    if(reRoleBlock.test(param.text)){
        Message(param.text)
        param.result = mbaYes
        param.cancel = true
        return;
    }
    
    // сообщения типа "Объединение конфигураций завершено."
    reConfigUnionEnd = /объединение\s+конфигураций\s+завершено\./ig
    if(reConfigUnionEnd.test(param.text)){
        param.result = mbaYes
        param.cancel = true
        Message(param.text)
        return;
    }
}
// Перехватываем модальное окошко и если в первом контроле в тексте содержиться 
// фраза "При проверке модуля обнаружены ошибки!" тогда подавляем данно сообщение с выводом в трее неблокируюещего 
// сообщения о наличии ошибок. 
function onDoModal(dlgInfo){
    if(dlgInfo.stage == openModalWnd)
    {
        if (dlgInfo.Caption == "Конфигуратор"){

            for(var c = 0; c < dlgInfo.form.controlsCount; c++)
            {
                if (c > 2){
	               //Опытным путем подобранно, что больше чем 2 контрола нет на форме, соответственно если больше, то это не наша форма. 
                    return;
                }
                var ctr = dlgInfo.form.getControl(c);
                
                //Определим текстовое значение, если не заполненно, значит это не наш случай. 
                var text = ctr.value;
                if (!text){
                    continue;
                }

                if (text.indexOf("При проверке модуля обнаружены ошибки!")!=-1){
                    try{
			         //Создадим объект sendkeys и отправим нажатие ENTER
                     //TODO: исправить на нативное нажатие кнопки. 
                        new ActiveXObject("WScript.Shell").SendKeys("{ENTER}");
                        if (notify)
                        {
			             //Создается объект notify для возможности отправить сообщение. 
			             //анализируем параметры системы и версии 1С, для версий выше 8.2.13 пользуемся стандартным сообщением пользователю. 
                          var notifysend = stdlib.require('NotifySend.js').GetNotifySend();
                          var СистемнаяИнформация = v8New("СистемнаяИнформация");
                          var версия = СистемнаяИнформация.ВерсияПриложения;
                          if (версия.indexOf("8.2.13")==-1){
                              notifysend.provider = notifysend.initprovider("Встроенный1С");
                          }
                          notifysend.Error("Сохраняем ", "При сохранении есть ошибки \n имей ввиду", 3);
                          notify = false;
                          stdlib.setTimeout(function () {
                              notify = true;
                          }, 3000);
                        }
                    } catch (e){
                };
                return
                }
            }
       }
    }
}

// # DebugSilence
// 
// Во время активной разработки очень часто приходится перезапускать предприятие, открытое в режиме отладки 
// при этом каждый раз от пользователя ждут различных действий, таких как подтверждение перезапуска предприятия и подтверждения обновления базы данных. По факту получается для перезаска отладки неоходимо нажать F5 , потом ответить утвердительно на вопрос "Перезапустить предприятие", и снова ответь на вопрос "Обнвоить ли базу данных!". 
// Если посчитать сколько в день приходиться нажимать F5 потом enter, enter, то в итоге родился такой скрипт, который анализирует текущее состояние базы (отличаются конфигурации), при этом у нас включен режим отладки - значит мы в режиме отладки что-то подправили и теперь пытаемся перезапустить предприяте.
DebugModeHelper = stdlib.Class.extend({

    construct : function () {    
        DebugModeHelper._instance = this;
        //events.connect(windows, "onDoModal", this);
        stdcommands.CDebug.Start.addHandler(this, "onRestartDebug");
        this.first = false;
    },
 
     //Перехватим событие о старте отладки . 
     onRestartDebug:function(cmd){
        if(cmd.isBefore)
        {   
            if (stdlib.isConfigsDifferent() && this.isDebugEnabled()){
                this.first = false;
                events.connect(windows, "onDoModal", this, "onDoModalRestart");    
            }
        }  else {
            try{
                events.disconnect(windows, "onDoModal", this, "onDoModalRestart");
            } catch (e) {}
        }
    },
    
    
    // Определим находимся ли в режиме отладки или нет. 
    isDebugEnabled:function()
    {
        // Команда "Перезапустить " неактивна - значит, мы не в режиме отладки.
        var state = stdcommands.CDebug.Restart.getState()
        return state && state.enabled
    },


    onDoModalRestart:function(dlgInfo){
        
        if(dlgInfo.caption == "Конфигуратор" && dlgInfo.stage == afterInitial)
        {
            try{
                var text = dlgInfo.form.getControl(0).value;
                if (text == "Приложение запущено. Перезапустить?") {
                    if (stdlib.isConfigsDifferent()){
                        this.first = true;
                        dlgInfo.form.sendEvent(dlgInfo.form.getControl(2).id, 0);
                    }
                } else if(text == "Редактируемая конфигурация отличается от конфигурации базы данных.\nОбновить конфигурацию базы данных?" && this.first) {
                    this.first = false;
                    dlgInfo.form.sendEvent(dlgInfo.form.getControl(2).id, 0);
                }
            } catch (e){
                logger.debug(e.description);

            };
        }
    }
})

function GetDebugModeHelper() {
    if (!DebugModeHelper._instance)
        new DebugModeHelper();
    return DebugModeHelper._instance;
}
// ### Инициализия класса . 
//
//  Для отключения, достаточно только закомментировать данную строкоу.  
// TODO: добавить включение, выключение данного поведения. 
var dbg = GetDebugModeHelper();