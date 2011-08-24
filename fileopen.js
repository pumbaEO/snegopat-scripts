$engine JScript
$uname fileopen
$dname Открыть файл в Конфигураторе
$addin global
$addin stdcommands

global.connectGlobals(SelfScript)

// JScript source code
//24.08.2011 11:34:38 orefkov добавил:
//Тут возник вопрос по поводу открытия файлов в Конфигураторе.
//В объектной модели снегопата этого нет. Однако, вспомнив, как я открывал ert-шки в Конфигураторе 7ки в опенконфе, решил тряхнуть стариной и провернуть такой же финт ушами.

//А в опенконфе я их открывал просто - добавлял имя файла в начало MRU (это список недавно открываемых файлов, появляющийся в меню Файл) и посылал команду "Открыть нулевой файл из списка MRU".

//После десяти минут проб и ошибок в JS-Immediate, все получилось.

//Итак, по порядку

//Список MRU лежит (сюрприз!!!) в профайле 1С по пути (еще сюрприз!!!) - "App/MRUFileList"
//Этот список - обычный список значений, правда значения в нем не обычные.
//С помощью ЗначениеВСтрокуВнутр разобрался, что там лежит, а с помощью ЗначениеИзСтрокиВнутр - смог создать нужное мне значение.
//В этом значении главное - путь к файлу и какой-то гуид, очевидно обозначающий тип документа, который должен открывать этот файл. Для текстовых доков гуид прост - сплошные нули. Для других видов доков надо исследовать, перебирая значения из MRUFileList, и смотря на них через ЗначениеВСтрокуВнутр
//Далее просто впихнул свое значение в начало списка, сохранил весь список в профайл, и послал нужную команду.
//Вот код:

function macrosTestOpenFile()
{
    //var filepath = "c:\\test\\snegopat\\core\\std\\scripts\\0_global_context.js"
    var filepath = "T:\\Snegopat\\Starter\\scripts\\configCaption.js"
    OpenFile(filepath)
}

function OpenFile(filepath)
{
    // Подготовим наше значение для MRU - списка
    var docKind = '00000000-0000-0000-0000-000000000000' // простой текст
    var docOemKind = '74d75a51-58b7-46b0-931a-f3bac20e596e' // простой текст - кодировка Dos/Oem
    var epfKind = '0e0e54cf-253b-4fc9-a895-26897e1a51f7' // обработки
    var erfKind = '6d01520c-23c6-4301-86f7-e81268f07ee3' // отчеты
    var mxlKind = 'e555a6fe-768f-476a-bf4b-1d945aa56099' // табличный документ
    var mxlKind = 'c64ce8a4-a74d-40e9-996e-feadca885e11' // файл конфигурации
    var stKind = '03ad782c-900b-4594-bdb7-66ed05992b8b' // файл шаблонов
    
    var mruItem = ЗначениеИзСтрокиВнутр('{"#",36973550-6bbb-11d5-bf72-0050bae2bc79,\n' +
    '{1,\n' +
    '{"file://' + filepath + '",0},' + docKind + '}\n' +
    '}')

    // Получим текущий список MRU из настроек
    var mru = profileRoot.getValue("App/MRUFileList")
    // Если там уже есть наше значение, удалим его
    var hasInMru = mru.НайтиПоЗначению(mruItem)
    if(hasInMru)
       mru.Удалить(hasInMru)
    // Если список полон, удалим последний элемент
    if(mru.Количество() == 8)
       mru.Удалить(7)
    // Вставим значение для нашего файла в начало списка
    mru.Вставить(0, mruItem)
    // Сохраним MRU-список обратно в настройки
    profileRoot.setValue("App/MRUFileList", mru)
    // И зашлем команду
    //var cmd = addins.byUniqueName("stdcommands").object
    //cmd.Frame.RecentFile.getState()
    //cmd.Frame.RecentFile.send(0)
    stdcommands.Frame.RecentFile.getState()
    stdcommands.Frame.RecentFile.send(0)
}

//Вот так пытливый ум преодолевает преграды.

//ЗЫ: Для просмотра MRU использовался следующий код:
function ИсследоватьMRU()
{
    var mru = profileRoot.getValue("App/MRUFileList")
    for(var i = new Enumerator(mru); !i.atEnd(); i.moveNext())
    {
	    Message("v=" + ЗначениеВСтрокуВнутр(i.item().Значение), mExc3)
    }
}
//В просмотре профайла мне помогло scripts\devtools\pflview.js
