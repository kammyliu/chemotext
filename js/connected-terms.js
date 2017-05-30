SEARCH_TYPE = "connected";

var input;
$(document).ready(function(){	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	input = document.getElementById("inputbar");
});

var _withSubterms = false;
//var _subterms declared in chemotext.js

function simpleSearch(){
	if (input.value == "") return;

	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();

	var term = termBank.getSynonym(input.value);
	//console.log("Term: "+term);

	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getMentionsWithSubtermsPayload(term), simpleSearchOnSuccess);	// search term and subterm co-occurrences
	}else{
		queryNeo4j(getMentionsPayload(term), simpleSearchOnSuccess);	// fetch search term co-occurrences
	}
}

/* Not including subterms */

function simpleSearchOnSuccess(data){
	//console.log(data);

	var results = readResults(data, _withSubterms);

	showResult(results, input.value, _withSubterms);
}

function readResults(data, withSubterms){
	var results = [];
	
	if (withSubterms){
		_subterms = data["results"][1]["data"][0].row[0];
	}
		
	data = data["results"][0]["data"];

	for (var i=0; i< data.length ; i++){
		//console.log(i+" out of "+data2.length);
		var row = data[i].row;
		
		var name = row[0]["name"];
		var type = row[0]["type"];
		var stype = row[0]["stype"];
		var isDrug = row[0]["isDrug"];
		
		var newTerm = new Term(name,type,stype);
		if(isDrug=="true"){newTerm.isDrug=true;}
	
		var articles = row[1];
		for (var j=0; j<articles.length; j++){
			var a = articles[j];
			var date = a["date"];
			var pmid = a["pmid"];
			var title = a["title"];
			newTerm.addArticle(pmid,date,title);
		}
		
		results.push(newTerm);
	}
	return results;
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


