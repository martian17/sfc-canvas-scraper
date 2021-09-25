let classes;
(async function(){
    classes = await (await fetch("../classes_syllabus.json")).json();
    console.log(classes);
    
    let noScreening = classes.filter(c=>c.syllabus).filter(c=>c.syllabus["授業概要"]["履修制限"].trim() === "履修制限なし")
    .sort((c1,c2)=>-c1.course_code.localeCompare(c2.course_code));//.map(c=>[c.name,c.syllabus_body,c.public_description]);
    //.map(c=>c.name);
    console.log(noScreening);
    console.log(noScreening.map(c=>[c.course_code,c.name,c.public_description]));
    
    let view = new ELEM(document.getElementById("viewport"));
    console.log(noScreening.map(c=>{
        let div = view.add("div");
        div.e.innerHTML = c.syllabus_body;
        let href = div.e.childNodes[0].childNodes[0].getAttribute("href");
        div.e.innerHTML = "";
        //c.course_code,
        //c.name
        /*[c.course_code,c.public_description].map((e)=>{
            div.add("div",false,e);
        });*/
        div.add("h3",false,c.course_code);
        div.add("div",false,c.public_description);
        div.add("div").add("a","target:__blank","syllabus").e.href = href;
        //return [cc[0],cc[1].textContent,cc[2].textContent,cc[3]]
    }));
    //console.log(kenkyu);
})();