let ELEM = (() => {
    //make the attribute parser
    let attrParser = function(str) {
        //escape ":" and ";"
        let attrs = [
            ["", ""]
        ];
        let mode = 0;
        for (let i = 0; i < str.length; i++) {
            let attr = attrs.pop();
            let char = str[i];
            if (char === "_") { //escape character
                attr[mode] += str[i + 1];
                i++;
                attrs.push(attr);
            } else if (char === ":") {
                mode++;
                attrs.push(attr);
            } else if (char === ";") {
                mode = 0;
                attrs.push(attr);
                attrs.push(["", ""]);
            } else {
                attr[mode] += str[i];
                attrs.push(attr);
            }
        }
        attrs = attrs.filter((a) => {
            if (a[0] === "") {
                return false;
            }
            return true;
        });
        return attrs;
    };

    let getELEM = function(nname, attrs, inner, style) {
        if (typeof nname === "object" && "mtvriiutba" in nname) { //it's an ELEM
            return nname;
        } else {
            return new ELEM(nname, attrs, inner, style);
        }
    };

    //will be a version 2 overhaul, so everything will be different
    let ELEM = function(nname, attrs, inner, style) {
        let that = this;
        if (nname === "text") {
            this.e = document.createTextNode(inner);
            return;
        } else if (typeof nname === "string") {
            let e = document.createElement(nname);
            if (attrs) {
                attrParser(attrs).map((a) => {
                    e.setAttribute(a[0], a[1]);
                });
            }
            if (inner) {
                e.innerHTML = inner;
            }
            if (style) {
                e.style = style;
            }
            this.e = e;
        } else {
            this.e = nname;
        }
        this.mtvriiutba = 42;

        this.add = function(nname, attrs, inner, style) {
            let elem = getELEM(nname, attrs, inner, style);
            this.e.appendChild(elem.e);
            return elem;
        };
        this.attr = function(a, b) {
            this.e.setAttribute(a, b);
        };
        this.remove = function() {
            this.e.parentNode.removeChild(this.e);
        };
        this.on = function(evt) {
            let cbs = [];
            for (let i = 1; i < arguments.length; i++) {
                let cb = arguments[i];
                cbs.push(cb);
                this.e.addEventListener(evt, cb);
            }
            return {
                remove: function() {
                    for (let i = 0; i < cbs.length; i++) {
                        that.e.removeEventListener(evt, cbs[i]);
                    }
                }
            };
        };
        //children getter/setter
        Object.defineProperties(this, {
            "children": {
                "get": () => that.e.children,
                "set": () => {}
            }
        });
    }
    return ELEM;
})();

//util functions
const Events = function() {
    let that = this;
    const eventTable = {};
    this.eventTable = eventTable;
    this.on = function(type, cb) {
        if (!(type in eventTable)) {
            eventTable[type] = [];
        }
        eventTable[type].push(cb);
        return {
            fire: function() {
                cb.apply(arguments);
            },
            remove: function() {
                let l = eventTable[type];
                l.splice(l.indexOf(cb), 1); //garbage collection
                if (l.length === 0) {
                    delete eventTable[type];
                    return true; //all listeners removed
                } else {
                    return false;
                }
            }
        }
    };
    this.emit = function(type) {
        const elist = eventTable[type] || [];
        console.log(type, elist);
        for (let i = 0; i < elist.length; i++) {
            elist[i].apply(this, [...arguments].slice(1));
        }
    };
    this.wait = function(type) {
        return new Promise((res, rej) => {
            let ev = that.on(type, (val) => {
                res(val);
                ev.remove();
            });
        });
    };
};


//async utility
let LoadWaiter = function() {
    let queue = [];
    let waiting = true;
    this.ready = function() {
        return new Promise((res, rej) => {
            if (waiting) {
                queue.push(res);
            } else {
                res();
            }
        });
    };
    this.pause = function() {
        waiting = true;
    };
    this.resolve = function() {
        waiting = false;
        queue.map(cb => cb()); //resolve all
        queue = [];
    };
};

let Pause = function(t) {
    return new Promise((res, rej) => {
        setTimeout(res, t);
    });
};



let IDSPACE = function() {
    let id = 0;
    this.new = function() {
        return (id++) + "";
    }
};





let Watcher = function(elem) {
    console.log("watching: ", elem);
    let ID = new IDSPACE();
    let bus = new Events();
    let shadowBus = new Events(); //for self check funcs
    let selfCheckFuncs = {};
    this.on = function(type, cb) {
        if (typeof type === "function") {
            if (!("__id" in type)) {
                let id = ID.new();
                selfCheckFuncs[id] = type;
                type._id = id;
            }
            let id = type._id;
            let remover = shadowBus.on(id, cb);
            return {
                fire: function() {
                    cb.apply(arguments);
                },
                remove: function() {
                    if (remover.remove()) { //all listeners removed
                        delete selfCheckFuncs[id];
                        delete type._id;
                    }
                }
            };
        } else {
            return bus.on(type, cb);
        }
    };

    let metadata = {
        "innerText": ""
    };

    let functable = {
        "innerText": function() {
            let content = metadata["innerText"];
            console.log(content, elem.innerText);
            if (content !== elem.innerText) {
                console.log("different!!!");
                metadata["innerText"] = elem.innerText;
                bus.emit("innerText", content);
            }
        }
    };

    setInterval(() => {
        for (let type in bus.eventTable) {
            if (type in functable) {
                functable[type]();
            } else {
                console.log("warning: regisered event type not present");
            }
        }
        for (id in selfCheckFuncs) {
            if (selfCheckFuncs[id](elem)) {
                shadowBus.emit(id);
            }
        }
    }, 100); //every 100ms
};


