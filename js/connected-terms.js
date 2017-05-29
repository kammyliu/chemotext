SEARCH_TYPE = "connected";

var input;
$(document).ready(function(){	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	input = document.getElementById("inputbar");
});

// fields specific to each search execution
var _term, _stack;

var _withSubterms = false;
var _subtermMax;
var _finishedSubterms=0;
//var _subterms declared in chemotext.js

function simpleSearch(){
	if (input.value == "") return;

	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();

	_term = getSelfOrSynonym(input.value);
	_stack = new ThornStack();
	
	//console.log("Term: "+_term);

	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getSubtermsPayload(_term), findSimpleSubterms);	// fetch subterms
	}else{
		queryNeo4j(getMentionsPayload(_term), simpleSearchOnSuccess);	// fetch search term occurrences
	}
}

/* Not including subterms */

function simpleSearchOnSuccess(data){
	addTermOrSubterm(_stack,data);
	showResult(_stack, input.value, _withSubterms);
}


/* Including subterms */

function findSimpleSubterms(data){
	var results = data["results"][0]["data"];
	
	_subterms = [];
	_subtermMax = results.length + 1;
	_finishedSubterms = 0;
	
	// fetch input term
	queryNeo4j(getMentionsPayload(_term), addSimpleSubtermData);
			
	// fetch each subterm 
	for (var i=0; i< results.length ; i++){
		var name = results[i]["row"][0]["name"];	
		_subterms.push(name);
		queryNeo4j(getMentionsPayload(name), addSimpleSubtermData);			
	}
}

function addSimpleSubtermData(data){
	addTermOrSubterm(_stack,data);
	
	_finishedSubterms++;
	if(_finishedSubterms == _subtermMax){
		showResult(_stack, input.value, _withSubterms);
	}
}


/* Show results table */
function makeConnectedTermsTable(stack, index, indexLimit){
	
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}

	/*append TR: 
		<tr>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
	var $tbody = $(tableform).find("tbody");
	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td>'+node.name+'</td>');
		$buttonTd = $("<td/>").append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.count, 
			click: function(node){ return function(){openArticleList(node);} }(node)
		}));
		$tbody.append($tr.append($buttonTd));

		node = node.right;
	}
}


