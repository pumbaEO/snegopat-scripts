$engine JScript
$uname selectColumn
$dname Выбор колонки табличного поля

// (c) Александр Орефков
// Небольшой скрипт, позволяющий быстро вставить в код название любой из колонок табличных
// полей, расположенных на обычной форме
// Требует для работы svcsvc

SelfScript.self['macrosВыбрать колонку ТабличногоПоля'] = function()
{
    try{
        var sel = new ActiveXObject('Svcsvc.Service')
    }catch(e)
    {
        Message("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll")
        return
    }
    // Получаем активное текстовое окно
    var wnd = snegopat.activeTextWindow()
    if(!wnd)
        return
    // Проверим, что это Форма.
    // Свойство mdProp показывает, к какому свойству объекта метаданных относится окно
    if(wnd.mdProp.name(1) != "Форма")
        return
    // Получим само свойство "Форма". Это "внешнее" свойство, т.е. оно храниться отдельно от
    // самого объекта метаданных.
    // При получении можно указывать гуид свойства, или его имя, или порядковый номер
    var extProp = wnd.mdObj.getExtProp(wnd.mdProp.id)
    // Сохраним текущее состояние свойства "Форма" в файл. Так как файл в saveToFile не передан, то
    // сохранение произойдет в псевдо-файл в памяти.
    var file = extProp.saveToFile()
    // Для обычных форм формат файла формы является "файлом файлов", storage. Поэтому будем
    // рассматривать его как storage. Для управляемых форм - это не так, там обычный текст utf-8
    try{
        // создадим хранилище на базе файла. Для управляемых форм тут вывалится в catch
        var stg = v8Files.attachStorage(file)
        // Получим из хранилища содержимое под-файла form
        var text = stg.open("form", fomIn).getString(dsUtf8)
        // Простым регэкспом выдернем встречающиеся колонки
        var re = /\{6,3,0,1\},1,0,0,4,0,"(.+)"/g
        var columns = {}
        while(re.exec(text))
            columns[RegExp.$1] = 1
        var arrOfColumns = []
        for(var k in columns)
            arrOfColumns.push(k)
        var choice = sel.FilterValue(arrOfColumns.join("\r\n"), 1 | 4)
        if(choice.length)
        {
            wnd.selectedText = choice
            return true
        }
    }catch(e)
    {
        // Сюда попадаем, если это управляемая форма. Ее можно прочитать так
        //file.seek(0, fsBegin)
        //Message(file.getString(dsUtf8))
    }
}
