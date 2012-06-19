$engine JScript
$uname testTextWindow
$dname Тесты для класса TextWindow
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);

var TWW = stdlib.require('TextWindow.js');

var text = "первая строка\nвторая строка\nтретья строка\nчетвертая строка - самая длинная из всех строк\n"
    + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";

var textDoc = null;
var twnd = null;
    
function setUp()
{
    textDoc = v8New("TextDocument");
    textDoc.SetText(text);

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

function macrosTestGetText()
{    
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    
    
    assertEquals("Полученный текст отличается от содержимого текстового окна!", text, twnd.GetText());
}

function macrosTestSetText()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    var testText = "Проверка установки текста\nпрограммно из скрипта";    
    twnd.SetText(testText);
    assertEquals("Установленный и полученный тексты отличаются", testText, textDoc.GetText());
}

function macrosTestRangeGetText()
{
    var r;
    
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    
        
    // Первый символ.
    r = twnd.Range(1, 1, 1, 1);
    assertEquals("(1) Текст не соответствует ожидаемому", 
        "п", r.GetText());

    // Последний символ.
    r = twnd.Range(7, 14, 7, 14);
    assertEquals("(2) Текст не соответствует ожидаемому", 
        "а", r.GetText());
        
    // Первое слово.
    r = twnd.Range(1, 1, 1, 6);
    assertEquals("(3) Текст не соответствует ожидаемому", 
        "первая", r.GetText());

    // Первая строка.
    r = twnd.Range(1,1,1);
    assertEquals("(4) Текст не соответствует ожидаемому", 
        "первая строка", r.GetText());
        
    // Две строки.
    r = twnd.Range(2, 1, 3);
    assertEquals("(5) Текст не соответствует ожидаемому", 
        "вторая строка\nтретья строка", r.GetText());
        
    // Произвольный фрагмент.
    r = twnd.Range(3, 8, 5, 21);
    assertEquals("(6) Текст не соответствует ожидаемому", 
        "строка\nчетвертая строка - самая длинная из всех строк\nпятая строка покороче", r.GetText());

    // Последняя строка.
    r = twnd.Range(7, 1, 7);
    assertEquals("(6) Текст не соответствует ожидаемому", 
        "седьмая строка", r.GetText());
        
}

function macrosTestRangeSetText1()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Изменение содержимого одной строки.
    var s1 = "первая строка\nsecond row\nтретья строка\nчетвертая строка - самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";
        
    var r = twnd.Range(2, 1, 2).SetText("second row");
    assertEquals(s1, textDoc.GetText());
}

function macrosTestRangeSetText2()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Изменение содержимого нескольких строк.
    var s2 = "первая строка\nsecond row\nthird row\nfour row\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";
        
    var r = twnd.Range(2, 1, 4).SetText("second row\nthird row\nfour row");
    assertEquals(s2, textDoc.GetText());    
}

function macrosTestRangeSetText3()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Изменение произвольного участка текста.
    var s3 = "первая строка\nвторая строка\nтретья строчка теперь будет длиньше любой другой строки\n"
        + "четвертая строка - не самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";
        
    var r = twnd.Range(3, 12, 4, 18).SetText("чка теперь будет длиньше любой другой строки\nчетвертая строка - не");
    assertEquals(s3, textDoc.GetText());
}

function macrosTestGetLines()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Все строки.
    var a1 = ["первая строка", "вторая строка", "третья строка", 
        "четвертая строка - самая длинная из всех строк",
        "пятая строка покороче, но тоже ничего",
        "шестая строка", "седьмая строка"];    
    assertArrayEquals("(1) Массивы строк отличаются.", a1, twnd.GetLines());
       
    // Первая строка.
    var a2 = ["первая строка"];
    assertArrayEquals("(2) Массивы строк отличаются.", a2, twnd.GetLines(1));
    
    // Последняя строка.
    var a3 = ["седьмая строка"];
    assertArrayEquals("(3) Массивы строк отличаются.", a3, twnd.GetLines(7));

    // Диапазон строк.
    // Все строки.
    var a4 = ["четвертая строка - самая длинная из всех строк",
        "пятая строка покороче, но тоже ничего","шестая строка"];    
    assertArrayEquals("(4) Массивы строк отличаются.", a4, twnd.GetLines(4, 6));
    
}

