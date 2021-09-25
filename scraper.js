(async function(){
    let search = async function(url,params){
        let first = true;
        for(let key in params){
            if(first){
                first = false;
                url += "?"+escape(key)+"="+escape(params[key]);
            }else{
                url += "&"+escape(key)+"="+escape(params[key]);
            }
        }
        let result = await fetch(url);
        let str = await result.text();
        return JSON.parse(str.slice(9));//removing junk
    };
    let searchAllCourses = async function(){
        let results = [];
        let base_url = "https://sol.sfc.keio.ac.jp/api/v1/search/all_courses";
        for(let i = 0;; i++){
            let result = await search(base_url,{
                per_page:50,
                search:"",
                "day[]":"all",
                "period[]":"all",
                "term":5,
                page:i+1
            });
            console.log(i,result);
            if(result.length === 0){
                break;
            }else{
                for(let j = 0; j < result.length; j++){
                    results.push(result[j].course);
                }
            }
        }
        return results;
    };
    let result = await searchAllCourses();
    console.log(result);
    console.log(JSON.stringify(result));
})();