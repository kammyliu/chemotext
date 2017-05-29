SEARCH_TYPE = "path-subresults";	//second step is "path-final-results"

var input, selectBar;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar");
	
	makeSTypes("selectBar", false);
	makeSTypes("triType", false);

input = document.getElementById("inputbar");
	selectBar = document.getElementById("selectBar");	
});

// fields specific to each search execution
var _type; //type of B terms
var _termA;
var _stack;

var _withSubterms = false;
var _subtermMax;
var _finishedSubterms=0;
//var _subterms declared in chemotext.js

// for second stage
var _checkedTermsLeft;
var _checkedTerms = [];



function triangleSearch(){
	if (input.value == "") return;
		
	$(displayText).text("");
	$("#selections").text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();
	$("#path-subresults").hide();

	_termA = getSelfOrSynonym(input.value);
	_type = selectBar.value;
	_stack = new ThornStack();

	//console.log(term); console.log(type);	
	
	_withSubterms = subtermsCheckbox.checked;
	if(_withSubterms){
		queryNeo4j(getSubtermsPayload(_termA),findTriangleSubTerms);
	}else{
		queryNeo4j(getMentionsByTypePayload(_termA, _type),triangleSearchOnSuccess);
	}	
}

/* Without subterms */

function triangleSearchOnSuccess(data){
	console.log("Finished Search");
	
	addTermOrSubterm(_stack, data);

	showSubresults();
}	


/* Including subterms */

function findTriangleSubTerms(data){
	var results = data["results"][0]["data"];
	
	_subterms = [];
	_subtermMax = results.length + 1;
	_finishedSubterms = 0;
	
	queryNeo4j(getMentionsByTypePayload(_termA, _type), addTriangleSubTerm);
	
	for (var i=0; i< results.length ; i++){
		var name = results[i]["row"][0]["name"];	
		_subterms.push(name);
		queryNeo4j(getMentionsByTypePayload(name, _type), addTriangleSubTerm);
	}	
}

function addTriangleSubTerm(data){	
	addTermOrSubterm(_stack, data);
	_finishedSubterms++;
	
	if(_finishedSubterms ==_subtermMax){
		showSubresults();
	}
}

/* General */
function showSubresults(){

	if(_stack.length==0){
		$(displayText).text("No Results");
		$("#loader").hide();
		return;
	}
	
	SEARCH_TYPE = "path-subresults";
	makeTables(_stack,tableLimit,0);
	//setFilterHandler(stack, "");

	$(loader).hide();
	$("#results").show();
	$("#path-subresults").show();
	$("#downloadform").hide();
	//$("#filterSection").hide();
	$("#selections").text("Choose the Intermediary Terms you want to search with");

	_stack = new ThornStack();	//reset stack for stage 2
	setFinishSearchHandler();	
}

function setFinishSearchHandler(){
	var selectBar2 = document.getElementById("triType");
	
	var button = document.getElementById("finish-search");
	button.onclick = function(){
		if ($(tableform).find(":checked").length ==0){
			return;
		}
		showLoader()
		$("#results").hide();
	
		_checkedTerms = [];
		var checkedString = "Your Intermediary Terms: ";
		var csvName = "";
		
		$("td input:checked").parent().next().each(function(i,el){
			var term = $(this).text();
			_checkedTerms.push(term);
			checkedString += term + ", ";
			csvName += "_" + term;			
		});
		
		checkedString += " Your Final Term Type: " + selectBar2.value;
		$("#selections").text(checkedString);
		
		_checkedTermsLeft = _checkedTerms.length;
		for(var j=0;j<_checkedTerms.length;j++){
			console.log("Post Request");
			postRequest(_checkedTerms[j], selectBar2.value, csvName)
		}
		$(displayText).text("Intermediary Terms Done: 0 out of "+_checkedTerms.length);
	};
}


function postRequest(term, type, csvName){
	var downloadform = document.getElementById("downloadform");
	
	var payload = getMentionsByTypePayload(term, type);
		
	queryNeo4j(payload, function(data,xhr,status){
		console.log("Finished Search");
		addTermOrSubterm(_stack, data);
		
		_checkedTermsLeft--;
		$(displayText).text("Intermediary Terms Done: "+(
			_checkedTerms.length-_checkedTermsLeft)+" out of "+_checkedTerms.length); 
			
		if(_checkedTermsLeft==0){
			console.log("FINISHED: "+_stack.length)
			
			SEARCH_TYPE = "path-final-results";
			$("#results").hide();
			showResult(_stack, input.value+"_Path"+csvName, _withSubterms);
			$("#path-subresults").hide();
			$("#downloadform").show();
			$("#show-subterms").hide();
		}	
	 });
}

function makePathSubresultsTable(stack, index, indexLimit){
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}
	
	var $tbody = $(tableform).find("tbody");
	$(tableform).find("tr").remove();	
	
	$tbody.append('<tr><th></th><th>Terms</th><th>Count</th></tr>');
	
	/*append TR: 
		<tr>
			<td>
				<input type="checkbox" [checked] name="name">		
			</td>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/

	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td><input '+
			(node.isSelected?'checked ':'') +
			'type="checkbox" name="'+node.name+'"></td>');
		$tr.append('<td>'+node.name+'</td>');
		$tr.append('<td>'+node.count+'</td>');
		$tbody.append($tr);
		
		node = node.right;
	}
	
	// used to make checks persistent when the table is rebuilt (from paging)
	$("td input[type='checkbox']").click(function(){
		var term = stack.get(this.name);
		term.isSelected = this.checked;
	});
}	


function makePathFinalResultsTable(stack, index, indexLimit){
	
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}
	
	$(tableform).find("tr").remove();	
	var $tbody = $(tableform).find("tbody");
	
	$tbody.append('<tr><th>Terms</th><th>Count</th></tr>');
	
	/*append TR: 
		<tr>
			<td>name</td>
			<td>
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
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



function getMentionsByTypePayload(name, type){
	var statement;
	if(type == "Disease" || type == "Other" || type == "Chemical"){
		statement = "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{type:{type}}) return m, a";			
	}else if (type=="Drug"){
		statement = "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{isDrug:{type}}) return m, a";
		type="true";
	}else{
		statement = "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{stype:{type}}) return m, a";
	}	
	
	return JSON.stringify({
		"statements" : [{
			"statement" : statement,
			"parameters" : {"name": name, "type":type}
		}]			
	});
}


