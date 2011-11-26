$engine JScript
$uname testStringUtils
$dname Тесты для класса StringUtils
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);
stdlib.require('TextWindow.js', SelfScript);
  
//{ getIndent()  
function macrosTest_getIndent1_NotIndented()
{
    var s = "";
    assertEquals("", StringUtils.getIndent(s));
    
    s = "first string\n      second string with big indent";
    assertEquals("", StringUtils.getIndent(s));    
    
}

function macrosTest_getIndent2()
{
    var s;
    
    s = "   first line\n        \nsecond line";
    assertEquals("   ", StringUtils.getIndent(s));
}

function macrosTest_getIndent3()
{
    var s = " first line\n      second line";
    assertEquals(" ", StringUtils.getIndent(s));        
}

function macrosTest_getIndent4()
{
    var s = "       first line\nsecond line";
    assertEquals("       ", StringUtils.getIndent(s));        
}

function macrosTest_getIndent5_EmptyLines()
{
    var s = "       \n       \n       first line\nsecond line";
    assertEquals("       ", StringUtils.getIndent(s));        
}

//}

//{ shiftRight()
function macrosTest_shiftRight1()
{
    var s = "first line\nsecond line\nthird line";
    assertEquals(" first line\n second line\n third line", StringUtils.shiftRight(s, " "));
}

function macrosTest_shiftRight2()
{
    var s = "    first line\n    second line\n    third line";
    assertEquals("        first line\n        second line\n        third line", StringUtils.shiftRight(s, "    "));
}

function macrosTest_shiftRight3()
{
    var s = " the only line";
    assertEquals("  the only line", StringUtils.shiftRight(s, " "));
}
//}

//{ shiftLeft()
function macrosTest_shiftLeft1()
{
    var s = " first line\n second line\n third line";
    assertEquals("first line\nsecond line\nthird line", StringUtils.shiftLeft(s, " "));
}

function macrosTest_shiftLeft2()
{
    var s = "        first line\n        second line\n        third line";
    assertEquals("    first line\n    second line\n    third line", StringUtils.shiftLeft(s, "    "));
}

function macrosTest_shiftLeft3()
{
    var s = "  the only line";
    assertEquals(" the only line", StringUtils.shiftLeft(s, " "));
}
//}

//{ endsWith()
function macrosTest_endsWith1()
{
    assertTrue(StringUtils.endsWith("",""));
}

function macrosTest_endsWith2()
{
    assertTrue(StringUtils.endsWith("a","a"));    
}

function macrosTest_endsWith3()
{
    assertFalse(StringUtils.endsWith("a","ab"));    
}

function macrosTest_endsWith4()
{
    assertTrue(StringUtils.endsWith("first string\nsecond string", "ing"));    
}

function macrosTest_endsWith5()
{
    assertFalse(StringUtils.endsWith("first string\nsecond string\n", "ing"));    
}

function macrosTest_endsWith6()
{
    assertTrue(StringUtils.endsWith("first string\nsecond string\n", "ing\n"));
}

function macrosTest_endsWith7()
{
    assertTrue(StringUtils.endsWith("first string\nsecond string", "second string"));
}

//}

//{ toLines()
function macrosTest_toLines1()
{
    assertArrayEquals([""], StringUtils.toLines(""));
}

function macrosTest_toLines2()
{
    assertArrayEquals(["the only string"], StringUtils.toLines("the only string"));
}

function macrosTest_toLines3()
{
    assertArrayEquals(["first line", "second line"], StringUtils.toLines("first line\nsecond line"));
}

function macrosTest_toLines4()
{
    assertArrayEquals(["first line", "", "second line",""], StringUtils.toLines("first line\n\nsecond line\n"));
}

//}

//{ fromLines()
function macrosTest_fromLines1()
{
    assertEquals("", StringUtils.fromLines([""]));
}

function macrosTest_fromLines2()
{
    assertEquals("the only string", StringUtils.fromLines(["the only string"]));
}

function macrosTest_fromLines3()
{
    assertEquals("first line\nsecond line", StringUtils.fromLines(["first line", "second line"]));
}

function macrosTest_fromLines4()
{
    assertEquals("first line\n\nsecond line\n", StringUtils.fromLines(["first line", "", "second line",""]));
}

//}


/* 
function macros()
{    
}
 */