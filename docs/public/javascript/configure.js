//jQuery scripts
var MAX_STR_LENGTH = 38;
var PAGE_NUM = 5000;

function setupJquery(svg){
    var elementMap = svg.getElementMap();
    var elements = svg.getElements();

    $("#search-btn").click(function(){
        $('#search-contents').show();
        $('#info-contents').hide();
        $('#filter-contents').hide();
        $('.drawer').drawer('show');
    });

    $("#filter-btn").click(function(){
        $('#search-contents').hide();
        $('#info-contents').hide();
        $('#filter-contents').show();
        $('.drawer').drawer('show');
    });

    $("#info-btn").click(function(){
        $('#search-contents').hide();
        $('#info-contents').show();
        $('#filter-contents').hide();
        $('.drawer').drawer('show');
    });

    var compressed = false;
    $("#compress-btn").click(function(){
        if(!compressed){
            svg.compress();
            compressed = true;
        }
        else{
            svg.decompress();
            compressed = false;
        }
    });

    $(".close").click(function(){
        $('.drawer').drawer('hide');
    });

    var filterCount = 0;
    $("#filter-add").click(function(){
        filterCount ++;
        $(".filter-box").append("<input class='typeahead' id='filter-" + filterCount + "' placeholder='Object/group...' />");
        $('#filter-' + filterCount).typeahead({
            hint: false,
            highlight: true,
            minLength: 1
        },
        {
            name: 'objects',
            source: substringMatcher(objectVocabulary)
        });
    });

    $("#filter-remove").click(function(){
        if(filterCount > 0){
            $("#filter-" + filterCount).parent().remove();
            filterCount --;
        }
    });

    $(".do-filter").click(function(){
        var filterList = [];
        for(var i = 0; i <= filterCount; i++){
            var object = objectMap.get($("#filter-" + i).val());
            if(object != undefined){
                filterList.push(object);
            }
        }
        console.log(filterList);
        svg = new sd.SDViewer(filterList, [], messages);
    })

    var substringMatcher = function(strs) {
        return function findMatches(q, cb) {
            var matches, substrRegex;

            // an array that will be populated with substring matches
            matches = [];

            // regex used to determine if a string contains the substring `q`
            substrRegex = new RegExp(q, 'i');

            // iterate through the pool of strings and for any string that
            // contains the substring `q`, add it to the `matches` array
            $.each(strs, function(i, str) {
                if (substrRegex.test(str)) {
                    matches.push(str);
                }
            });

            cb(matches);
        };
    };

    $('.typeahead').typeahead({
        hint: false,
        highlight: true,
        minLength: 1
    },
    {
        name: 'objects',
        source: substringMatcher(objectVocabulary)
    });

    $(".do-search").click(function(){
        var from = $("#search-from").val();
        if(from.length != 0){
            from = objectMap.get($("#search-from").val()).id;
        }
        var to = $("#search-to").val();
        if(to.length != 0){
            to = objectMap.get($("#search-to").val()).id;
        }
        var message = $("#search-message").val();

        // This is the live-demo code
        var data = [];
        for(var i = 0; i < messages.length; i++){
            if(messages[i].from == from && messages[i].to == to && messages[i].message.indexOf(message) != -1){
                data.push(messages[i]);
            }
        }
        var temp = [];
        searchResultMap = new Map();
        for(var i = 0; i < data.length; i++){
            if(svg.isMessageDisplayed(data[i])){
                temp.push(data[i]);
                searchResultMap.set(data[i].id, data[i].count);
            }
        }
        data = temp;
        var totalPageNum = Math.ceil(data.length / 10)
        var result = "Find " + data.length + " messages. Display 1/" + totalPageNum + " page. "

        $("#search-result").empty();

        $("#search-result").append($("<li role='presentation'></li>").text(result)
                            .append("<input id='search-result-goto'/>")
                            .append("<button id='do-search-result-goto'>Goto</button>"));

        $("#do-search-result-goto").click(function(){
            var page = parseInt($("#search-result-goto").val())
            if(page > 0 && page <= totalPageNum){
                displaySearchResult(page, 10, data);
            }
        });

        displaySearchResult(1, 10, data);

        // This is the code with database.
        /*
        var query = "messages?message[from]=" + from + "&message[to]=" + to + "&message[message]=" + message;
        var urlSearch = "http://localhost:3000/searchMessage/" + query;

        $("#search-result").empty();
        $("#search-result").append("<div class='loader'></div>")

        d3.json(urlSearch, function(err, data){
            var temp = [];
            searchResultMap = new Map();
            for(var i = 0; i < data.length; i++){
                if(svg.isMessageDisplayed(data[i])){
                    temp.push(data[i]);
                    searchResultMap.set(data[i].id, data[i].count);
                }
            }
            data = temp;
            var totalPageNum = Math.ceil(data.length / 10)
            var result = "Find " + data.length + " messages. Display 1/" + totalPageNum + " page. "

            $("#search-result").empty();

            $("#search-result").append($("<li role='presentation'></li>").text(result)
                                .append("<input id='search-result-goto'/>")
                                .append("<button id='do-search-result-goto'>Goto</button>"));

            $("#do-search-result-goto").click(function(){
                var page = parseInt($("#search-result-goto").val())
                if(page > 0 && page <= totalPageNum){
                    displaySearchResult(page, 10, data);
                }
            });

            displaySearchResult(1, 10, data);
        });
        */
    });

    function displaySearchResult(pageNum, pageSize, data){
        $(".search-result-content").remove();
        var start = pageSize * (pageNum - 1);
        for(var i = start; i < start + pageSize; i++){
            if(i >= data.length){
                break;
            }
            generateSearchItem(data[i]);
        }
        $(".search-result-item").click(function(){
            var messageId = parseInt($($(this).children()[0]).text());
            var param = svg.getContext();
            var success = svg.locate(messageId, param[4], param[5]);
            if(success){
                $('.drawer').drawer('hide');
            }
            else{
                switchPage(messageId, svg);
            }
        });
    }

    function generateSearchItem(item){
        var from = useDotIfNameTooLong(elementMap.get(item.from).displayName);
        var to = useDotIfNameTooLong(elementMap.get(item.to).displayName);
        var message = useDotIfNameTooLong(item.message);
        $("#search-result").append($("<li role='presentation' class='search-result-content'></li>")
                                    .append($("<button class='search-result-item'></button>")
                                        .append($("<div class='message-id'></div>").text(item.id))
                                        .append($("<div class='message-from'></div>").text(from))
                                        .append($("<div class='message-to'></div>").text(to))
                                        .append($("<div class='message-content'></div>").text(message))
                                    )
                                  );
    }
}

