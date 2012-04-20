$engine JScript
$uname formAutoVersion
$dname Авто-простановка версии на форме
$addin stdcommands

// Александр Орефков

function onFileSave(cmd)
{
    if(cmd.isBefore)    // Обработчик вызван перед выполнением команды
    {
        // Получим объект метаданных текущего окна
        var mdObj, av = windows.getActiveView()
        if(!av || !(mdObj = av.mdObj))
            return
        // Посмотрим, не внешний ли отчет/обработка сохраняется.
        if(mdObj.container != mdObj.container.masterContainer)
        {
            // Тут надо перебрать все формы.
            mdObj = mdObj.container.rootObject
            var dateStr = new Date().toLocaleString() 
            var needAsk = -1
            for(var i = 0, formsCount = mdObj.childObjectsCount("Формы"); i < formsCount; i++)
            {
                var formMDObj = mdObj.childObject("Формы", i)
                //MessageBox(formMDObj.name)
                var form = formMDObj.getExtProp("Форма").getForm()
                if(form)
                {
                    var label = form.Controls.Find("ВерсияНадпись")
                    if(!label)
                    {
                        if(needAsk == -1)
                            needAsk = MessageBox("Добавить на формы надпись с версией?", mbYesNo | mbIconQuestion | mbDefButton1) == mbaYes ? 1 : 0
                        if(needAsk == 1)
                        {
                            // Надо добавить надпись
                            label = form.Controls.Add(v8New("ОписаниеТипов", "Надпись").Типы().Получить(0), "ВерсияНадпись", true)
                            label.Заголовок = "Версия 0"
                            form.Высота += 20
                            label.Лево = 0
                            label.Верх = form.Высота - 20
                            label.Высота = 20
                            label.Ширина = form.Ширина
                        }
                    }
                    if(label)
                    {
                        // Надпись найдена. Надо увеличить номер версии
                        var currentVersion = parseInt(label.Заголовок.match(/\d+/)[0])
                        label.Заголовок = "Версия " + (currentVersion + 1) + " (" + dateStr + ")"
                    }
                }
            }
        }
    }
}
// Добавим обработчик команды синтакс-проверки
stdcommands.Frame.FileSave.addHandler(SelfScript.self, "onFileSave")