let SyncedInterval = function(t) {
    let cbs = [];
    this.set = function(cb) {
        cbs.push(cb);
        return {
            cancel: function() {
                cbs.splice(cbs.indexOf(cb), 1);
            }
        };
    };
    let stop = true;
    let main = function() {
        cbs.map(cb => cb());
        if (!stop) setTimeout(main, t);
    };
    this.stop = function() {
        stop = true;
    };
    this.start = function() {
        if (stop) {
            stop = false;
            main();
        } else {
            console.log("the timeout loop has already been started");
        }
    };
};



let WaitRelease = function(waitable) {
    let releaser;
    this.wait = function() {
        return new Promise((res, rej) => {
            if (!waitable) {
                res();
            } else {
                releaser = res;
            }
        });
    };
    this.release = function() {
        if (releaser) releaser();
        releaser = null;
    };
    this.setWait = function() {
        waitable = true;
    };
    this.setUnWait = function() {
        waitable = false;
    };
};

let RateLimiter = function(n) {
    let cnt = 0;
    let queue = [];
    let waiter = new LoadWaiter();
    waiter.resolve();
    this.wait = function() {
        return new Promise((res, rej) => {
            if (cnt < n) {
                cnt++;
                res();
            } else {
                queue.push(res);
            }
        });
    };
    this.free = async function() {
        cnt--;
        await waiter.ready();
        if (cnt < n && queue.length !== 0) {
            queue.pop()();
        }
    };
    this.pause = function(){
        waiter.pause();
    };
    this.resume = function(){
        waiter.resolve();
    };
};

//test change 1


let fileToJSON = function(file) {
    return new Promise((res, rej) => {
        const fileReader = new FileReader()
        fileReader.onload = event => res(JSON.parse(event.target.result))
        fileReader.onerror = error => rej(error)
        fileReader.readAsText(file)
    });
};

let getUrl = function(c) {
    let div = new ELEM("div");
    div.e.innerHTML = c.syllabus_body;
    return div.e.childNodes[0].childNodes[0].getAttribute("href");
};

let getIframe = function(url) {
    return new Promise((res, rej) => {
        let ifr = document.createElement("iframe");
        document.body.appendChild(ifr);
        ifr.setAttribute("src", url);
        ifr.addEventListener("load", function() {
            res(ifr);
        });
    });
};


let dtddToObj = function(dtdd) {
    let obj = {};
    for (let i = 0; i < dtdd.length - 1; i++) {
        let e1 = dtdd[i];
        let e2 = dtdd[i + 1];
        if (e1.nodeName === "DT" && e2.nodeName === "DD") {
            i++;
            obj[e1.textContent.trim()] = e2.textContent.trim();
        }
    }
    return obj;
};
let dtddToArray = function(dtdd) {
    let arr = [];
    for (let i = 0; i < dtdd.length - 1; i++) {
        let e1 = dtdd[i];
        let e2 = dtdd[i + 1];
        if (e1.nodeName === "DT" && e2.nodeName === "DD") {
            i++;
            arr.push([e1.textContent.trim(), e2.textContent.trim()]);
        }
    }
    return arr;
};


let syllabusToJson = function(doc) {
    let result = {};
    let labels = [...doc.querySelectorAll(".contents-box>h3")].map(e => e.textContent.trim());
    let boxes = [...doc.querySelectorAll(".contents-box")];
    //授業概要
    result[labels[0]] = dtddToObj(boxes[0].querySelectorAll("dt, dd"));
    //詳細
    result[labels[1]] = dtddToObj(boxes[1].querySelectorAll("dt, dd"));
    //授業計画
    result[labels[2]] = dtddToArray(boxes[2].querySelectorAll("dt, dd"));
    let time = doc.querySelector(".updated-time");
    if (time.children[0]) time.removeChild(time.children[0]);
    result.updated_at = time.textContent.trim();
    return result;
};


let downloadTextFile = function(fname, str) {
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(str));
    a.setAttribute('download', fname);

    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

let limiter = new RateLimiter(10);

//main function
(() => {
    let BODY = new ELEM(document.body);
    let wrapper = BODY.add("div"); //wrapper

    wrapper.add("span", false, "drop json  ");
    wrapper.add("input", "type:file").on("change", async function(e) {
        let classes = (await fileToJSON(e.target.files[0]));//.slice(0, 100);
        let cnt = 0;
        await Promise.all(classes.map(async (c, i) => {
            let url = getUrl(c);
            await limiter.wait();
            console.log("cnt: " + (cnt++));
            let sy = false;
            let ifr;
            try {
                ifr = await getIframe(url);
                sy = syllabusToJson(ifr.contentWindow.document);
            } catch (err) {
                //console.log(i,c,url);
                //console.log(err);
            }
            if (ifr) document.body.removeChild(ifr);
            limiter.free();
            c.syllabus = sy;
        }));
        console.log(classes);
        downloadTextFile("classes_syllabus.json",JSON.stringify(classes));
    });
})();