const delays=[]

function formatNum(val){
    const valstr=val+''
    let [integer,decimal]=valstr.split('.')

    if(!decimal){
        decimal='00'
    }else if(decimal.length === 1){
        decimal+='0'
    }else{
        decimal=decimal.slice(0,2)
    }

    let output=''
    if(integer.length>0){
        output=integer.slice(-3)
        for(let i=3;i<integer.length;i+=3){
            output=integer.slice(-3-i,-i)+'.'+output
        }
    }
    output+=','+decimal
    return output
}
// show-hide block functions
function show(el){
    el && el.setAttribute('class','show')
}
function hide(el){
    el && el.setAttribute('class','hide')
}
// update html elements
function write_field(class_tag,val){
    const els=document.querySelectorAll(class_tag)
    if( !els ){
        console.warn("no els?")
        return;
    }
    els.forEach((el)=>el.textContent=val)
}

// reset all
function reset_fields(classes){
    write_field(classes,"")
    const el=document.querySelector('#evolution')
    if(!el) return;
    const child=el.firstChild
    if(!child) return;
    el.removeChild(child)
    const elems=document.querySelectorAll(".show")
    if(elems){
        elems.forEach((el)=>hide(el))
    }
}


// draw a fancy html table
function dynamic_table(cssid,rows,colnames,footrow){

    if( !cssid || !rows || !Array.isArray(rows) || rows.length < 1 ||
        !colnames || !Array.isArray(colnames) || colnames.length < 1 ||
        (footrow && (!Array.isArray(footrow) || footrow.length < 1)) ){

        console.error('Bad parameters')
        return;
    }
    const el=document.querySelector(cssid)
    if(!el){
        console.error("cssid does not found")
        return;
    }
    let tbl='<table class="primary table"><thead><tr><th>'+colnames.join('</th><th>')+'</th></tr></thead><tbody>'
    for(i=0;i<rows.length;i++){
        tbl+='<tr><td>'+rows[i].join('</td><td>')+'</td></tr>'
    }
    tbl+='</tbody>'
    if(footrow){
        tbl+='<tfoot><tr><th>'+footrow.join('</th><th>')+'</th></tr></tfoot>'
    }
    tbl+='</table>'
    el.innerHTML=tbl
}

function add_late(ev){
    const late_id=document.getElementById("late-id")?.value
    const late_count=document.getElementById("late-count")?.value
    const late_container=document.getElementById("late-container")
    const target=ev.target

    if( !late_id || !late_count || !late_container ){
        console.warn("Bad parameters")
        return;
    }
    const all=document.querySelectorAll(`input[data-target="${late_id}"]`)

    if( [...all].flatMap((el)=>(el.value==late_id)).reduce((acc,val)=>acc||val,false) ){
        console.warn("already exists")
        return;
    }


    late_container.innerHTML+=`
        <input type="text" value="${late_id}" data-target="${late_id}"   readonly>
        <input type="text" value="${late_count}" data-target="${late_id}" readonly>
        <input type="button" id="#late-remove"  value="&times;" data-target="${late_id}" onclick="remove_late(${late_id})"  class="button error">`


    late_id.value=""
    late_count.value=""

    // re-bind events

    delays.push({late_id,late_count})

    document.querySelector('#late-add').addEventListener('click',add_late)
}

// handling payment late functions
function remove_late(id){
    if(!id){
        console.error("bad parameter")
        return;
    }
    id=parseInt(id)
    const all=document.querySelectorAll(`[data-target="${id}"]`)

    if(!all){
        console.error("element not found")
        return;
    }
    // upadate html

    all.forEach((el)=>el.parentNode.removeChild(el))


    // update state

    for(let i=0;i<delays.length;i++){
        if(delays[i] && delays[i].late_id === id){
            delete delays[i]
            break;
        }
    }
}

function is_delayed(month_id){
    return get_delay(month_id) !== 0?true:false
}
function get_delay(month_id){
    const all=document.querySelectorAll(`[data-target="${month_id}"]`)
    if(all && all.length>0)
        return all[1].value

    return 0
}

