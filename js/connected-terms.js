var thepage, input, tableform, downloadform, displayText;

$(document).ready(function(){	
		
	thepage = document.getElementById("thepage");
	tableform = document.getElementById("tableform");
	downloadform = document.getElementById("downloadform");
	displayText = document.getElementById("displayText");
	
	makePageSections();
	
	inputSuggestion($("#inputSection"), "inputbar");
	input = document.getElementById("inputbar");

	makeSynStack();
});

var _term;
var _stack;

/* Not including subterms */

function simpleSearch(){

	showLoader();

	//get term or its synonym
	_term = synStack.getSyn(input.value);
	if(_term && _term.includes('|')){	
		_term = _term.split('|')[1]; //_term.mainTerm.name;
	}
	$(displayText).text("Looking for term: " + _term);
	console.log("Synonym: "+_term);
	
	var subterms = document.getElementById("mappedCheckbox").checked;
	if(subterms){
		queryNeo4j(getSubtermsPayload(_term), findSimpleSubterms);	// fetch subterms
	}else{
		queryNeo4j(getMentionsPayload(_term), simpleSearchOnSuccess);	// fetch search term occurrences
	}
}


function simpleSearchOnSuccess(data){
	_stack = new ThornStack();
	addTermOrSubterm(data);
	showResult();
}



/* Including subterms */

function findSimpleSubterms(data){
	subTerms = [];
		
	var results = data["results"][0];
	var data2 = results["data"];
	_stack = new ThornStack();
	
	subTermCount = 0;
	subTermMax = data2.length + 1;
	console.log(subTermMax);
	
	// fetch input term
	queryNeo4j(getMentionsPayload(_term),addSimpleSubtermData);
	
	// fetch each subterm 
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		queryNeo4j(getMentionsPayload(name),addSimpleSubtermData);			
	}
}


function addSimpleSubtermData(data){
	addTermOrSubterm(data);
	//console.log("FINISHED SUBTERM or TERM");
	
	subTermCount++;
	if(subTermCount==subTermMax){
		showResult();
	}
}

/* GENERAL */

function addTermOrSubterm(data){
	var results = data["results"][0];
	var data2 = results["data"];
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];
		
		var check = _stack.get(name);

		if(!check){
			var newTerm = new Term(name,type,stype);
			var isDrug = data2[i]["row"][0]["isDrug"];
			//console.log(typeof isDrug);
			if(isDrug=="true"){newTerm.isDrug=true;}
			_stack.add(name,newTerm);
			newTerm.addArt(pmid,date,_stack,title);
		}else{			
			check.addArt(pmid,date,_stack,title);
		}	
	}
}

function showResult(){
	$("#loader").remove();
	makeFilters(_stack, input.value);
	makeTables(_stack, tableLimit, 0, "connected");
	makeDownloadableCSV(input.value, _stack);
}

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


function getMentionsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
		}]
	});
}

function getSubtermsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": name}
		}]
	});
}
