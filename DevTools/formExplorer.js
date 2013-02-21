$engine JScript
$uname InternalFormExplorer
$dname Исследование форм 1С

// Александр Орефков
// Скрипт предназначен для вывода информации о составе контролов, свойствах и событиях
// внутренних форм 1С
var showCtrlList = false, showProps = false, traceEvents = false

events.connect(windows, "onDoModal", SelfScript.self)

function onDoModal(dlgInfo)
{
    if(dlgInfo.stage == afterInitial)
        exploreForm(dlgInfo.form, false)
}

function macrosИсследоватьАктивнуюФорму()
{
    var av = windows.getActiveView()
    if(av)
        exploreForm(av.getInternalForm(), true)
}

function exploreForm(form, force)
{
    if(!form)
        return
    if(showCtrlList || force)
    {
        // -1 - это сама форма
        for(var i = -1, k = form.controlsCount; i < k; i++)
        {
            var ctr = form.getControl(i)
            Message("Control #" + i + " name=" + ctr.name + " id=" + ctr.id, mInfo)
            if(showProps)
            {
                var props = ctr.props
                for(var idx = 0, cnt = props.count; idx < cnt; idx++)
                {
                    var v = toV8Value(props.getValue(idx))
                    Message("\t" + props.propName(idx) + " = " + v.presentation() + "  Тип=" + v.typeName(1) + " " + v.toStringInternal());
                }
            }
        }
    }
    form.trapDialogEvents = traceEvents
}

function macrosПереключитьПоказКонтролов()          { showCtrlList = !showCtrlList }
function macrosПереключитьПоказСвойств()            { showProps = !showProps }
function macrosПереключитьЗапускТрассировкиСобытий(){ traceEvents = !traceEvents }