function draw_evolution(cssid,base,inflation,months,taxes){

    const rows=[]
    const colnames=['Mes','Inf.%','Inf.$','Incremental','Plano']

    let comp_ac=0
    let sum_inc=0
    let sum_plain=0
    const avg=get_average_amount_taxed(base,inflation,months,taxes)
    for(let i=0;i<months;i++){
        const comp=base*i*inflation
        const month=i+1
        const increment=base+comp+taxes
        rows.push([
            month,
            `${formatNum(inflation*i*100)}%`,
            `\$${formatNum(comp)}`,
            `\$${formatNum(increment)}`,
            `\$${formatNum(avg)}`
            ])
        comp_ac+=comp+taxes
        sum_inc+=comp+base+taxes
    }

    sum_plain=avg*months
    const footrow=['Total','','',`\$${formatNum(sum_inc)}`,`\$${formatNum(sum_plain)}`]
    dynamic_table(cssid,rows,colnames,footrow)
}

function get_average_amount_taxed(base,inflation,months,tax){
    // Gauss Sum
    return (months-1)/2*inflation*base+base+tax
}

function generate_dataset(base,inflation,months,tax,delays){
    // TODO: generators
    const ds=[]
    const avg=get_average_amount_taxed(base,inflation,months,tax)

    // TODO: delays
    for(let i=0;i<months;i++){
        ds.push({
            month:i+1,
            infp:formatNum(i*inflation*100),
            infv:formatNum(i*inflation*base),
            increment:formatNum(i*inflation*base+base),
            plain:avg,
        })
    }
    return ds
}
//
function* dataset_generator(base,inflation,months,tax,delays){
    const avg=get_average_amount_taxed(base,inflation,months,tax)
    //console.log("avg = ",avg)
    // TODO: delays
    for(let i=0;i<months;i++){
        yield {
            month:i+1,
            infp:formatNum(i*inflation*100),
            infv:formatNum(i*inflation*base),
            increment:formatNum(i*inflation*base+base),
            plain:avg,
        }
    }
}

//  fix the number input
document.querySelectorAll ('input[type=number]')
    .forEach((el)=>el.addEventListener("keypress",(ev) => {
        if(ev.which == 46){
            return
        }
        if (ev.which != 8 && ev.which != 0 && ev.which < 48 || ev.which > 57){
            ev.preventDefault();
        }
    }));

document.getElementById('reset').addEventListener('click',()=>{
    reset_fields(".field-result, .field-result-acc, .field-base, .field-base-acc, .field-comp, .field-comp-acc, .field-taxes, .field-taxes-acc")
});

document.querySelector('#late-add').addEventListener('click',add_late)

// main
document.forms[0].addEventListener("submit",(ev)=>{
    ev.preventDefault()
    const base=document.getElementById('base')
    const inflation=document.getElementById('inflation')
    const months=document.getElementById('months')
    const taxes=document.getElementById('taxes')


    if( !base || !inflation || !months){
        console.error("Bad parameters")
        return;
    }

    let _base=parseFloat(base.value)
    _base=_base<0?0:_base

    let _inflation=parseFloat(inflation.value)
    _inflation=_inflation<0?0:_inflation
    _inflation/=100

    let  _months=parseInt(months.value)
    _months=_months<0?0:_months

    let _taxes=0
    if( taxes && taxes.value ){
         _taxes=parseFloat(taxes.value)
    }
    _taxes=_taxes<0?0:_taxes

    draw_evolution("#evolution",_base,_inflation,_months,_taxes)

    const elems=document.querySelectorAll(".hide")
    if(elems){
        elems.forEach((el)=>show(el))
    }
    //const ds=generate_dataset(_base,_inflation,_months,_taxes,delays)
    for(let row of dataset_generator(_base,_inflation,_months,_taxes,delays)) {
        console.log(row)
    }
    const result=get_average_amount_taxed(_base,_inflation,_months,_taxes)
    write_field('.field-result',formatNum(result))
});