var searchResultMap; // message id => message count
function switchPage(messageId, svg){
    var page = Math.floor(searchResultMap.get(messageId) / PAGE_NUM);
    var urlMsg = "http://localhost:3000/fetchMessage/" + page;
    d3.json(urlMsg, function(err, data) {
        messages = data;
        var param = svg.getContext();
        svg = new sd.SDViewer(objects, groups, messages);
        var success = svg.locate(messageId, param[4], param[5]);
        if(success){
            $('.drawer').drawer('hide');
        }
        else{
            console.log("error!");
        }
    });
}

function showNearBy(messageId, svg){

}

function useDotIfNameTooLong(name){
    if(name.length > MAX_STR_LENGTH){
        return name.substring(0, MAX_STR_LENGTH) + "...";
    }
    else{
        return name;
    }
}

var urlObj = "./public/json/object.json";
var urlGrp = "./public/json/group.json";
var urlMsg = "./public/json/message.json";
var objects;
var groups;
var messages;
var objectVocabulary;
var objectMap;
var objectMap_id;
d3.json(urlObj, function(err, data) {
    if(err){
        console.log("Error while loading objects");
        console.log(err);
    }
    else{
        objects = data;
        objectVocabulary = [];
        objectMap = new Map();
        objectMap_id = new Map();
        for(let object of objects){
            objectVocabulary.push(object.name + ":" + object.type);
            objectMap.set(object.name + ":" + object.type, object);
            objectMap_id.set(object.id, object);
        }
        d3.json(urlGrp, function(err, data) {
            if(err){
                console.log("Error while loading objects");
                console.log(err);
            }
            else{
                groups = data;
                d3.json(urlMsg, function(err, data){
                    if(err){
                        console.log("Error while loading objects");
                        console.log(err);
                    }
                    else{
                        messages = data;
                        console.log( { "objects" : objects,
                                 "groups" : groups,
                                 "messages" : messages
                             });
                        svg = new sd.SDViewer(objects, groups, messages, "drawArea");
                        setupJquery(svg);
                    }
                });
            }
        });
    }
});
