$engine JScript
$uname winapi
$dname Библиотека доступа к WinAPI посредством dynwrapx
$addin stdlib

var api;

(function()
{
    try{
    api = new ActiveXObject("DynamicWrapperX")
    }catch(e)
    {
        Message("winapi.js: не удалось создать DynamicWrapperX. " + e.description)
        return
    }
    regs = [
    {
        lib: "USER32.DLL",
        funcs:[
            ["GetWindowRect", "i=lp", "r=l"]
        ]
    }
    ]
    for(var k in regs)
    {
        for(var i in regs[k].funcs)
            api.Register(regs[k].lib, regs[k].funcs[i][0], regs[k].funcs[i][1], regs[k].funcs[i][2])
    }
    
})();

Rect = stdlib.Class.extend(
{
    construct: function(l, t, r, b)
    {
        this.left = l
        this.top = t
        this.right = r
        this.bottom = b
    },
    width: function()
    {
        return this.right - this.left
    },
    height: function()
    {
        return this.bottom - this.top
    }
})

RectApi = stdlib.Class.extend(
{
    construct: function()
    {
        this.mem = api.Space(16)
    },
    toRect: function()
    {
        return new Rect(api.NumGet(this.mem, 0, "l"), api.NumGet(this.mem, 4, "l"), api.NumGet(this.mem, 8, "l"), api.NumGet(this.mem, 12, "l"))
    }
})

function GetWindowRect(hwnd)
{
    var rect = new RectApi()
    api.GetWindowRect(hwnd, rect.mem)
    return rect.toRect()
}