function macrosTestGetLine()
{	
	assertTrue('Нет активного текстового окна!', twnd.IsActive());    
	
	assertEquals("(1) Строка отличается от ожидаемой", "первая строка", twnd.GetLine(1));
	assertEquals("(2) Строка отличается от ожидаемой", "четвертая строка - самая длинная из всех строк", twnd.GetLine(4));
	assertEquals("(3) Строка отличается от ожидаемой", "седьмая строка", twnd.GetLine(7));
}

function macrosTestDeleteLine1()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Удаляем первую строку
    twnd.DeleteLine(1);
    var t1 = "вторая строка\nтретья строка\nчетвертая строка - самая длинная из всех строк\n"
    + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";
    assertEquals(t1, textDoc.GetText());    
}

function macrosTestDeleteLine2()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Удаляем последнюю строку
    twnd.DeleteLine(7);
    var t1 = "первая строка\nвторая строка\nтретья строка\nчетвертая строка - самая длинная из всех строк\n"
    + "пятая строка покороче, но тоже ничего\nшестая строка";
    assertEquals("Удаление последней строки сломано: не удаляется конечный перевод строки (\\n)", t1, textDoc.GetText());    
}

function macrosTestDeleteLine3()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    // Удаляем строку из середины текста.
    twnd.DeleteLine(5);
    var t1 = "первая строка\nвторая строка\nтретья строка\nчетвертая строка - самая длинная из всех строк\n"
    + "шестая строка\nседьмая строка";
    assertEquals(t1, textDoc.GetText());    
}

function macrosTestAddLine()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    
    
    var t = "первая строка\nвторая строка\nтретья строка\nчетвертая строка - самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка\nвосьмая строка";
    twnd.AddLine("восьмая строка");
    assertEquals(t, textDoc.GetText());
}

function macrosTestInsertLine1()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    var t = "эта строка должна быть первой\nпервая строка\nвторая строка\nтретья строка\n"
        + "четвертая строка - самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";

    twnd.InsertLine(1, "эта строка должна быть первой");
    assertEquals(t, textDoc.GetText());
}

function macrosTestInsertLine2()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    var t = "первая строка\nвторая строка\nтретья строка\n"
        + "эта строка теперь будет четвертой\nчетвертая строка - самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка";

    twnd.InsertLine(4, "эта строка теперь будет четвертой");
    assertEquals(t, textDoc.GetText());
}

function macrosTestInsertLine3()
{
    assertTrue('Нет активного текстового окна!', twnd.IsActive());    

    var t = "первая строка\nвторая строка\nтретья строка\n"
        + "четвертая строка - самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nседьмая строка\nэта строка будет последней";

    twnd.InsertLine(8, "эта строка будет последней");
    assertEquals(t, textDoc.GetText());
}

function macrosTestInsertLine4()
{
    var t = "первая строка\nвторая строка\nтретья строка\n"
        + "четвертая строка - самая длинная из всех строк\n"
        + "пятая строка покороче, но тоже ничего\nшестая строка\nэта строка будет предпоследней\nседьмая строка";

    twnd.InsertLine(7, "эта строка будет предпоследней");
    assertEquals(t, textDoc.GetText());
}

function macrosTestClear()
{
    twnd.Clear();
    assertEquals("", textDoc.GetText());
}

//{ Тесты метода GetWordUnderCursor()

/*
первая строка
вторая строка
третья строка
четвертая строка - самая длинная из всех строк
пятая строка покороче, но тоже ничего
шестая строка
седьмая строка";
*/

function macrosTestGetWordUnderCursor1() {
    twnd.SetCaretPos(1, 1);
    assertEquals('первая', twnd.GetWordUnderCursor());
}

function macrosTestGetWordUnderCursor2() {
    twnd.SetCaretPos(1, 10);
    assertEquals('строка', twnd.GetWordUnderCursor());
}

function macrosTestGetWordUnderCursor3() {
    twnd.SetCaretPos(4, 24);
    assertEquals('самая', twnd.GetWordUnderCursor());
}

function macrosTestGetWordUnderCursor5() {
    twnd.SetCaretPos(3, 13);
    assertEquals('строка', twnd.GetWordUnderCursor());
}

function macrosTestGetWordUnderCursor6() {
    twnd.SetCaretPos(7, 14);
    assertEquals('строка', twnd.GetWordUnderCursor());
}

function macrosTestGetWordUnderCursor7() {
    twnd.SetCaretPos(3, 7);
    assertEquals('', twnd.GetWordUnderCursor());
}

function macrosTestGetWordUnderCursor8() {
    twnd.SetCaretPos(4, 19);
    assertEquals('', twnd.GetWordUnderCursor());
}
//}
