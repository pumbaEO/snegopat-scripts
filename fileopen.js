$engine JScript
$uname fileopen
$dname Открыть файл в Конфигураторе
$addin global
$addin stdcommands

global.connectGlobals(SelfScript)

/* Скрипт для перехвата сохранения файлов для Снегопата и немедленного открытия файлов
 * Автор		: Артур Аюханов aka artbear artbear@gmail.com
 * Дата создания: 04.10.2011
 * Описание		: http://snegopat.ru/forum/viewtopic.php?f=3&t=33
    Скрипт "Немедленное открытие файлов, сохраняемых в Конфигураторе"
    Я часто работаю с отчетами/обработками, встроенными в конфигурацию, следующим образом.
    Сохраняя встроенный отчет/обработку в файл, открываю этот файл (Файл - Открыть - поиск файла в папке, как правило, файлов в папке немало, секунду или две теряется  ), исправляю файл и тут же, не перезапуская Конфигуратор, открываю исправленный файл в режиме Предприятия.
    Думаю, что по такой схеме работаю не я один 
    И вот у меня родилась мысль немного автоматизировать этот процесс:
    разработчик сохраняет отчет/обработку в файл (тут как обычно), 
    а дальше вступает скрипт: перехватывает сохранение файла, узнает имя и путь файла, проверяет расширение этого файла,
    если это внешний отчет/обработка, то скрипт предлагает немедленно открыть этот файл в Конфигураторе.
    Планы: В настройках скрипта можно будет указать:
        всегда открывать такие файлы без вопроса или всегда задавать вопрос,
        расширения открываемых файлов - по умолчанию erf, epf 
 */
var _версияСкрипта = 0.4

var selectedFileName

// Подпишемся на перехват команды сохранения во внешний файл
// Также можно бы еще подписаться на "Файл-Сохранить как", но пока оставим это Артуру
events.addCommandHandler("{55C7732C-0C33-4394-ADCA-9D15082552B6}", 32, SelfScript.self, "hookSaveToExternalFileCommand")

// Перехват команды. Метод вызывается сначала перед выполнением команды, потом после выполнения (если не отменили)
function hookSaveToExternalFileCommand(cmd)
{
    if(cmd.isBefore)
    {
        selectedFileName = ""
        // Подпишемся на событие открытия диалога выбора файла
        events.connect(Designer, "onSelectFile", SelfScript.self)
    }
    else
    {
        // Отпишемся от события открытия диалога выбора файла
        events.disconnect(Designer, "onSelectFile", SelfScript.self)
        // И откроем сохраненный файл
        if(selectedFileName.length)
            OpenFile(selectedFileName)
    }
}

// Обработчик, вызывается когда 1С использует диалог для запроса имени файла.
// Подключается и отключается в hookSaveToExternalFileCommand
function onSelectFile(selectFileData) //As ISelectFileData
{
    if(selectFileData.result != sfrNormal)
    {
        // Значит какой-то другой обработчик до нас уже что-то сделал
        if(selectFileData.result == sfrSelected && selectFileData.filesCount == 1)
        {
            // И при этом он не отменил операцию, и указал один файл
            // Запомним его, чтобы попытаться потом открыть
            selectedFileName = selectFileData.selectedFile(0)
        }
        return
    }
    // Сами получим имя файла для сохранения, чтобы знать, что открывать
    // ВАЖНО. Событие "onSelectFile" генерится как при системных запросах 1С,
    // так и при использовании в скриптах метода ДиалогВыбораФайла::Выбрать,
    // кроме тех случаев, когда ДиалогВыбораФайла::Выбрать используется в обработчиках
    // события onSelectFile, дабы избежать зацикливания.
	var selDlg = v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.Сохранение);
	selDlg.Заголовок = selectFileData.title.length ? selectFileData.title : "Сохранить во внешний отчет/обработку"
	selDlg.ПолноеИмяФайла = selectFileData.initialFileName
	selDlg.Каталог = selectFileData.folder
	
    for (var i = 0 ; i < selectFileData.filtersCount; i++) {
        filterVal = selectFileData.filterVal(i)
        selDlg.Фильтр += selectFileData.filterDescr(i)+" ("+filterVal+")|"+filterVal + "|"
    }
	if(!selDlg.Выбрать())
	    selectFileData.result = sfrCanceled
	else
	{
	    selectedFileName = selDlg.ПолноеИмяФайла
        selectFileData.addSelectedFile(selectedFileName)
	    selectFileData.result = sfrSelected
    }
}

