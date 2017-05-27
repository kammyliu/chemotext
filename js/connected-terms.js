SEARCH_TYPE = "connected";

isShared = false; isArticle = false; isPath = false;

var input;
$(document).ready(function(){	
	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	input = document.getElementById("inputbar");

	makeSynStack();
});

var _term;
var _stack;
var _subterms; //flag for if subterms are included


function simpleSearch(){

	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	$("#loader").show();

	//get term or its synonym
	_term = input.value;
	var synonym = synStack.getSyn(_term);
	if(synonym && synonym.includes('|')){	
		_term = synonym.split('|')[1]; //synonym.mainTerm.name;
	}
	//$(displayText).text("Looking for term: " + _term);
	console.log("Term: "+_term);
	
	_subterms = document.getElementById("mappedCheckbox").checked;
	if(_subterms){
		queryNeo4j(getSubtermsPayload(_term), findSimpleSubterms);	// fetch subterms
	}else{
		queryNeo4j(getMentionsPayload(_term), simpleSearchOnSuccess);	// fetch search term occurrences
	}
}

/* Not including subterms */

function simpleSearchOnSuccess(data){
	_stack = new ThornStack();
	//console.log(data);
	addTermOrSubterm(_stack,data);
	showResult(_stack, input.value, _subterms);
}



/* Including subterms */

function findSimpleSubterms(data){
	_stack = new ThornStack();
	
	subTerms = [];
	subTermCount = 0;
	subTermMax = data["results"][0]["data"].length + 1;
	//console.log(subTermMax);
	
	// fetch input term
	queryNeo4j(getMentionsPayload(_term),addSimpleSubtermData);
			
	var results = data["results"][0];
	var data2 = results["data"];
	
	// fetch each subterm 
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		queryNeo4j(getMentionsPayload(name),addSimpleSubtermData);			
	}
}


function addSimpleSubtermData(data){
	addTermOrSubterm(_stack,data);
	//console.log("FINISHED SUBTERM or TERM");
	
	subTermCount++;
	if(subTermCount==subTermMax){
		showResult(_stack, input.value, _subterms);
	}
}


/* GENERAL */

function makeConnectedTermsTable(stack, index, indexLimit){
	
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}

	/*append TR: 
		<tr>
			<td>name</td>
			<td class="countCol">
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
	var $tbody = $("#tableform").find("tbody");
	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td>'+node.name+'</td>');
		$buttonTd = $("<td/>", {"class": "countCol"}).append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.count, 
			click: function(node){ return function(){openArticleList(node);} }(node)
		}));
		$tbody.append($tr.append($buttonTd));

		node = node.right;
	}
}


