SEARCH_TYPE = "connected";

var input;
$(document).ready(function(){	
	makePageSections();
    
    urlQuery = getInputFromURL(window.location.href);
    
    if (urlQuery){
        console.log(urlQuery["term"]);

        makeAutocomplete($("#inputSection"), "inputbar", urlQuery["term"]);
        input = document.getElementById("inputbar");
        
        $("#inputSection input").each(function(i, el){
			if ($(el).attr("data-example")){
				$(el).val($(el).attr("data-example"));
			}
        });
        simpleSearch();
    } else {
    	makeAutocomplete($("#inputSection"), "inputbar", "GAK protein, human");
        input = document.getElementById("inputbar");
    }
	
	addExampleLink();
});

var _withSubterms = false;
//var _subterms declared in chemotext.js

/* Get search terms from url*/
function getInputFromURL(url){
    var rawURL = decodeURI(url)
    var queryString = rawURL.split('?')[1];

    var queryObj = {};
    
    if (queryString) {
        var arr = queryString.split('&');
        for (var i = 0; i < arr.length; i++){
            var rawParam = arr[i].split('=')

            var paramKey = rawParam[0];
            var paramValue = typeof (rawParam[1]) === 'undefined' ? true : rawParam[1];

            if (!queryObj[paramKey]) {
                queryObj[paramKey] = paramValue;
            } else if (queryObj[paramKey] && typeof queryObj[paramKey] === 'string'){
                queryObj[paramKey] = [queryObj[paramKey]];
                queryObj[paramKey].push(paramValue);
            } else {
                queryObj[paramKey].push(paramValue);
            }
        }
        return queryObj;
    } else {
        return;
    }
}

/* Executes the search */
function simpleSearch(){
    console.log(input.value);
	if (input.value == "") return;

	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();

	var term = termBank.getSynonym(input.value);

	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getMentionsWithSubtermsPayload(term), simpleSearchOnSuccess);	// search term and subterm co-occurrences
	}else{
		queryNeo4j(getMentionsPayload(term), simpleSearchOnSuccess);	// fetch search term co-occurrences
	}
}

/* Callback for receiving the search results */
function simpleSearchOnSuccess(data){
	var results = readResults(data, _withSubterms);
	showResult(results, input.value, _withSubterms);
}

/* Show results table */
function makeConnectedTermsTable(stack, index, indexLimit){
	var $tbody = $(tableform).find("tbody");

	/*append TR: 
		<tr>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
	for(var i=index;i<indexLimit;i++){
		var term = stack[i];
		$tr = $("<tr/>");
		$tr.append('<td>'+term.name+'</td>');
		$buttonTd = $("<td/>").append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: term.articles.length, 
			click: function(term){ return function(){openArticleList(term);} }(term)
		}));
		$tbody.append($tr.append($buttonTd));		
	}	
	return;
}