var Text = '00000000-0000-0000-0000-000000000000' // простой текст
var TextOem = '74d75a51-58b7-46b0-931a-f3bac20e596e' // простой текст - кодировка Dos/Oem
var Epf = '0e0e54cf-253b-4fc9-a895-26897e1a51f7' // обработки
var Erf = '6d01520c-23c6-4301-86f7-e81268f07ee3' // отчеты
var Moxel = 'e555a6fe-768f-476a-bf4b-1d945aa56099' // табличный документ
var Configuration = 'c64ce8a4-a74d-40e9-996e-feadca885e11' // файл конфигурации
var Template = '03ad782c-900b-4594-bdb7-66ed05992b8b' // файл шаблонов

var kindArray = new Array(Text, TextOem, Epf, Erf, Moxel, Configuration, Template)

function Test()
{
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function (obj, fromIndex) {
        if (fromIndex == null) {
            fromIndex = 0;
        } else if (fromIndex < 0) {
            fromIndex = Math.max(0, this.length + fromIndex);
        }
        for (var i = fromIndex, j = this.length; i < j; i++) {
            if (this[i] === obj)
                return i;
        }
        return -1;
      };
    }
    assert(0, kindArray.indexOf(Text))
    assertNot(-1, kindArray.indexOf(Text))
}

    // try{
    //    _macrosTestOpenFile()
    // }
    // catch(e){
        // Message("ошибка macrosTestOpenFile() - "+e)
        // //Message("ошибка macrosTestOpenFile()") // - "+e)
    // }

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

function _macrosTestOpenFile()
{
    //var filepath = "c:\\test\\snegopat\\core\\std\\scripts\\0_global_context.js"
    var filepath = "T:\\Snegopat\\Starter\\scripts\\configCaption.js"

    Message("1")
    try{
        OpenFile(filepath)        
    }
    catch(e){ Message("Неудача") }

    Message("2")
    try{
        OpenFile(filepath, "")
    }
    catch(e){ Message("Неудача") }

    Message("3")
    try{
      OpenFile(filepath, "1")
        Message("Неудача")
    }
    catch(e){}
}

function assert(p1, p2)
{
    if (p1 != p2) 
        throw "Значение <"+p1+"> не равно <"+p2+">, а ожидали равенство";
}
function assertNot(p1, p2)
{
    if (p1 == p2) 
        throw "Значение <"+p1+"> равно <"+p2+">, а ожидали неравенство";
}

//Еще один параметр в методе OpenFile - тип документа (их лучше задать символьными константами)
//Если тип не передан, попытаться найти его по расширению файла.
//Если расширение непонятное, использовать нулевой гуид.
//
//то есть чтобы можно было пользоваться так:
//$addin fileopen of
//fo.OpenFile(path)
//fo.OpenFile(path, fo.TextOEM)
//fo.OpenFile(path, fo.Template)
//и тд и тп.
//
function OpenFile(filepath) //, filekind)
{
    Message("Открываем файл "+filepath)
    // Подготовим наше значение для MRU - списка
    kind = Text
        // if (filekind)
            // kind = filekind
        // if (-1 == kindArray.indexOf(kind))
            // throw "Неверный параметр filekind = "+filekind
    
    var mruItem = ЗначениеИзСтрокиВнутр('{"#",36973550-6bbb-11d5-bf72-0050bae2bc79,\n' +
    '{1,\n' +
    '{"file://' + filepath + '",0},' + kind + '}\n' +
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
    stdcommands.Frame.RecentFile.getState()
    stdcommands.Frame.RecentFile.send(0)
    
    return true
}

//Вот так пытливый ум преодолевает преграды.

//ЗЫ: Для просмотра MRU использовался следующий код:
function macrosИсследоватьMRU()
{
    var mru = profileRoot.getValue("App/MRUFileList")
    for(var i = new Enumerator(mru); !i.atEnd(); i.moveNext())
    {
        Message("v=" + ЗначениеВСтрокуВнутр(i.item().Значение), mExc3)
    }
}
//В просмотре профайла мне помогло scripts\devtools\pflview.js
