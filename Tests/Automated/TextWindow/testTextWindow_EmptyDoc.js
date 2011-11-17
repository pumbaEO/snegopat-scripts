$engine JScript
$uname testTextWindow_EmptyDoc
$dname Тесты для класса TextWindow
$addin global
$addin stdcommands
$addin stdlib

/* Отправная точка тестов - пустой текстовый документ. */

stdlib.require('jsUnitCore.js', SelfScript);

var TWW = stdlib.require('TextWindow.js');

var textDoc = null;
var twnd = null;
    
function setUp()
{
    textDoc = v8New("TextDocument");

    textDoc.Show();
    
    twnd = TWW.GetTextWindow();
}

function tearDown()
{
    if (twnd)
        delete twnd;
    
    // Чтобы при закрытии не выдавалось сообщение "Записать?", сохраним документ во временный файл.
    var tempFile = globalContext("{4A993AB7-2F75-43CF-B34A-0AD9FFAEE7E3}").GetTempFileName();
    textDoc.Write(tempFile);
    
    // Закроем окно текстового документа.
    stdcommands.Frame.FileClose.send();    
    
    // Удалим временный файл.
    var f = v8New("File", tempFile);
    globalContext("{22A21030-E1D6-46A0-9465-F0A5427BE011}").DeleteFiles(f.Path, f.Name);
}

function macrosTestAddLine1()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());
    
    twnd.AddLine("Строка текста");
    assertEquals("Строка текста", textDoc.GetText());
}

function macrosTestAddLine2()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());
    
    twnd.AddLine("Строка текста");
    twnd.AddLine("Еще одна строка");
    twnd.AddLine("Третья строчка");
    
    assertEquals("Строка текста\nЕще одна строка\nТретья строчка", textDoc.GetText());
}
