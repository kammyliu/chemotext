SEARCH_TYPE = "article";

var articleBar, termsList, searchbutton;

$(document).ready(function(){	
	makePageSections();
    
	makeAutocomplete($("#inputSection"), "articleBar");
	articleBar = document.getElementById("articleBar");
	termsList = document.getElementById("terms-list");
	searchbutton = document.getElementById("search-button");

    url = "chemotext.unc.edu/Article_Search.html?terms=%5B%22GAK%20protein,%20human%22,%22Clathrin%22%5D"
    urlQuery = getInputFromURL(url);
    //urlQuery = getInputFromURL(window.location.href);

    if(urlQuery) {
        for(var i=0;i<urlQuery.length;i++){
            addToArticleArray(urlQuery[i]);
        }
        articleSearch();
    }
    
	$("#add-term-button").click(function(){
		if(articleBar.value!=""){
			searchbutton.disabled = false;
			addToArticleArray(articleBar.value)
		}
	});
});

/* Execute the search */
function articleSearch(){
	$(displayText).text("");
	$("#results").hide();
	showLoader();
	
	var articleArray = [];
	$(termsList).find("span").each(function(i, el){
		articleArray.push($(this).text());
	});
	
	var payload = getArticleSearchPayload(articleArray);
	queryNeo4j(payload, function(data,xhr,status){
		var data = data["results"][0]["data"];
		var stack = [];		
		for(var i=0;i<data.length;i++){
			var date = data[i]["row"][0]["date"];
			var pmid = data[i]["row"][0]["pmid"];
			var title = data[i]["row"][0]["title"];
			stack.push(new Article(pmid,date,title));
		}
		showResult(stack, "", false);
	});
}

function getArticleSearchPayload(articleArray){
	// For two terms, looks like:
	// match (n:Term {name:{name0}})-[:MENTIONS]-(a) 
	// match (n1:Term {name:{name1}})-[:MENTIONS]-(a) return a
	
	var matchStr = "match (n:Term {name:{name0}})-[:MENTIONS]-(a)";
	var params = { "name0" : articleArray[0] };
	for(var i =1;i<articleArray.length;i++){
		var name = "name"+i;
		params[name] = articleArray[i];
		matchStr += " match (n"+i+":Term {name:{"+name+"}})-[:MENTIONS]-(a)";
	}
	var payload = JSON.stringify({
			"statements" : [{
				"statement" : matchStr+" return a", 
				"parameters" : params
			}]
     });
	 return payload;
}

/* Build the results table */
function makeArticleSearchTable(stack, index, indexLimit){
	var $tbody = $(tableform).find("tbody");
	
	/*append TR: 
		<tr>
			<td>
				<a href="url">pmid</a>
			</td>
		</tr>
	*/
	for(var j=index;j<indexLimit;j++){
		var pmid = stack[j].pmid;
		var label = stack[j].getTitleOrId();
		$tbody.append('<tr><td><a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/'+pmid+'">'
			+label+'</a></td></tr>');
	}
}
	

/* Add a checked term to the list */
function addToArticleArray(raw){	
	var term = termBank.getSynonym(raw);
	$(termsList).append('<li><span>'+term+'</span><button type="button" onclick="deleteFromArticleArray(this)">X</button></li>');
	articleBar.value = "";
}

/* Remove a deleted term from the list */
function deleteFromArticleArray(button){
	$(button).parent().remove();
	if ($(termsList).children().length == 0){
		searchbutton.disabled = true;		
	}
}
