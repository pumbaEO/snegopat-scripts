$engine JScript
$uname testExample3TestCase
$dname testExample3TestCase
$addin global
$addin stdlib

var u = stdlib.require('jsUnitCore.js');
 
function setUp()
{
    u.debug("setUp()");
}
    
function tearDown()
{
    u.debug("tearDown()");
}
    
function macrosTest1()
{
    u.assert("Test1", true);
}

function macrosTest2()
{
    u.assert("Test2", true);
}    

function macrosTest3()
{
    u.assert("Test3", true);
}    
