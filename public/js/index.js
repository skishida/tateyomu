"use strict";

const timespan = 1.0;

function showTopPage() {
    document.querySelector("#top").style["display"] = "block";
    document.querySelector("#viewer").style["display"] = "none";
}

function showViewer() {
    document.querySelector("#viewer").style["display"] = "block";
    document.querySelector("#top").style["display"] = "none";
}

function showError() {
    document.querySelector("#top").style["-webkit-filter"] = "blur(5px)";
    document.querySelector("#viewer").style["-webkit-filter"] = "blur(5px)";
    document.querySelector(".error").style["display"] = "block";
}

window.addEventListener("load", function() {

    function pushURL(){
        if(app.workData.site === "kakuyomu"){
            history.pushState(null, null, `/works/${app.workData.id}/episodes/${episode.id}/${app.currentPage + 1}`);
        }else if(app.workData.site === "aozora"){

        }else{
            throw new Error();
        }
    }

    function loadFontSizeCSS(css) {
        document.querySelector("#font-size").textContent = css;
        container.innerHTML = "";
        app.workData.episodes.forEach(function(episode) {
            episode.pages = null;
        });
        outer.style["transform"] = `scale(1.0)`;
        var cei = app.currentEpisodeIndex;
        app.workData.episodes.forEach(function(episode){
            episode.pages = null;
        });
        showViewer();

        container.innerHTML = "";
        app.currentEpisodeIndex = null;
        renderIndexPage(app.workData, function(){}, function(){
            loadEpisodePages(
                app.workData,
                app.workData.episodes[cei].id,
                function(){

                },
                function() {
                    app.currentEpisodeIndex = cei;
                    resize();
                    update(app);
                    closeLoading();
                }
            );
        });
    }

    function goto(app, dest, callback) {
        if (viewer.style["display"] === "block" && !isLoading()) {
            movePageTo(app, dest, callback);
        } else {
            callback();
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // application state ///////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    var app = Object.preventExtensions({
        workData: null,             // WorkData or null
        currentEpisodeIndex: null,  // number or null
        currentPage: 0,
        preload: true,
        menuVisible: false
    });

    var container = document.querySelector("div#container");
    var next = document.querySelector("div#next");
    var prev = document.querySelector("div#prev");
    var urlInput = document.querySelector("input#url");
    var close = document.querySelector("#close");
    var index = document.querySelector("#index");
    var viewer = document.querySelector("#viewer");
    var top = document.querySelector("#top");


    ////////////////////////////////////////////////////////////////////////////
    // event handling //////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    // top menu buttons ////////////////////////////////////////////////////////
    document.querySelector("#read").addEventListener("click", function() {
        routeExternalURL(app, urlInput.value);
    });

    document.querySelector("button.epub").addEventListener("click", function() {
        var path = parseKakuyomuURL(urlInput.value);
        if (path) {
            getWorkData(path.workID, function(workData) {
                createEpub(workData, function(epubBlob) {
                    download(`${workData.author}『${workData.title}』.epub`, epubBlob);
                    closeLoading();
                });
            });
        }
    });

    document.querySelector("button.plaintext").addEventListener("click", function() {
        plainText(urlInput.value, function(work, content){
            download(`${work.author}『${work.title}』.zip`, content);
            closeLoading();
        });
    });

    document.addEventListener("cut", function(e) {
        setTimeout(function() {
            update(app);
        }, 0);
    });
    document.addEventListener("paste", function(e) {
        setTimeout(function() {
            update(app);
        }, 0);
    });
    document.querySelector("input#url").addEventListener("change", function(){
        update(app);
    });
    document.querySelector("input#url").addEventListener("keydown", function(e) {
        setTimeout(function() {
            update(app);
            document.querySelector(".error").style["visibility"] = "hidden";
        }, 0)
    });


    // viewer //////////////////////////////////////////////////////////////////
    outer.addEventListener("click", function(e) {
        if(app.menuVisible){
            document.querySelector(".topmenu").style["left"] = "-500px";
            app.menuVisible = false;
        }else{
            var bounds = outer.getBoundingClientRect();
            if (e.clientY < bounds.height * 0.3) {
                document.querySelector(".topmenu").style["left"] = "0px";
                app.menuVisible = true;
            } else if (bounds.width * 0.75 < e.clientX - bounds.left) {
                goto(app, app.currentPage + 1 - 1, function() {
                    closeLoading();
                });
            } else {
                goto(app, app.currentPage + 1 + 1, function() {
                    closeLoading();
                });
            }
        }
    });

    window.addEventListener("popstate", function(e) {
        routeToKakuyomuWorks(app, window.location.pathname);
    });

    window.addEventListener("resize", function(e) {
        update(app);
        resize();
    });

    window.addEventListener("keydown", function(e) {
        if (app.currentPage !== "last" && document.querySelector("img.loading").style["display"] !== "block") {
            goto(app, app.currentPage + 1 + (e.keyCode === 37 ? 1 : 0) - (e.keyCode === 39 ? 1 : 0), function() {
                closeLoading();
            });
        }
    });

    // menu ///////////////////////////////////////////////////////////////////
    document.querySelector("#go-home").addEventListener("click", function() {
        document.querySelector("#url").value = "https://kakuyomu.jp" + window.location.pathname;
        showTopPage();
        history.pushState(null, null, "/");
        update(app);

        if (document.webkitFullscreenEnabled) {
            document.webkitExitFullscreen();
        } else if (document.mozFullScreenEnabled) {
            document.mozExitFullscreen();
        } else if (document.fullScreenEnabled) {
            document.exitFullscreen();
        }
    });

    document.querySelector("#go-to-index").addEventListener("click", function() {
        var url = `/works/${app.workData.id}`;
        routeToKakuyomuWorks(app, url);
        history.pushState(null, null, url);
    });

    document.querySelector("#fullscreen").addEventListener("click", function() {
        if (document.webkitFullscreenEnabled) {
            if (document.webkitFullscreenElement) {
                document.webkitExitFullscreen();
            } else {
                document.body.webkitRequestFullscreen();
            }
        } else if (document.mozFullScreenEnabled) {
            if (document.mozFullscreenElement) {
                document.mozExitFullscreen();
            } else {
                document.body.mozRequestFullscreen();
            }
        } else if (document.fullScreenEnabled) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.body.requestFullscreen();
            }
        }
    });

    document.querySelector("#theme-siro").addEventListener("click", function(e) {
        document.querySelector("#theme").setAttribute("href", "");
        localStorage.removeItem('theme');
    });

    document.querySelector("#theme-kinari").addEventListener("click", function(e) {
        document.querySelector("#theme").setAttribute("href", "/theme/kinari.css");
        localStorage.setItem('theme', 'kinari');
    });

    document.querySelector("#theme-yoru").addEventListener("click", function(e) {
        document.querySelector("#theme").setAttribute("href", "/theme/yoru.css");
        localStorage.setItem('theme', 'yoru');
    });

    document.querySelector("#font-size-normal").addEventListener("click", function(e) {
        loadFontSizeCSS("");
    });

    document.querySelector("#font-size-large").addEventListener("click", function(e) {
        get("/theme/large.css", function(css) {
            loadFontSizeCSS(css);
        });
    });

    document.querySelector("#font-size-huge").addEventListener("click", function(e) {
        get("/theme/huge.css", function(css) {
            loadFontSizeCSS(css);
        });
    });

    document.querySelector("#close-menu").addEventListener("click", function() {
        document.querySelector(".topmenu").style["left"] = "-500px";
        app.menuVisible = false;
    });

    ////////////////////////////////////////////////////////////////////////////
    // initialization /////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    // load ui theme
    var theme = localStorage.getItem("theme");
    if (theme) {
        document.querySelector("#theme").setAttribute("href", `/theme/${theme}.css`);
    }

    // make the guide image invisible
    if( ! localStorage.getItem("guide")){
        document.querySelector(".mapping").style["display"] = "block";
        container.style["-webkit-filter"] = "blur(5px)";
        document.querySelector(".mapping").addEventListener("click", function(e) {
            document.querySelector(".mapping").style["display"] = "none";
            container.style["-webkit-filter"] = "";
            e.stopPropagation();
            e.preventDefault();
            localStorage.setItem("guide", "false");
        });
    }

    // initialize
    routeToKakuyomuWorks(app, window.location.pathname, function() {
        closeLoading();
    });
});
