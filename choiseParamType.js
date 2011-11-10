$engine JScript
$dname Выбор типа в подсказке о параметрах

/* (c) Александр Орефков
 * Скрипт содержит макрос, позволяющий при наличии в подсказке о параметрах нескольких методов
 * быстро выбрать нужный по типу, к которому относится метод.
 * Естественно, раз быстрый выбор, то требует для работы svcsvc.dll
 */

function macrosВыбратьТипПараметра()
{
    var paramPos = snegopat.paramsPosition()
    if(paramPos)    // Подсказка видна
    {
        var types = new VBArray(snegopat.paramsTypes()).toArray()
        if(types.length > 1)
        {
            try{
            var sel = new ActiveXObject('Svcsvc.Service')
            }catch(e)
            {
                Message("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll")
                return false
            }
            var choice = sel.FilterValue(types.join("\r\n"), 1 | 8, '', paramPos.beginCol + 10, paramPos.beginRow + 20, paramPos.endCol - paramPos.beginCol - 20)
            if(choice.length)
            {
                for(var k in types)
                {
                    if(types[k] == choice)
                        break
                }
                return snegopat.setParamType(k)
            }
        }
    }
    return false
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(3)
    predef.add("ВыбратьТипПараметра", "Ctrl + 2")
}
