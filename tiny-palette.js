/***************** INIT & IMPORT FILES ***********************************************************/
paletteInit();
function paletteInit() { /* only call once per load */
    loadJquery();
    /* JQUERY */
        function loadJquery() {
            var paletteJquery        = document.createElement( 'script' );
            paletteJquery.src        = 'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js';
            document.body.appendChild(paletteJquery);
            paletteJquery.onload = function() { loadJqueryUi(); };
        }
    /* JQUERY UI */
        function loadJqueryUi() {
            var paletteJqueryUi      = document.createElement( 'script' );
            paletteJqueryUi.src      = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js';
            document.body.appendChild(paletteJqueryUi);
            paletteJqueryUi.onload = function() { modifyJquery(); };
        }
    /* make .css() hook return hex for background-color */
        function modifyJquery() {
            $.cssHooks.backgroundColor = {
                get: function(elem) {
                    if (elem.currentStyle)
                        var bg = elem.currentStyle["background-color"];
                    else if (window.getComputedStyle)
                        var bg = document.defaultView.getComputedStyle(elem, null).getPropertyValue("background-color");
                    if (bg.search("rgb") == -1)
                        return bg;
                    else
                        bg = bg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    function hex(x) {
                        return ("0" + parseInt(x).toString(16)).slice(-2);
                    }
                    return "#" + hex(bg[1]) + hex(bg[2]) + hex(bg[3]);
                }
            }
            loadCss();
            loadHtml();
            loadPaletteState();
        }
    /* CSS */
        function loadCss() {
            var paletteStyle         = document.createElement('link');
            paletteStyle.href        = 'http://rawgithub.com/CameronGarrett/Tiny-Palette/master/tiny-palette.css';
            paletteStyle.type        = 'text/css';
            paletteStyle.rel         = 'stylesheet';
            paletteStyle.media       = 'screen';
            document.head.appendChild(paletteStyle);
        }
    /* HTML */
        function loadHtml() {
            $('body').append('<div id="palette-container"><div id="palette-handle"></div><ul id="color-container"><li class="palette-swatch" id="swatch-empty"></li></ul></div>');
        }
    /* PALETTE STATE */
        function loadPaletteState() {
            if ( localStorage.getItem("paletteWidgetSwatches") ) {
                var swatchData = JSON.parse(localStorage.getItem("paletteWidgetSwatches")); // get data from local
                for (i = 0; i < swatchData.length; i++) {
                    $("li.palette-swatch#swatch-empty").before("<li class='palette-swatch' id=''></li>");
                    $("li.palette-swatch#swatch-empty").prev("li").css("background-color", swatchData[i]);
                    var thisColor = $("li.palette-swatch#swatch-empty").prev("li").css("background-color");
                    $("li.palette-swatch#swatch-empty").prev("li").append("<div class='swatch-bar'>" + thisColor + "</div>");
                    $("li.palette-swatch#swatch-empty").prev("li").append("<div class='swatch-delete'></div>");
                }
            }
            mainPaletteFunction();
        }

}
/***************** MAIN ***********************************************************/
function mainPaletteFunction() {
/* FUNCTIONS */
    /* localStorage detection */
        function supportsLocalStorage() {
            return typeof(Storage)!== "undefined";
        }
    /* test if valid hex color */
        function isHexColor(sNum) {
            return (typeof sNum === "string") && (sNum.length === 3 || sNum.length === 6) && ! isNaN( parseInt(sNum, 16) );
        }
    /* save state */
        function savePaletteState() { /* fire on: new, delete, reorder */
            if (!supportsLocalStorage()) { return false; }
            var swatchColors = $("li.palette-swatch:not(li#swatch-empty)"); // global (no var)
            var swatchCache = []; // creates empty array
            swatchColors.each(function() { // for each selected element in swatches
                swatchCache.push($(this).css("background-color")); // adds var li to end of swatchCache array
            });
            swatchCache = JSON.stringify(swatchCache);
            console.log(swatchCache); // test
            try { /* execute safely */
                localStorage.setItem("paletteWidgetSwatches", swatchCache); // save new local data
            } catch (e) { /* catch errors */
                if (e == QUOTA_EXCEEDED_ERR) {
                    alert("Quota exceeded!");
                }
            }
        }
/* MAIN EVENTS */
    /* palette draggable */
        $("#palette-container").draggable({
            containment: "window",
            snap:           true,
            snapMode:       "inner",
            snapTolerance:  10,
            handle:         "#palette-handle",
            opacity:        0.6
        });
    /* swatches sortable */
        $("#color-container").sortable({
            items:          "li.palette-swatch:not(li#swatch-empty)",
            axis:           "x",
            placeholder:    "swatch-placeholder palette-swatch",
            containment:    "#color-container", // make this not include empty swatch
            cursorAt:       { left: 25 },
            stop:           function() { savePaletteState(); } // saves order in localStorage
        });
    /* add new swatch */
        $("li.palette-swatch#swatch-empty").click(function() {
            var enteredColor = prompt("Enter a hex color code:", "#666").replace("#","");
            if (isHexColor(enteredColor)) {
                $("li.palette-swatch#swatch-empty").before("<li class='palette-swatch' id=''></li>");
                $("li.palette-swatch#swatch-empty").prev("li").css("background-color", "#" + enteredColor);
                var thisColor = $("li.palette-swatch#swatch-empty").prev("li").css("background-color");
                $("li.palette-swatch#swatch-empty").prev("li").append("<div class='swatch-bar'>" + thisColor + "</div>");
                $("li.palette-swatch#swatch-empty").prev("li").append("<div class='swatch-delete'></div>");
            };
            savePaletteState();
        });
    /* swatch bar click - copy hex / replace color */
        $("ul#color-container").on("click", "div.swatch-bar", function() { console.log("fired " + $(this));
            var currentColor = $(this).parent("li").css("background-color").replace("#","");
            var newColor = window.prompt("Copy or Change the hex color:", "#" + currentColor).replace("#",""); // "/n" produces line break
            if (newColor != currentColor && isHexColor(newColor)) { // clean current value for comparison
                $(this).parent("li").css("background-color", "#" + newColor);
                var thisColor = $(this).parent("li").css("background-color");
                $(this).html(thisColor);
                savePaletteState();
            }
        });
    /* swatch delete click - delete */
        $("ul#color-container").on("click", "div.swatch-delete", function() {
            $(this).parent("li").remove();
            savePaletteState();
        });

};
